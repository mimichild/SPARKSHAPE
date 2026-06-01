import { Image, StyleSheet, View } from 'react-native';

interface Props {
  opacity?: number;
}

export function SilhouetteOverlay({ opacity = 0.35 }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require('../../assets/images/silhouette.png')}
        style={[StyleSheet.absoluteFill, { opacity, resizeMode: 'contain' }]}
        testID="silhouette-image"
      />
    </View>
  );
}
