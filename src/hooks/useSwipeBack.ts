import { useCallback, useRef } from 'react';
import { BackHandler, PanResponder } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

/**
 * 兩種方式回首頁：
 * 1. Android 系統返回鍵 / 系統邊緣滑動手勢（BackHandler）
 * 2. 自定義左邊緣 PanResponder（明確的左→右滑動）
 */
export function useSwipeBack() {
  // Android 系統返回事件（硬體鍵 + 系統手勢）
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/');
        return true; // 攔截，不讓 React Navigation 自行處理
      });
      return () => sub.remove();
    }, []),
  );

  // 自定義 PanResponder（左邊緣 60dp 內向右滑 > 80dp）
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
