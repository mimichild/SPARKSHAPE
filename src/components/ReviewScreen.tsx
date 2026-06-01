import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SimpleSlider } from './SimpleSlider';
import { useSettingsStore } from '@/stores/settingsStore';
import type { BodyMeasurements, PhotoType } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const { width: SW } = Dimensions.get('window');
const PREVIEW_H = Math.round(SW * (4 / 3));

// ── 型別 ────────────────────────────────────────────────────────────────────

export interface ReviewResult extends BodyMeasurements {
  brightness: number;
  contrast:   number;
  takenAt:    string;   // ISO 8601
}

interface MeasurementField {
  key: keyof BodyMeasurements;
  label: string;
  unit: string;
}

const FIELDS: MeasurementField[] = [
  { key: 'weight',     label: '體重',   unit: 'kg' },
  { key: 'chest',      label: '胸圍',   unit: 'cm' },
  { key: 'waist',      label: '腰圍',   unit: 'cm' },
  { key: 'lowerWaist', label: '下腰圍', unit: 'cm' },
  { key: 'hip',        label: '臀圍',   unit: 'cm' },
];

// 滑桿 0~1 → 倍率 0~2（0.5 = 1.0× 不調整）
function toMultiplier(v: number) { return v * 2.0; }

interface Props {
  photoUri: string;
  photoType: PhotoType;
  mode?: 'new' | 'edit';
  initialBrightness?:   number;
  initialContrast?:     number;
  initialMeasurements?: Partial<BodyMeasurements>;
  initialTakenAt?:      string;
  onConfirm: (result: ReviewResult) => void;
  onRetake:  () => void;
}

