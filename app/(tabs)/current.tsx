import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useDailyNote } from '@/hooks/useDailyNote';
import { CameraSheet } from '@/components/CameraSheet';
import { AlignScreen } from '@/components/AlignScreen';
import { ReviewScreen } from '@/components/ReviewScreen';
import { TabHeader } from '@/components/TabHeader';
import { saveBodyPhoto } from '@/services/photoStorageService';
import { deleteBodyPhotoFiles } from '@/services/photoStorageService';
import { useSettingsStore } from '@/stores/settingsStore';
import { getMotivationalMessage } from '@/utils/motivationalMessages';
import type { BodyMeasurements, BodyPhoto, BodyPhotoInput, PhotoType } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const { width: SW } = Dimensions.get('window');
const PHOTO_W = (SW - 2) / 2;
const PHOTO_H = Math.round(PHOTO_W * (4 / 3));

// 對齊中介資料（新增流程用）
interface AlignTarget {
  rawUri:    string;
  photoType: PhotoType;
}

// Review 中介資料（新增 or 編輯）
interface ReviewTarget {
  uri:      string;
  photoType: PhotoType;
  editId?:  string;
  initialBrightness?:   number;
  initialContrast?:     number;
  initialTakenAt?:      string;
  initialMeasurements?: Partial<BodyMeasurements>;
}

