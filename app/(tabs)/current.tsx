import { Image, StyleSheet, TouchableOpacity, View, Dimensions, Text, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { CameraSheet } from '@/components/CameraSheet';
import { AlignScreen } from '@/components/AlignScreen';
import { saveBodyPhoto } from '@/services/photoStorageService';
import type { BodyPhotoInput } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const { width } = Dimensions.get('window');

export default function CurrentBodyScreen() {
  const { photos, loading, addPhoto } = useBodyPhotos('desc');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alignUri, setAlignUri] = useState<string | null>(null);

  const latestPhoto = photos[0] ?? null;

  async function handleConfirmAlign(uri: string) {
    setAlignUri(null);
    const photoId = `photo-${Date.now()}`;
    const paths = await saveBodyPhoto(uri, photoId);
    const input: BodyPhotoInput = {
      takenAt: new Date().toISOString(),
      note: null,
      ...paths,
    };
    await addPhoto(input);
  }

  if (alignUri) {
    return (
      <Modal visible animationType="slide" statusBarTranslucent>
        {/* GestureHandlerRootView is required inside Modal on Android (new arch) */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AlignScreen
            photoUri={alignUri}
            onConfirm={handleConfirmAlign}
            onCancel={() => setAlignUri(null)}
          />
        </GestureHandlerRootView>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>目前身材</Text>

      {!loading && latestPhoto ? (
        <View style={styles.photoWrapper}>
          <Image
            source={{ uri: latestPhoto.detailPath }}
            style={styles.photo}
            resizeMode="cover"
            testID="latest-photo"
          />
          <Text style={styles.photoDate}>
            {new Date(latestPhoto.takenAt).toLocaleDateString('zh-TW')}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyContainer} testID="empty-state">
          <Ionicons name={'body-outline' as IoniconsName} size={80} color="#444444" />
          <Text style={styles.emptyTitle}>還沒有身型照片</Text>
          <Text style={styles.emptySubtitle}>
            點擊右下角的相機按鈕{'\n'}開始記錄你的身材變化
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
        testID="camera-fab"
      >
        <Ionicons name={'camera' as IoniconsName} size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <CameraSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onPhotoPicked={(uri) => {
          setSheetOpen(false);
          setAlignUri(uri);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  photoWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  photo: {
    width,
    height: width * (4 / 3),
  },
  photoDate: {
    color: '#888888',
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyTitle: { color: '#CCCCCC', fontSize: 20, fontWeight: '600' },
  emptySubtitle: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
});
