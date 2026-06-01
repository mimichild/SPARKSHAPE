import { Image, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import type { BodyPhoto } from '@/types/bodyPhoto';

const CELL_SIZE = Dimensions.get('window').width / 3;

interface Props {
  photo: BodyPhoto;
  onPress: (photo: BodyPhoto) => void;
}

export function BodyPhotoCard({ photo, onPress }: Props) {
  const dateStr = new Date(photo.takenAt).toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => onPress(photo)}
      activeOpacity={0.85}
      testID={`photo-card-${photo.id}`}
    >
      <Image
        source={{ uri: photo.thumbPath }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.date}>{dateStr}</Text>
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
  image: {
    ...StyleSheet.absoluteFillObject,
  },
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
});
