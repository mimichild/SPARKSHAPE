import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { BodyPhoto } from '@/types/bodyPhoto';
import { useSettingsStore } from '@/stores/settingsStore';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
const CELL_W = Dimensions.get('window').width / 3;
const CELL_H = Math.round(CELL_W * 4 / 3); // 3:4 直式比例

interface Props {
  photo: BodyPhoto;
  onPress: (photo: BodyPhoto) => void;
  onLongPress?: (photo: BodyPhoto) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
}

export function BodyPhotoCard({ photo, onPress, onLongPress, isSelecting, isSelected }: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);

  const d = new Date(photo.takenAt);
  const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

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
        source={{ uri: photo.gridPath }}
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
    width: CELL_W,
    height: CELL_H,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    borderRadius: 2,  // 觸發 GPU 硬體加速裁切，消除鋸齒毛邊
  },
  image: { ...StyleSheet.absoluteFillObject },
  date: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    color: '#333333',
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.92)',
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