// ── 小月曆元件 ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function MiniCalendar({
  selected,
  onSelect,
  themeColor,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  themeColor: string;
}) {
  const [viewYear,  setViewYear]  = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const today      = new Date();
  const todayKey   = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const selectedKey = `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={cal.wrapper}>
      {/* 月份導航 */}
      <View style={cal.nav}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Ionicons name={'chevron-back' as IoniconsName} size={18} color="#555" />
        </TouchableOpacity>
        <Text style={cal.navTitle}>{viewYear}年{viewMonth + 1}月</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Ionicons name={'chevron-forward' as IoniconsName} size={18} color="#555" />
        </TouchableOpacity>
      </View>

      {/* 星期標題 */}
      <View style={cal.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={cal.weekday}>{w}</Text>
        ))}
      </View>

      {/* 日期格子 */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={cal.row}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={cal.cell} />;
            const key = `${viewYear}-${viewMonth}-${day}`;
            const isToday    = key === todayKey;
            const isSelected = key === selectedKey;
            return (
              <TouchableOpacity
                key={col}
                style={[
                  cal.cell,
                  isSelected && { backgroundColor: themeColor, borderRadius: 20 },
                  !isSelected && isToday && cal.todayCell,
                ]}
                onPress={() => onSelect(new Date(viewYear, viewMonth, day))}
                activeOpacity={0.7}
              >
                <Text style={[
                  cal.dayText,
                  isSelected && { color: '#FFF', fontWeight: '700' },
                  !isSelected && isToday && { color: themeColor, fontWeight: '600' },
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cal = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  navBtn:   { padding: 6 },
  navTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  row:      { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  weekday:  { width: 32, textAlign: 'center', fontSize: 11, color: '#999', fontWeight: '500' },
  cell:     { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  todayCell:{ borderWidth: 1, borderColor: '#CCC', borderRadius: 20 },
  dayText:  { fontSize: 13, color: '#444' },
});

// ── 主元件 ────────────────────────────────────────────────────────────────────

export function ReviewScreen({
  photoUri, photoType, mode = 'new',
  initialBrightness, initialContrast, initialMeasurements, initialTakenAt,
  onConfirm, onRetake,
}: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);

  const [brightnessSlider, setBrightnessSlider] = useState(
    initialBrightness != null ? initialBrightness / 2 : 0.5,
  );
  const [contrastSlider, setContrastSlider] = useState(
    initialContrast != null ? initialContrast / 2 : 0.5,
  );
  const [measurements, setMeasurements] = useState<Record<keyof BodyMeasurements, string>>({
    weight:     initialMeasurements?.weight     ?? '',
    chest:      initialMeasurements?.chest      ?? '',
    waist:      initialMeasurements?.waist      ?? '',
    lowerWaist: initialMeasurements?.lowerWaist ?? '',
    hip:        initialMeasurements?.hip        ?? '',
  });
  const [selectedDate,  setSelectedDate]  = useState<Date>(
    initialTakenAt ? new Date(initialTakenAt) : new Date(),
  );
  const [showCalendar, setShowCalendar] = useState(false);

  // ── 照片縮放手勢 ────────────────────────────────────────────────────────
  const scale     = useSharedValue(1);
  const savedScale= useSharedValue(1);
  const tx        = useSharedValue(0);
  const ty        = useSharedValue(0);
  const savedTx   = useSharedValue(0);
  const savedTy   = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const photoGesture = Gesture.Simultaneous(pinch, pan);

  const photoAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  function resetPhoto() {
    scale.value = 1; savedScale.value = 1;
    tx.value = 0;    savedTx.value = 0;
    ty.value = 0;    savedTy.value = 0;
  }

  // ── 確認儲存 ─────────────────────────────────────────────────────────────
  function handleConfirm() {
    Keyboard.dismiss();
    const toNull = (s: string) => s.trim() === '' ? null : s.trim();
    // 將選取日期合入 ISO（保留時間為當天午時，避免時區問題）
    const d = new Date(selectedDate);
    d.setHours(12, 0, 0, 0);
    onConfirm({
      brightness:  toMultiplier(brightnessSlider),
      contrast:    toMultiplier(contrastSlider),
      takenAt:     d.toISOString(),
      weight:      toNull(measurements.weight),
      chest:       toNull(measurements.chest),
      waist:       toNull(measurements.waist),
      lowerWaist:  toNull(measurements.lowerWaist),
      hip:         toNull(measurements.hip),
    });
  }

  const typeLabel   = photoType === 'front' ? '正面照' : '側面照';
  const retakeLabel = mode === 'edit' ? '取消' : '重新拍攝';
  const brightness  = toMultiplier(brightnessSlider);
  const contrast    = toMultiplier(contrastSlider);

  const dateDisplay = `${selectedDate.getFullYear()}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${String(selectedDate.getDate()).padStart(2, '0')}`;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* 標題列 */}
      <View style={[s.header, { backgroundColor: themeColor }]}>
        <TouchableOpacity onPress={onRetake} style={s.retakeBtn} activeOpacity={0.7}>
          <Text style={s.retakeText}>{retakeLabel}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>調整 {typeLabel}</Text>
        <View style={s.headerPlaceholder} />
      </View>

      {/* 照片預覽（在 ScrollView 外，避免閃爍；支援縮放/拖曳） */}
      <View style={s.previewWrap}>
        <GestureDetector gesture={photoGesture}>
          <Animated.View style={[StyleSheet.absoluteFill, photoAnimStyle]}>
            <Image
              source={{ uri: photoUri }}
              style={[s.preview, { filter: [{ brightness }, { contrast }] } as any]}
              resizeMode="cover"
            />
          </Animated.View>
        </GestureDetector>
        {/* 雙擊重置縮放提示 */}
        <TouchableOpacity style={s.resetBtn} onPress={resetPhoto} activeOpacity={0.7}>
          <Text style={s.resetText}>重置</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.scroll}
        >
          {/* 亮度 / 對比 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>照片調整</Text>
            <View style={s.sliderRow}>
              <Text style={s.sliderLabel}>亮度</Text>
              <View style={s.sliderWrap}>
                <SimpleSlider value={brightnessSlider} onChange={setBrightnessSlider} color={themeColor} leftLabel="暗" rightLabel="亮" />
              </View>
            </View>
            <View style={s.sliderRow}>
              <Text style={s.sliderLabel}>對比</Text>
              <View style={s.sliderWrap}>
                <SimpleSlider value={contrastSlider} onChange={setContrastSlider} color={themeColor} leftLabel="柔" rightLabel="強" />
              </View>
            </View>
          </View>

          {/* 修改日期 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>拍攝日期</Text>
            <TouchableOpacity
              style={[s.dateRow, { borderColor: themeColor + '66' }]}
              onPress={() => setShowCalendar((v) => !v)}
              activeOpacity={0.75}
            >
              <Ionicons name={'calendar-outline' as IoniconsName} size={18} color={themeColor} />
              <Text style={[s.dateText, { color: themeColor }]}>{dateDisplay}</Text>
              <Ionicons name={(showCalendar ? 'chevron-up' : 'chevron-down') as IoniconsName} size={16} color="#AAA" />
            </TouchableOpacity>
            {showCalendar && (
              <MiniCalendar
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setShowCalendar(false); }}
                themeColor={themeColor}
              />
            )}
          </View>

          {/* 身體數據 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              身體數據 <Text style={s.optional}>（所有欄位皆選填）</Text>
            </Text>
            <View style={s.fieldsGrid}>
              {FIELDS.map((f) => (
                <View key={f.key} style={s.fieldBox}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <View style={[s.fieldInput, { borderColor: themeColor + '55' }]}>
                    <TextInput
                      style={s.fieldText}
                      placeholder="--"
                      placeholderTextColor="#CCC"
                      keyboardType="decimal-pad"
                      value={measurements[f.key]}
                      onChangeText={(v) => setMeasurements((p) => ({ ...p, [f.key]: v }))}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <Text style={s.fieldUnit}>{f.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 確認儲存 */}
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: themeColor }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={s.confirmText}>確認儲存</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
  },
  retakeBtn:         { width: 80 },
  retakeText:        { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  headerTitle:       { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerPlaceholder: { width: 80 },

  previewWrap: { backgroundColor: '#F0F0F0', overflow: 'hidden', height: PREVIEW_H },
  preview:     { width: SW, height: PREVIEW_H },

  resetBtn: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  resetText: { color: '#FFF', fontSize: 11 },

  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#444',
    letterSpacing: 0.5, marginBottom: 14,
  },
  optional: { fontSize: 11, color: '#AAAAAA', fontWeight: '400' },

  sliderRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sliderLabel: { width: 32, fontSize: 13, color: '#666', fontWeight: '500' },
  sliderWrap:  { flex: 1 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 10, padding: 12,
    backgroundColor: '#FAFAFA',
  },
  dateText: { flex: 1, fontSize: 15, fontWeight: '600' },

  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fieldBox:   { width: (SW - 32 - 12) / 2 },
  fieldLabel: { fontSize: 12, color: '#777', marginBottom: 6, fontWeight: '500' },
  fieldInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  fieldText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '600' },
  fieldUnit: { fontSize: 12, color: '#AAA', marginLeft: 4 },

  confirmBtn: {
    marginHorizontal: 16, marginTop: 28,
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { color: '#FFF', fontSize: 17, fontWeight: '600', letterSpacing: 1 },
});