export default function CurrentBodyScreen() {
  const { photos, loading, addPhoto, replaceDaily, removePhoto, updatePhotoMeta } = useBodyPhotos('desc');
  const { content: noteContent, save: saveNote, loaded: noteLoaded } = useDailyNote();
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [alignTarget,  setAlignTarget]  = useState<AlignTarget | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [noteText, setNoteText] = useState('');

  const { pendingCameraOpen, clearPendingCameraOpen, autoSavePhotos, themeColor } =
    useSettingsStore();
  const swipeHandlers = useSwipeBack();

  useEffect(() => { if (noteLoaded) setNoteText(noteContent); }, [noteLoaded, noteContent]);
  useEffect(() => {
    if (pendingCameraOpen) { clearPendingCameraOpen(); setSheetOpen(true); }
  }, [pendingCameraOpen]);

  const latestFront = photos.find((p) => p.photoType === 'front') ?? null;
  const latestSide  = photos.find((p) => p.photoType === 'side')  ?? null;
  const date        = (latestFront ?? latestSide)?.takenAt ?? null;

  // 找最近一次有填寫測量數據的照片，用於自動帶入
  const lastWithData = photos.find(
    (p) => p.weight !== null || p.chest !== null || p.waist !== null ||
           p.lowerWaist !== null || p.hip !== null,
  ) ?? null;

  // 鼓勵語
  const sessionDates = new Set(photos.map((p) => p.takenAt.slice(0, 10)));
  const firstDate    = photos.length > 0 ? new Date(photos[photos.length - 1].takenAt) : new Date();
  const daysSince    = Math.floor((Date.now() - firstDate.getTime()) / 86400000);
  const motivation   = getMotivationalMessage({
    photoCount: photos.length, sessionCount: sessionDates.size,
    daysSinceFirst: daysSince, today: new Date(),
  });

  // ── 流程：Camera Sheet → AlignScreen → ReviewScreen ──────────────────────

  function openReviewForNew(aligned: string, photoType: PhotoType) {
    setAlignTarget(null);
    setReviewTarget({
      uri:       aligned,
      photoType,
      // 自動帶入上次測量數據（使用者可以直接按確認或修改）
      initialMeasurements: lastWithData
        ? { weight: lastWithData.weight, chest: lastWithData.chest,
            waist: lastWithData.waist,   lowerWaist: lastWithData.lowerWaist,
            hip:   lastWithData.hip }
        : undefined,
    });
  }

  async function handleReviewConfirm(
    result: Parameters<ComponentProps<typeof ReviewScreen>['onConfirm']>[0],
  ) {
    const target = reviewTarget;
    setReviewTarget(null);
    if (!target) return;

    if (target.editId) {
      // ── 編輯模式：只更新 meta，不建立新記錄 ──
      await updatePhotoMeta(target.editId, {
        takenAt:     result.takenAt,
        brightness:  result.brightness,
        contrast:    result.contrast,
        weight:      result.weight,
        chest:       result.chest,
        waist:       result.waist,
        lowerWaist:  result.lowerWaist,
        hip:         result.hip,
      });
    } else {
      // ── 新增模式：儲存照片檔案 + 新建記錄（取代當天同類型舊照）──
      if (autoSavePhotos) {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') await MediaLibrary.saveToLibraryAsync(target.uri);
        } catch {}
      }
      const photoId = `photo-${Date.now()}`;
      const paths   = await saveBodyPhoto(target.uri, photoId);
      const input: BodyPhotoInput = {
        takenAt: result.takenAt, note: null, ...paths,
        photoType:  target.photoType,
        brightness: result.brightness,
        contrast:   result.contrast,
        weight:     result.weight,
        chest:      result.chest,
        waist:      result.waist,
        lowerWaist: result.lowerWaist,
        hip:        result.hip,
      };
      await replaceDaily(input);  // 自動刪除當天同類型舊照
    }
  }

  // ── 點擊已有照片 → 編輯 / 刪除 ──────────────────────────────────────────

  function handlePhotoPress(photo: BodyPhoto) {
    const title = photo.photoType === 'front' ? '正面照' : '側面照';
    Alert.alert(title, '請選擇操作', [
      {
        text: '編輯照片',
        onPress: () =>
          setReviewTarget({
            uri:       photo.fullPath,
            photoType: photo.photoType,
            editId:    photo.id,
            initialBrightness:   photo.brightness,
            initialContrast:     photo.contrast,
            initialTakenAt:      photo.takenAt,
            initialMeasurements: {
              weight: photo.weight, chest: photo.chest,
              waist:  photo.waist,  lowerWaist: photo.lowerWaist,
              hip:    photo.hip,
            },
          }),
      },
      {
        text: '刪除照片',
        style: 'destructive',
        onPress: () =>
          Alert.alert('確認刪除', '刪除後無法復原，確定要刪除這張照片嗎？', [
            {
              text: '刪除',
              style: 'destructive',
              onPress: async () => {
                await removePhoto(photo.id);
                await deleteBodyPhotoFiles(photo.id).catch(() => {});
              },
            },
            { text: '取消', style: 'cancel' },
          ]),
      },
      { text: '取消', style: 'cancel' },
    ]);
  }

  // ── Modal 顯示 ───────────────────────────────────────────────────────────

  if (alignTarget) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlignScreen
            photoUri={alignTarget.rawUri}
            photoType={alignTarget.photoType}
            onConfirm={(aligned) => openReviewForNew(aligned, alignTarget.photoType)}
            onCancel={() => setAlignTarget(null)}
          />
        </GestureHandlerRootView>
      </Modal>
    );
  }

  if (reviewTarget) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ReviewScreen
            photoUri={reviewTarget.uri}
            photoType={reviewTarget.photoType}
            mode={reviewTarget.editId ? 'edit' : 'new'}
            initialBrightness={reviewTarget.initialBrightness}
            initialContrast={reviewTarget.initialContrast}
            initialTakenAt={reviewTarget.initialTakenAt}
            initialMeasurements={reviewTarget.initialMeasurements}
            onConfirm={handleReviewConfirm}
            onRetake={() => setReviewTarget(null)}
          />
        </GestureHandlerRootView>
      </Modal>
    );
  }

  // ── 主畫面 ───────────────────────────────────────────────────────────────

  const hasAny      = latestFront !== null || latestSide !== null;
  const measureSrc  = latestFront ?? latestSide;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: themeColor }]} {...swipeHandlers}>
      <TabHeader title="目前身材" />

      <View style={s.contentArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 照片 ── */}
          {!loading && hasAny ? (
            <View style={s.photoSection}>
              {date && (
                <Text style={s.dateLabel}>
                  {new Date(date).toLocaleDateString('zh-TW', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </Text>
              )}
              <View style={s.photosRow}>
                {/* 正面 */}
                <View style={s.photoSlot}>
                  {latestFront ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => handlePhotoPress(latestFront)}>
                      <Image
                        source={{ uri: latestFront.detailPath }}
                        style={[s.photo, { filter: [{ brightness: latestFront.brightness }, { contrast: latestFront.contrast }] } as any]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[s.photoPlaceholder, { borderColor: themeColor }]} onPress={() => setSheetOpen(true)}>
                      <Ionicons name={'camera-outline' as IoniconsName} size={28} color={themeColor} />
                      <Text style={[s.placeholderLabel, { color: themeColor }]}>正面照</Text>
                    </TouchableOpacity>
                  )}
                  <View style={[s.typeTag, { backgroundColor: themeColor }]}>
                    <Text style={s.typeTagText}>正面</Text>
                  </View>
                </View>

                <View style={s.photoDivider} />

                {/* 側面 */}
                <View style={s.photoSlot}>
                  {latestSide ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => handlePhotoPress(latestSide)}>
                      <Image
                        source={{ uri: latestSide.detailPath }}
                        style={[s.photo, { filter: [{ brightness: latestSide.brightness }, { contrast: latestSide.contrast }] } as any]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[s.photoPlaceholder, { borderColor: '#7BAFC4' }]} onPress={() => setSheetOpen(true)}>
                      <Ionicons name={'camera-outline' as IoniconsName} size={28} color="#7BAFC4" />
                      <Text style={[s.placeholderLabel, { color: '#7BAFC4' }]}>側面照</Text>
                    </TouchableOpacity>
                  )}
                  <View style={[s.typeTag, { backgroundColor: '#7BAFC4' }]}>
                    <Text style={s.typeTagText}>側面</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : !loading && (
            <View style={s.emptyContainer}>
              <Ionicons name={'body-outline' as IoniconsName} size={72} color="#CCCCCC" />
              <Text style={s.emptyTitle}>還沒有身型照片</Text>
              <Text style={s.emptySubtitle}>點擊右下角的相機按鈕{'\n'}開始記錄你的身材變化</Text>
            </View>
          )}

          {/* ── 身體數據 ── */}
          {measureSrc && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={[s.sectionDot, { backgroundColor: themeColor }]} />
                <Text style={s.sectionTitle}>身體數據</Text>
              </View>
              <View style={s.measureGrid}>
                {([
                  { label: '體重',   value: measureSrc.weight,     unit: 'kg' },
                  { label: '胸圍',   value: measureSrc.chest,      unit: 'cm' },
                  { label: '腰圍',   value: measureSrc.waist,      unit: 'cm' },
                  { label: '下腰圍', value: measureSrc.lowerWaist, unit: 'cm' },
                  { label: '臀圍',   value: measureSrc.hip,        unit: 'cm' },
                ] as const)
                  .filter((item) => item.value !== null)
                  .map((item) => (
                    <View key={item.label} style={[s.measureChip, { borderColor: themeColor + '55' }]}>
                      <Text style={s.measureChipLabel}>{item.label}</Text>
                      <Text style={[s.measureChipValue, { color: themeColor }]}>
                        {item.value}
                        <Text style={s.measureChipUnit}> {item.unit}</Text>
                      </Text>
                    </View>
                  ))
                }
              </View>
            </View>
          )}

          {/* ── 鼓勵語 ── */}
          <View style={[s.motivationCard, { borderLeftColor: themeColor }]}>
            <Ionicons name={'sparkles' as IoniconsName} size={16} color={themeColor} style={{ marginTop: 1 }} />
            <Text style={s.motivationText}>{motivation}</Text>
          </View>

          {/* ── 今日感受（選填） ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: '#7BAFC4' }]} />
              <Text style={s.sectionTitle}>
                今日感受 <Text style={s.optional}>（選填）</Text>
              </Text>
            </View>
            <TextInput
              style={[s.noteInput, { borderColor: themeColor + '55' }]}
              placeholder="記錄今天對身形的感受、心情或目標…"
              placeholderTextColor="#BBBBBB"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={noteText}
              onChangeText={setNoteText}
              onBlur={() => saveNote(noteText)}
            />
          </View>

          <View style={{ height: 88 }} />
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: themeColor }]}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
        testID="camera-fab"
      >
        <Ionicons name={'camera' as IoniconsName} size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <CameraSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPhotoPicked={(uri, photoType) => {
          setSheetOpen(false);
          setAlignTarget({ rawUri: uri, photoType });
        }}
      />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  contentArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  photoSection: { paddingTop: 12 },
  dateLabel: { color: '#666', fontSize: 13, textAlign: 'center', marginBottom: 10, letterSpacing: 0.5 },
  photosRow:   { flexDirection: 'row' },
  photoSlot:   { width: PHOTO_W, position: 'relative' },
  photo:       { width: PHOTO_W, height: PHOTO_H },
  photoPlaceholder: {
    width: PHOTO_W, height: PHOTO_H, borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F8F8F8',
  },
  placeholderLabel: { fontSize: 13, fontWeight: '600' },
  typeTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  typeTagText: { color: '#FFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  photoDivider: { width: 1, backgroundColor: '#E0E0E0' },

  emptyContainer: {
    alignItems: 'center', justifyContent: 'center',
    gap: 14, paddingHorizontal: 40, paddingVertical: 48,
  },
  emptyTitle:    { color: '#333', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#888', fontSize: 13, lineHeight: 20, textAlign: 'center' },

  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sectionDot:    { width: 6, height: 6, borderRadius: 3 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#333', letterSpacing: 0.5 },
  optional:      { fontSize: 12, color: '#AAAAAA', fontWeight: '400' },

  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measureChip: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 90, backgroundColor: '#FAFAFA',
  },
  measureChipLabel: { fontSize: 11, color: '#999', marginBottom: 4, fontWeight: '500' },
  measureChipValue: { fontSize: 18, fontWeight: '700' },
  measureChipUnit:  { fontSize: 11, color: '#AAA', fontWeight: '400' },

  motivationCard: {
    marginHorizontal: 16, marginTop: 20, padding: 16,
    backgroundColor: '#FAFAFA', borderRadius: 12, borderLeftWidth: 3,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  motivationText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 22 },

  noteInput: {
    borderWidth: 1.5, borderRadius: 12, padding: 14,
    fontSize: 14, lineHeight: 22, color: '#333',
    minHeight: 100, backgroundColor: '#FAFAFA',
  },

  fab: {
    position: 'absolute', bottom: 36, right: 24,
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
});
