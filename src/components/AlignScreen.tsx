import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import { useCallback, useRef, useState } from 'react';
import type { PhotoType } from '@/types/bodyPhoto';
import { useSettingsStore } from '@/stores/settingsStore';

const { width: SW, height: SH } = Dimensions.get('window');

// 3:4 對齊框
const FRAME_W = SW;
const FRAME_H = Math.round(SW * 4 / 3);
const CX = FRAME_W / 2; // 中心點 X
const CY = FRAME_H / 2; // 中心點 Y

interface Props {
  photoUri: string;
  photoType: PhotoType;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

export function AlignScreen({ photoUri, photoType, onConfirm, onCancel }: Props) {
  const [processing, setProcessing] = useState(false);
  const themeColor = useSettingsStore((s) => s.themeColor);

  const hintText = photoType === 'side'
    ? '側面拍攝：只需對齊頭頂和腳底，手臂不需對齊'
    : '拖曳或縮放照片以對齊人形輪廓';

  // ── Reanimated shared values（UI 執行緒，驅動動畫）──────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // ── JS 執行緒 ref（handleConfirm 裁切時讀取，避免跨執行緒延遲）────────
  const cropRef = useRef({ s: 1, tx: 0, ty: 0 });
  const syncCrop = useCallback(
    (s: number, x: number, y: number) => { cropRef.current = { s, tx: x, ty: y }; },
    [],
  );

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const ns = Math.max(0.3, Math.min(8, savedScale.value * e.scale));
      scale.value = ns;
      runOnJS(syncCrop)(ns, tx.value, ty.value);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      const nx = savedTx.value + e.translationX;
      const ny = savedTy.value + e.translationY;
      tx.value = nx;
      ty.value = ny;
      runOnJS(syncCrop)(scale.value, nx, ny);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  // ── 核心：將使用者拖曳/縮放的結果實際裁切並儲存 ──────────────────
  async function handleConfirm() {
    setProcessing(true);
    try {
      const { s, tx: transX, ty: transY } = cropRef.current;

      // ★ 關鍵修正：Android 的 Image.getSize() 回傳的是 RAW（未旋轉）尺寸。
      //   改用 manipulateAsync 雙重翻轉（恆等變換）來取得「顯示方向」的正確尺寸：
      //   1. 套用 EXIF 旋轉（expo-image-manipulator 讀圖時一律套用 EXIF）
      //   2. 翻轉兩次 = 不改變畫面，但強制把 EXIF 旋轉烤進像素
      //   3. normalized.width/height = 實際顯示尺寸，與 AlignScreen 顯示一致
      const normalized = await manipulateAsync(
        photoUri,
        [
          { flip: FlipType.Horizontal },
          { flip: FlipType.Horizontal },
        ],
        { compress: 0.99, format: SaveFormat.JPEG },
      );
      const imgW = normalized.width;
      const imgH = normalized.height;

      // resizeMode="cover" 的縮放比例與偏移（使用正確的顯示尺寸）
      const coverScale = Math.max(FRAME_W / imgW, FRAME_H / imgH);
      const offsetX = (imgW * coverScale - FRAME_W) / 2;
      const offsetY = (imgH * coverScale - FRAME_H) / 2;

      // 反向計算可見範圍
      const visLeft   = (0       - CX - transX) / s + CX;
      const visTop    = (0       - CY - transY) / s + CY;
      const visRight  = (FRAME_W - CX - transX) / s + CX;
      const visBottom = (FRAME_H - CY - transY) / s + CY;

      const rawX = (visLeft + offsetX) / coverScale;
      const rawY = (visTop  + offsetY) / coverScale;
      const rawW = (visRight  - visLeft)  / coverScale;
      const rawH = (visBottom - visTop)   / coverScale;

      const cropX = Math.max(0, Math.round(rawX));
      const cropY = Math.max(0, Math.round(rawY));
      const cropW = Math.min(imgW - cropX, Math.max(1, Math.round(rawW)));
      const cropH = Math.min(imgH - cropY, Math.max(1, Math.round(rawH)));

      // 從 EXIF 已正規化的圖片裁切
      const result = await manipulateAsync(
        normalized.uri,
        [
          { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
          { resize: { width: 1080 } },
        ],
        { compress: 0.9, format: SaveFormat.JPEG },
      );

      onConfirm(result.uri);
    } catch (err) {
      console.warn('AlignScreen crop failed, using original:', err);
      onConfirm(photoUri);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* 3:4 對齊框 */}
      <GestureDetector gesture={gesture}>
        <View style={styles.frame} collapsable={false}>
          {/* 照片（可拖曳/縮放） */}
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          </Animated.View>

          {/* 人形輪廓：置中並縮小，頭頂/腳底留白不碰框 */}
          <View style={styles.silhouetteWrapper} pointerEvents="none">
            <Image
              source={require('../../assets/images/silhouette.png')}
              style={styles.silhouette}
              resizeMode="stretch"
            />
          </View>

          {/* 框線 */}
          <View style={styles.frameBorder} pointerEvents="none" />
        </View>
      </GestureDetector>

      {/* 底部操作區：背景填主題色 */}
      <View style={[styles.footer, { backgroundColor: themeColor }]}>
        <Text style={[styles.hint, photoType === 'side' && styles.hintSide]}>{hintText}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            disabled={processing}
            testID="cancel-btn"
          >
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={processing}
            testID="confirm-btn"
          >
            {processing ? (
              <ActivityIndicator color={themeColor} />
            ) : (
              <Text style={[styles.confirmText, { color: themeColor }]}>確認儲存</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  photo: {
    width: FRAME_W,
    height: FRAME_H,
  },
  // 輪廓圖：縮到 84%，上下各留 8% 讓頭頂/腳底不碰框
  silhouetteWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouette: {
    width:   Math.round(FRAME_W * 0.94),
    height:  Math.round(FRAME_H * 0.94),
    opacity: 0.65,
  },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#000',
  },
  hint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  hintSide: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',   // 白底，在主題色 footer 上形成對比
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.4)' },
  confirmText: { fontSize: 16, fontWeight: '700' },   // 顏色由 inline 傳入
});
