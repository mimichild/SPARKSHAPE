import { useRef } from 'react';
import { PanResponder } from 'react-native';
import { router } from 'expo-router';

/**
 * 從左側邊緣向右滑動 → 返回首頁。
 * 僅在觸控起點 X < 60dp 時才接管手勢，不影響頁面內其他操作。
 */
export function useSwipeBack() {
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) =>
        evt.nativeEvent.pageX < 60,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dx > 8 && Math.abs(gs.dy) < gs.dx,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 80 && gs.vx > 0.25) {
          router.replace('/');
        }
      },
    }),
  ).current;

  return pan.panHandlers;
}
