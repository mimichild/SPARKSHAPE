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
import { useState } from 'react';
import { SimpleSlider } from './SimpleSlider';
import { useSettingsStore } from '@/stores/settingsStore';
import type { BodyMeasurements, PhotoType } from '@/types/bodyPhoto';

const { width: SW } = Dimensions.get('window');
const PREVIEW_H = Math.round(SW * (4 / 3));

interface ReviewResult extends BodyMeasurements {
  brightness: number;
  contrast:   number;
}

interface Props {
  photoUri: string;
  photoType: PhotoType;
  /** 編輯模式：undefined = 新增，defined = 編輯現有照片 */
  mode?: 'new' | 'edit';
  /** 帶入上次 / 現有的數據作為初始值 */
  initialBrightness?:    number;   // 0.0-2.0 倍率
  initialContrast?:      number;
  initialMeasurements?:  Partial<BodyMeasurements>;
  onConfirm: (result: ReviewResult) => void;
  onRetake:  () => void;
}

interface MeasurementField {
  key: keyof BodyMeasurements;
  label: string;
  unit: string;
  required: boolean;
}

const FIELDS: MeasurementField[] = [
  { key: 'weight',     label: '體重',   unit: 'kg', required: false },
  { key: 'chest',      label: '胸圍',   unit: 'cm', required: false },
  { key: 'waist',      label: '腰圍',   unit: 'cm', required: false },
  { key: 'lowerWaist', label: '下腰圍', unit: 'cm', required: false },
  { key: 'hip',        label: '臀圍',   unit: 'cm', required: false },
];

// 滑桿 0.0~1.0 → 實際倍數 0.0~2.0
// 中間值 0.5 = 1.0× (不做任何調整)，向左暗/柔，向右亮/強
function sliderToMultiplier(v: number) {
  return v * 2.0;
}

export function ReviewScreen({
  photoUri, photoType, mode = 'new',
  initialBrightness, initialContrast, initialMeasurements,
  onConfirm, onRetake,
}: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);

  // initialBrightness / initialContrast 是 0.0~2.0 倍率，轉回 slider 0.0~1.0
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

  const brightness = sliderToMultiplier(brightnessSlider);
  const contrast   = sliderToMultiplier(contrastSlider);

  function setField(key: keyof BodyMeasurements, val: string) {
    setMeasurements((prev) => ({ ...prev, [key]: val }));
  }

  function handleConfirm() {
    Keyboard.dismiss();
    const toNull = (s: string) => s.trim() === '' ? null : s.trim();
    onConfirm({
      brightness,
      contrast,
      weight:     toNull(measurements.weight),
      chest:      toNull(measurements.chest),
      waist:      toNull(measurements.waist),
      lowerWaist: toNull(measurements.lowerWaist),
      hip:        toNull(measurements.hip),
    });
  }

  const typeLabel   = photoType === 'front' ? '正面照' : '側面照';
  const retakeLabel = mode === 'edit' ? '取消' : '重新拍攝';

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

      {/* 照片預覽：放在 ScrollView 外，避免隨 setState 閃爍 */}
      <View style={s.previewWrap}>
        <Image
          source={{ uri: photoUri }}
          style={[s.preview, { filter: [{ brightness }, { contrast }] } as any]}
          resizeMode="cover"
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
                <SimpleSlider
                  value={brightnessSlider}
                  onChange={setBrightnessSlider}
                  color={themeColor}
                  leftLabel="暗"
                  rightLabel="亮"
                />
              </View>
            </View>

            <View style={s.sliderRow}>
              <Text style={s.sliderLabel}>對比</Text>
              <View style={s.sliderWrap}>
                <SimpleSlider
                  value={contrastSlider}
                  onChange={setContrastSlider}
                  color={themeColor}
                  leftLabel="柔"
                  rightLabel="強"
                />
              </View>
            </View>
          </View>

          {/* 三圍數據 */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>身體數據 <Text style={s.optional}>（所有欄位皆選填）</Text></Text>
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
                      onChangeText={(v) => setField(f.key, v)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  retakeBtn:         { width: 80 },
  retakeText:        { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  headerTitle:       { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerPlaceholder: { width: 80 },

  previewWrap: { backgroundColor: '#F0F0F0' },
  preview: { width: SW, height: PREVIEW_H },

  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    letterSpacing: 0.5,
    marginBottom: 14,
  },

  sliderRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sliderLabel: { width: 32, fontSize: 13, color: '#666', fontWeight: '500' },
  sliderWrap:  { flex: 1 },

  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldBox: { width: (SW - 32 - 12) / 2 },
  optional:   { fontSize: 11, color: '#AAAAAA', fontWeight: '400' },
  fieldLabel: { fontSize: 12, color: '#777', marginBottom: 6, fontWeight: '500' },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  fieldText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '600' },
  fieldUnit: { fontSize: 12, color: '#AAA', marginLeft: 4 },

  confirmBtn: {
    marginHorizontal: 16,
    marginTop: 28,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#FFF', fontSize: 17, fontWeight: '600', letterSpacing: 1 },
});
