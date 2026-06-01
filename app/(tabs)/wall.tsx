import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import type { ComponentProps } from 'react';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { BodyPhotoCard } from '@/components/BodyPhotoCard';
import { PhotoPreviewModal } from '@/components/PhotoPreviewModal';
import { TabHeader } from '@/components/TabHeader';
import type { BodyPhoto } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export default function PhotoWallScreen() {
  const { photos, loading } = useBodyPhotos('desc');
  const [preview, setPreview] = useState<BodyPhoto | null>(null);
  const swipeHandlers = useSwipeBack();

  if (!loading && photos.length === 0) {
    return (
      <SafeAreaView style={styles.container} {...swipeHandlers}>
        <TabHeader title="照片牆" />
        <View style={styles.emptyContainer} testID="empty-wall">
          <Ionicons name={'images-outline' as IoniconsName} size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>還沒有照片</Text>
          <Text style={styles.emptySubtitle}>去目前身材頁拍第一張吧！</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} {...swipeHandlers}>
      <TabHeader title="照片牆" />

      <FlashList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <BodyPhotoCard photo={item} onPress={setPreview} />
        )}
      />

      <PhotoPreviewModal photo={preview} onClose={() => setPreview(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: { color: '#333333', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#888888', fontSize: 14 },
});
