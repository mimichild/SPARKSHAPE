import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { BodyPhoto } from '@/types/bodyPhoto';
import { useSettingsStore } from '@/stores/settingsStore';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
const CELL_SIZE = Dimensions.get('window').width / 3;

interface Props {
  photo: BodyPhoto;
  onPress: (photo: BodyPhoto) => void;
  onLongPress?: (photo: BodyPhoto) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
}

export function BodyPhotoCard({ photo, onPress, onLongPress, isSelecting, isSelected }: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);

  const dateStr = new Date(photo.takenAt).toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => onPress(photo)}
      onLongPress={() => onLongPress?.(photo)}
      activeOpacity={0.8}
      delayLongPress={400}
      testID={`photo-card-${photo.id}`}
    >
      <Image
        source={{ uri: photo.thumbPath }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.date}>{dateStr}</Text>

      {/* 選取中：選取圈 */}
      {isSelecting && (
        <View
          style={[
            styles.selectCircle,
            isSelected && { backgroundColor: themeColor, borderColor: themeColor },
          ]}
        >
          {isSelected && (
            <Ionicons name={'checkmark' as IoniconsName} size={13} color="#FFF" />
          )}
        </View>
      )}

      {/* 已選：半透明遮罩 */}
      {isSelected && (
        <View style={[styles.selectedOverlay, { borderColor: themeColor }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 4,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  image: { ...StyleSheet.absoluteFillObject },
  date: {
    color: '#FFFFFFCC',
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  selectCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
  },
});
