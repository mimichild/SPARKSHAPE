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
import { memo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { SimpleSlider } from './SimpleSlider';
import { useSettingsStore } from '@/stores/settingsStore';
import { calcBMI } from '@/utils/bmi';
import type { BodyMeasurements, PhotoType } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const { width: SW } = Dimensions.get('window');
const PREVIEW_H = Math.round(SW * (4 / 3));

// ── 型別 ────────────────────────────────────────────────────────────────────

export interface ReviewResult extends BodyMeasurements {
  brightness: number;
  contrast:   number;
  takenAt:    string;
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

// ── 照片預覽（memo 防止填資料時重複渲染）──────────────────────────────────────

const PhotoPreview = memo(
  ({ uri, brightness, contrast }: { uri: string; brightness: number; contrast: number }) => (
    <Image
      source={{ uri }}
      style={[s.preview, { filter: [{ brightness }, { contrast }] } as any]}
      resizeMode="cover"
    />
  ),
  (prev: { uri: string; brightness: number; contrast: number },
   next: { uri: string; brightness: number; contrast: number }) =>
    prev.uri === next.uri &&
    prev.brightness === next.brightness &&
    prev.contrast === next.contrast,
);

// ── 小月曆 ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function MiniCalendar({ selected, onSelect, themeColor, initDate }: {
  selected: Date; onSelect: (d: Date) => void; themeColor: string; initDate?: string;
}) {
  const ref = initDate ? new Date(initDate) : new Date();
  const [year,  setYear]  = useState(ref.getFullYear());
  const [month, setMonth] = useState(ref.getMonth());
  const availableSet = new Set<string>();

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function dateKey(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0);  } else setMonth(m => m + 1); }

  const grid  = getGrid(year, month);
  const today = new Date();
  const todayKey   = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedKey = dateKey(selected.getFullYear(), selected.getMonth(), selected.getDate());

  return (
    <View style={cal.wrapper}>
      <View style={cal.navRow}>
        <TouchableOpacity style={cal.navBtn} onPress={() => setYear(y => y - 1)}>
          <Ionicons name={'chevron-back' as IoniconsName} size={18} color="#555" />
        </TouchableOpacity>
        <Text style={cal.navYear}>{year}年</Text>
        <TouchableOpacity style={cal.navBtn} onPress={() => setYear(y => y + 1)}>
          <Ionicons name={'chevron-forward' as IoniconsName} size={18} color="#555" />
        </TouchableOpacity>
      </View>
      <View style={cal.navRow}>
        <TouchableOpacity style={cal.navBtn} onPress={prevMonth}>
          <Ionicons name={'chevron-back' as IoniconsName} size={16} color="#777" />
        </TouchableOpacity>
        <Text style={cal.navMonth}>{month + 1}月</Text>
        <TouchableOpacity style={cal.navBtn} onPress={nextMonth}>
          <Ionicons name={'chevron-forward' as IoniconsName} size={16} color="#777" />
        </TouchableOpacity>
      </View>
      <View style={cal.weekRow}>
        {WEEKDAYS.map(w => <Text key={w} style={cal.weekday}>{w}</Text>)}
      </View>
      {grid.map((row, ri) => (
        <View key={ri} style={cal.weekRow}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={cal.cell} />;
            const key     = dateKey(year, month, day);
            const isSel   = key === selectedKey;
            const isToday = key === todayKey;
            return (
              <TouchableOpacity
                key={ci}
                style={[cal.cell, isSel && { backgroundColor: themeColor, borderRadius: cal.cell.height / 2 }, !isSel && isToday && cal.todayCell]}
                onPress={() => onSelect(new Date(year, month, day))}
                activeOpacity={0.7}
              >
                <Text style={[cal.dayBase, isSel && cal.daySelected, !isSel && isToday && { color: themeColor, fontWeight: '600' }]}>
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
  wrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  navRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navBtn:  { padding: 8 },
  navYear: { fontSize: 18, fontWeight: '700', color: '#222', minWidth: 90, textAlign: 'center' },
  navMonth:{ fontSize: 16, fontWeight: '600', color: '#444', minWidth: 50, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 1 },
  weekday: { width: 32, textAlign: 'center', fontSize: 11, color: '#AAA', fontWeight: '500' },
  cell:    { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  todayCell: { borderWidth: 1, borderColor: '#CCC', borderRadius: 16 },
  dayBase:   { fontSize: 14, color: '#444' },
  daySelected: { color: '#FFF', fontWeight: '700' },
});

// ── 主元件 ─────────────────────────────────────────────────────────────────

export function ReviewScreen({
  photoUri, photoType, mode = 'new',
  initialBrightness, initialContrast, initialMeasurements, initialTakenAt,
  onConfirm, onRetake,
}: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);
  const height     = useSettingsStore((s) => s.height);

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
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialTakenAt ? new Date(initialTakenAt) : new Date(),
  );
  const [showCalendar, setShowCalendar] = useState(false);

  // BMI 自動計算
  const bmi = calcBMI(measurements.weight, height);

  function handleConfirm() {
    Keyboard.dismiss();
    const toNull = (s: string) => s.trim() === '' ? null : s.trim();
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* 照片（memo 防止填資料時重繪） */}
        <View style={s.previewWrap}>
          <PhotoPreview uri={photoUri} brightness={brightness} contrast={contrast} />
        </View>

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

        {/* 拍攝日期 */}
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
              initDate={initialTakenAt}
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
              <>
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
                {f.key === 'weight' && (
                  <View key="bmi" style={s.fieldBox}>
                    <Text style={s.fieldLabel}>BMI{!height ? '（需填身高）' : '（自動）'}</Text>
                    <View style={[s.fieldInput, { borderColor: themeColor + '55' }]}>
                      <TextInput
                        style={[s.fieldText, { color: bmi ? themeColor : '#CCC' }]}
                        value={bmi ?? '--'}
                        editable={false}
                      />
                    </View>
                  </View>
                )}
              </>
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

        <View style={{ height: 32 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── 樣式 ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:      { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14,
  },
  retakeBtn:         { width: 80 },
  retakeText:        { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  headerTitle:       { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerPlaceholder: { width: 80 },

  previewWrap: { backgroundColor: '#F0F0F0' },
  preview:     { width: SW, height: PREVIEW_H },

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

  bmiRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FAFAFA', marginBottom: 12,
  },
  bmiLabel: { fontSize: 13, color: '#777', fontWeight: '500' },
  bmiValue: { fontSize: 20, fontWeight: '800' },
  bmiDesc:  { fontSize: 12, fontWeight: '400', color: '#888' },
  bmiHint:  { fontSize: 11, color: '#BBBBBB', marginBottom: 10 },
});
