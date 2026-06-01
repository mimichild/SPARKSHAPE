import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { PhotoType } from '@/types/bodyPhoto';
import { useSettingsStore } from '@/stores/settingsStore';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onPhotoPicked: (uri: string, photoType: PhotoType) => void;
}

/**
 * 正規化 EXIF 旋轉：讓 Image.getSize() 與畫面顯示方向一致，
 * 避免裁切座標計算錯誤。
 */
async function normalizeOrientation(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [], {
    compress: 0.95,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}

export function CameraSheet({ visible, onClose, onPhotoPicked }: Props) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const themeColor = useSettingsStore((s) => s.themeColor);

  async function shoot(photoType: PhotoType) {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('需要相機權限', '請前往系統設定 > SPARKSHAPE > 相機，開啟相機存取權限。', [{ text: '確定' }]);
        return;
      }
    }
    onClose();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false, // 使用我們自己的 AlignScreen 對齊
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = await normalizeOrientation(result.assets[0].uri);
      onPhotoPicked(uri, photoType);
    }
  }

  async function pick(photoType: PhotoType) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相簿權限', '請前往系統設定 > SPARKSHAPE > 照片，開啟相簿存取權限。', [{ text: '確定' }]);
      return;
    }
    onClose();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false, // 跳過系統裁切介面，直接進入 AlignScreen
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      // 正規化 EXIF 旋轉，確保裁切計算正確
      const uri = await normalizeOrientation(result.assets[0].uri);
      onPhotoPicked(uri, photoType);
    }
  }

  const options: {
    label: string;
    icon: IoniconsName;
    action: () => void;
    accent: string;
  }[] = [
    { label: '拍正面照',  icon: 'camera',         action: () => shoot('front'), accent: themeColor },
    { label: '拍側面照',  icon: 'camera-outline',  action: () => shoot('side'),  accent: '#7BAFC4' },
    { label: '上傳正面照', icon: 'images',          action: () => pick('front'),  accent: themeColor },
    { label: '上傳側面照', icon: 'images-outline',  action: () => pick('side'),   accent: '#7BAFC4' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>新增身型照片</Text>
        {options.map((opt) => (
          <TouchableOpacity key={opt.label} style={s.option} onPress={opt.action}>
            <Ionicons name={opt.icon} size={24} color={opt.accent} />
            <Text style={[s.optionText, { color: opt.accent }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.cancelOption} onPress={onClose} testID="sheet-cancel">
          <Text style={s.cancelText}>取消</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#444', borderRadius: 2,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  title: {
    color: '#FFFFFF', fontSize: 17, fontWeight: '700',
    textAlign: 'center', paddingVertical: 16,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A',
  },
  optionText: { fontSize: 17, fontWeight: '500' },
  cancelOption: {
    marginTop: 8, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#2A2A2A', alignItems: 'center',
  },
  cancelText: { color: '#888', fontSize: 17, fontWeight: '600' },
});
