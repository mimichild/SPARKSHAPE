import { Modal, Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { BodyPhoto } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
const { width } = Dimensions.get('window');

interface Props {
  photo: BodyPhoto | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photo, onClose }: Props) {
  if (!photo) return null;

  const dateStr = new Date(photo.takenAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.container} testID="preview-modal">
        <Image
          source={{ uri: photo.detailPath }}
          style={styles.photo}
          resizeMode="contain"
          testID="preview-image"
        />
        <Text style={styles.date} testID="preview-date">{dateStr}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} testID="close-preview">
          <Ionicons name={'close' as IoniconsName} size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width,
    height: width * (4 / 3),
  },
  date: {
    color: '#AAAAAA',
    fontSize: 15,
    marginTop: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
