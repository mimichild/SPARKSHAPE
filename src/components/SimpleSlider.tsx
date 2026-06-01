import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

interface Props {
  value: number;       // 0.0 ~ 1.0
  onChange: (v: number) => void;
  color?: string;
  leftLabel?: string;
  rightLabel?: string;
}

const TRACK_H = 4;
const THUMB_D = 22;

export function SimpleSlider({
  value,
  onChange,
  color = '#D09089',
  leftLabel,
  rightLabel,
}: Props) {
  // 用 ref 存 onChange，避免 PanResponder closure 過期問題
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // track 在螢幕上的絕對 X 座標與寬度
  const trackPageX = useRef(0);
  const trackWidth = useRef(0);
  const trackRef   = useRef<View>(null);

  function measureTrack() {
    trackRef.current?.measure((_x, _y, w, _h, pageX) => {
      trackWidth.current = w;
      trackPageX.current = pageX;
    });
  }

  function applyPageX(pageX: number) {
    if (trackWidth.current <= 0) return;
    const relX = pageX - trackPageX.current;
    onChangeRef.current(Math.max(0, Math.min(1, relX / trackWidth.current)));
  }

  // PanResponder 使用 pageX（螢幕絕對座標），不論手指移到哪裡都能正確計算
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        measureTrack();           // 重新量測，以防佈局變化
        applyPageX(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        applyPageX(evt.nativeEvent.pageX);
      },
    }),
  ).current;

  const pct = Math.max(0, Math.min(1, value));

  return (
    <View style={s.root}>
      {(leftLabel || rightLabel) && (
        <View style={s.labels}>
          {leftLabel  && <Text style={s.label}>{leftLabel}</Text>}
          {rightLabel && <Text style={s.label}>{rightLabel}</Text>}
        </View>
      )}
      <View
        ref={trackRef}
        style={s.trackWrap}
        {...pan.panHandlers}
        onLayout={measureTrack}
      >
        {/* 底色軌道 */}
        <View style={s.track} />
        {/* 填色 */}
        <View style={[s.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
        {/* 拇指 */}
        <View style={[s.thumb, { left: `${pct * 100}%` as any, borderColor: color }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { paddingVertical: 4 },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { fontSize: 11, color: '#999', letterSpacing: 0.3 },
  trackWrap: {
    height: THUMB_D,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: TRACK_H,
    backgroundColor: '#E8E8E8',
    borderRadius: TRACK_H / 2,
  },
  fill: {
    position: 'absolute',
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_D,
    height: THUMB_D,
    borderRadius: THUMB_D / 2,
    backgroundColor: '#FFF',
    borderWidth: 2,
    marginLeft: -(THUMB_D / 2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
