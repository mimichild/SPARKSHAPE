import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onPhotoPicked: (uri: string) => void;
}

export function CameraSheet({ visible, onClose, onPhotoPicked }: Props) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  async function handleTakePhoto() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          '需要相機權限',
          '請前往系統設定 > SPARKSHAPE > 相機，開啟相機存取權限。',
          [{ text: '確定' }],
        );
        return;
      }
    }
    onClose();
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      aspect: [3, 4],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoPicked(result.assets[0].uri);
    }
  }

  async function handlePickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '需要相簿權限',
        '請前往系統設定 > SPARKSHAPE > 照片，開啟相簿存取權限。',
        [{ text: '確定' }],
      );
      return;
    }
    onClose();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoPicked(result.assets[0].uri);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>新增身型照片</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={handleTakePhoto}
          testID="take-photo-btn"
        >
          <Ionicons name={'camera' as IoniconsName} size={24} color="#FF6B35" />
          <Text style={styles.optionText}>拍照</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={handlePickFromLibrary}
          testID="pick-library-btn"
        >
          <Ionicons name={'images' as IoniconsName} size={24} color="#FF6B35" />
          <Text style={styles.optionText}>從相簿選取</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelOption} onPress={onClose} testID="sheet-cancel">
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  cancelOption: {
    marginTop: 8,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    alignItems: 'center',
  },
  cancelText: {
    color: '#888888',
    fontSize: 17,
    fontWeight: '600',
  },
});
