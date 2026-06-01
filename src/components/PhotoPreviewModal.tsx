import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { BodyPhoto } from '@/types/bodyPhoto';
import { useSettingsStore } from '@/stores/settingsStore';
import { calcBMI } from '@/utils/bmi';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
const SW = Dimensions.get('window').width;

interface Props {
  photo: BodyPhoto | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photo, onClose }: Props) {
  const themeColor = useSettingsStore((s) => s.themeColor);
  const height     = useSettingsStore((s) => s.height);

  if (!photo) return null;

  const dateStr = new Date(photo.takenAt).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const bmi = calcBMI(photo.weight, height);

  const metrics: { label: string; value: string; unit: string }[] = [
    ...(photo.weight     ? [{ label: '體重',   value: photo.weight,     unit: 'kg' }] : []),
    ...(bmi              ? [{ label: 'BMI',    value: bmi,              unit: ''   }] : []),
    ...(photo.chest      ? [{ label: '胸圍',   value: photo.chest,      unit: 'cm' }] : []),
    ...(photo.waist      ? [{ label: '腰圍',   value: photo.waist,      unit: 'cm' }] : []),
    ...(photo.lowerWaist ? [{ label: '下腰圍', value: photo.lowerWaist, unit: 'cm' }] : []),
    ...(photo.hip        ? [{ label: '臀圍',   value: photo.hip,        unit: 'cm' }] : []),
  ];

  const photoTypeLabel = photo.photoType === 'front' ? '正面' : '側面';

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={s.root} edges={['top', 'bottom']} testID="preview-modal">
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* 照片全寬顯示，左右邊緣碰到螢幕邊緣 */}
          <Image
            source={{ uri: photo.detailPath }}
            style={s.photo}
            resizeMode="cover"
            testID="preview-image"
          />

          {/* 資訊區：日期 + 照片類型 */}
          <View style={s.infoSection}>
            <Text style={s.dateText} testID="preview-date">{dateStr}</Text>
            <View style={[s.typeTag, { backgroundColor: themeColor }]}>
              <Text style={s.typeTagText}>{photoTypeLabel}</Text>
            </View>
          </View>

          {/* 身材數據 */}
          {metrics.length > 0 && (
            <View style={s.metricsSection}>
              <Text style={[s.metricsTitle, { color: themeColor }]}>身材數據</Text>
              <View style={s.metricsGrid}>
                {metrics.map((m) => (
                  <View key={m.label} style={[s.chip, { borderColor: themeColor + '55' }]}>
                    <Text style={s.chipLabel}>{m.label}</Text>
                    <Text style={[s.chipValue, { color: themeColor }]}>
                      {m.value}
                      {m.unit ? <Text style={s.chipUnit}> {m.unit}</Text> : null}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {metrics.length === 0 && (
            <Text style={s.noData}>尚未記錄身材數據</Text>
          )}
        </ScrollView>

        {/* 關閉按鈕 */}
        <TouchableOpacity style={s.closeBtn} onPress={onClose} testID="close-preview">
          <Ionicons name={'close' as IoniconsName} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // 照片：全寬，不留邊距
  photo: {
    width: SW,
    height: Math.round(SW * (4 / 3)),
  },

  // 日期 + 類型標籤
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateText: { fontSize: 15, color: '#444', fontWeight: '500' },
  typeTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  typeTagText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // 身材數據
  metricsSection: { paddingHorizontal: 16, paddingTop: 4 },
  metricsTitle: {
    fontSize: 14, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 90,
    backgroundColor: '#FAFAFA',
  },
  chipLabel: { fontSize: 11, color: '#999', marginBottom: 4, fontWeight: '500' },
  chipValue: { fontSize: 18, fontWeight: '700' },
  chipUnit:  { fontSize: 11, color: '#AAA', fontWeight: '400' },

  noData: {
    color: '#BBBBBB', fontSize: 13, textAlign: 'center',
    paddingVertical: 20,
  },

  // 關閉按鈕（右上角）
  closeBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
});
