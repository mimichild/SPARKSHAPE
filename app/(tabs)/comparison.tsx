import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { TabHeader } from '@/components/TabHeader';
import { useComparisonStore } from '@/stores/comparisonStore';
import type { BodyPhoto } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
const { width } = Dimensions.get('window');
const SLOT_H = ((width - 2) / 2) * (4 / 3);

type SlotSide = 'left' | 'right';

function PhotoPickerSheet({
  photos,
  onSelect,
  onClose,
}: {
  photos: BodyPhoto[];
  onSelect: (p: BodyPhoto) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheetStyles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      </View>
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.title}>選擇照片</Text>
        <FlashList
          data={photos}
          keyExtractor={(p) => p.id}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={sheetStyles.thumb}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Image source={{ uri: item.thumbPath }} style={sheetStyles.thumbImg} resizeMode="cover" />
              <Text style={sheetStyles.thumbDate}>
                {new Date(item.takenAt).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  title: { color: '#FFF', fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 16 },
  thumb: { width: width / 3, height: width / 3, alignItems: 'center', justifyContent: 'flex-end', padding: 3, borderWidth: 0.5, borderColor: '#333' },
  thumbImg: { ...StyleSheet.absoluteFillObject as any },
  thumbDate: { color: '#FFFFFFCC', fontSize: 9, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 3, borderRadius: 2, overflow: 'hidden' },
});

export default function ComparisonScreen() {
  const { photos } = useBodyPhotos('desc');
  const { leftPhoto, rightPhoto, setLeftPhoto, setRightPhoto } = useComparisonStore();
  const [pickerFor, setPickerFor] = useState<SlotSide | null>(null);
  const swipeHandlers = useSwipeBack();

  if (photos.length < 2) {
    return (
      <SafeAreaView style={styles.container} {...swipeHandlers}>
        <TabHeader title="身型對比" />
        <View style={styles.emptyContainer} testID="insufficient-photos">
          <Ionicons name={'git-compare-outline' as IoniconsName} size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>至少需要 2 張照片</Text>
          <Text style={styles.emptySubtitle}>先去目前身材頁拍攝身型照吧！</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} {...swipeHandlers}>
      <TabHeader title="身型對比" />

      {leftPhoto && rightPhoto ? (
        <ComparisonPanel leftPhoto={leftPhoto} rightPhoto={rightPhoto} />
      ) : (
        <View style={styles.slotsRow}>
          {/* Left slot */}
          <TouchableOpacity
            style={styles.slot}
            onPress={() => setPickerFor('left')}
            testID="left-photo-slot"
          >
            {leftPhoto ? (
              <Image source={{ uri: leftPhoto.detailPath }} style={styles.slotPhoto} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name={'add-circle-outline' as IoniconsName} size={36} color="#BBBBBB" />
                <Text style={styles.slotHint}>選擇照片</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Right slot */}
          <TouchableOpacity
            style={styles.slot}
            onPress={() => setPickerFor('right')}
            testID="right-photo-slot"
          >
            {rightPhoto ? (
              <Image source={{ uri: rightPhoto.detailPath }} style={styles.slotPhoto} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name={'add-circle-outline' as IoniconsName} size={36} color="#BBBBBB" />
                <Text style={styles.slotHint}>選擇照片</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {pickerFor && (
        <PhotoPickerSheet
          photos={photos}
          onSelect={(p) => pickerFor === 'left' ? setLeftPhoto(p) : setRightPhoto(p)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { color: '#333333', fontSize: 22, fontWeight: '700', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  slotsRow: { flexDirection: 'row', paddingHorizontal: 8, gap: 0 },
  slot: {
    flex: 1,
    height: SLOT_H,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  slotPhoto: { width: '100%', height: '100%' },
  slotHint: { color: '#AAAAAA', fontSize: 13 },
  divider: { width: 1, backgroundColor: '#E0E0E0', marginVertical: 0 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: '#333333', fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: '#888888', fontSize: 14 },
});
