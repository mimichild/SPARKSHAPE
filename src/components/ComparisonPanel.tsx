import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { BodyPhoto } from '@/types/bodyPhoto';

const { width } = Dimensions.get('window');
const PANEL_W = (width - 2) / 2;

interface PanelProps {
  photo: BodyPhoto;
  testId: string;
}

function ZoomablePhoto({ photo, testId }: PanelProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(0.5, Math.min(5, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .onUpdate((e) => { tx.value = savedTx.value + e.translationX; ty.value = savedTy.value + e.translationY; })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const dateStr = new Date(photo.takenAt).toLocaleDateString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return (
    <View style={panelStyles.wrapper}>
      <View style={panelStyles.photoFrame} testID={testId}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
            <Image source={{ uri: photo.fullPath }} style={panelStyles.photo} resizeMode="cover" />
          </Animated.View>
        </GestureDetector>
      </View>
      <Text style={panelStyles.date}>{dateStr}</Text>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center' },
  photoFrame: {
    width: PANEL_W,
    height: PANEL_W * (4 / 3),
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  photo: { width: PANEL_W, height: PANEL_W * (4 / 3) },
  date: { color: '#666666', fontSize: 11, marginTop: 6 },
});

interface ComparisonPanelProps {
  leftPhoto: BodyPhoto;
  rightPhoto: BodyPhoto;
}

export function ComparisonPanel({ leftPhoto, rightPhoto }: ComparisonPanelProps) {
  const diffDays = Math.abs(
    Math.round(
      (new Date(rightPhoto.takenAt).getTime() - new Date(leftPhoto.takenAt).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const diffLabel =
    diffDays < 30
      ? `${diffDays} 天`
      : diffDays < 365
        ? `${Math.round(diffDays / 30)} 個月`
        : `${(diffDays / 365).toFixed(1)} 年`;

  return (
    <View style={styles.container}>
      <View style={styles.panels}>
        <ZoomablePhoto photo={leftPhoto} testId="left-panel" />
        <View style={styles.divider} />
        <ZoomablePhoto photo={rightPhoto} testId="right-panel" />
      </View>
      <Text style={styles.diff} testID="time-diff">相差 {diffLabel}</Text>
      <Text style={styles.hint}>雙指縮放可放大觀看</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panels: { flexDirection: 'row', flex: 1 },
  divider: { width: 2, backgroundColor: '#2A2A2A' },
  diff: { color: '#555555', fontSize: 13, textAlign: 'center', marginTop: 12 },
  hint: { color: '#AAAAAA', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
