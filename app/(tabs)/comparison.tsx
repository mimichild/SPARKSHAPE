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
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { useFocusEffect } from 'expo-router';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useSettingsStore } from '@/stores/settingsStore';
import { TabHeader } from '@/components/TabHeader';
import type { BodyPhoto, PhotoType } from '@/types/bodyPhoto';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

// ── 可縮放照片格（flex 高度，預設填滿框高，不裁切原始照片） ─────────────────

function PhotoPanel({
  photo,
  label,
  dateStr,
  themeColor,
}: {
  photo: BodyPhoto | null;
  label: string;
  dateStr: string;
  themeColor: string;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const frameRef = useRef<View>(null);
  const initialSet = useRef(false);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(0.5, Math.min(8, savedScale.value * e.scale)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  // 計算「填滿框高」的初始縮放比例
  // resizeMode="contain" 依較小比例縮放 → 若寬度是限制因素，高度留白
  // 我們希望預設填滿高度：額外縮放 = fillHeight_scale / contain_scale
  function computeInitialScale() {
    if (!photo || initialSet.current) return;
    frameRef.current?.measure((_x, _y, frameW, frameH) => {
      if (frameW <= 0 || frameH <= 0) return;
      Image.getSize(photo.fullPath, (imgW, imgH) => {
        const containScale    = Math.min(frameW / imgW, frameH / imgH);
        const fillHeightScale = frameH / imgH;
        const initialZoom = fillHeightScale / containScale;
        if (initialZoom > 1) {
          scale.value      = initialZoom;
          savedScale.value = initialZoom;
        }
        initialSet.current = true;
      });
    });
  }

  const labelColor = label === 'Before' ? '#7BAFC4' : themeColor;

  return (
    <View style={ps.column}>
      <View ref={frameRef} style={ps.frame} onLayout={computeInitialScale}>
        {photo ? (
          <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
            <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
              <Image
                source={{ uri: photo.fullPath }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        ) : (
          <View style={ps.noPhoto}>
            <Ionicons name={'camera-outline' as IoniconsName} size={32} color="#CCCCCC" />
            <Text style={ps.noPhotoText}>無照片</Text>
          </View>
        )}
      </View>

      <View style={ps.meta}>
        <Text style={[ps.label, { color: labelColor }]}>{label}</Text>
        <Text style={ps.date}>{dateStr}</Text>
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  column: { flex: 1 },
  frame:  { flex: 1, backgroundColor: '#F5F5F5', overflow: 'hidden' },
  noPhoto: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  noPhotoText: { color: '#CCCCCC', fontSize: 12 },
  meta:  { alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  date:  { fontSize: 11, color: '#888', marginTop: 2 },
});

// ── 月曆元件 ─────────────────────────────────────────────────────────────────

const CAL_W = Dimensions.get('window').width;
const CELL  = Math.floor((CAL_W - 32) / 7);
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

function CalendarPicker({
  availableDates,
  selected,
  onToggle,
  themeColor,
  initDate,
}: {
  availableDates: string[];
  selected: string[];
  onToggle: (d: string) => void;
  themeColor: string;
  initDate?: string;
}) {
  const ref = initDate ? new Date(initDate) : new Date();
  const [year,  setYear]  = useState(ref.getFullYear());
  const [month, setMonth] = useState(ref.getMonth());

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function dateKey(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0);  } else setMonth(m => m + 1); }

  const grid = useMemo(() => getGrid(year, month), [year, month]);

  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View style={cl.wrapper}>
      {/* 年份導航 */}
      <View style={cl.navRow}>
        <TouchableOpacity style={cl.navBtn} onPress={() => setYear(y => y - 1)}>
          <Ionicons name={'chevron-back' as IoniconsName} size={18} color="#555" />
        </TouchableOpacity>
        <Text style={cl.navYear}>{year}年</Text>
        <TouchableOpacity style={cl.navBtn} onPress={() => setYear(y => y + 1)}>
          <Ionicons name={'chevron-forward' as IoniconsName} size={18} color="#555" />
        </TouchableOpacity>
      </View>

      {/* 月份導航 */}
      <View style={cl.navRow}>
        <TouchableOpacity style={cl.navBtn} onPress={prevMonth}>
          <Ionicons name={'chevron-back' as IoniconsName} size={16} color="#777" />
        </TouchableOpacity>
        <Text style={cl.navMonth}>{month + 1}月</Text>
        <TouchableOpacity style={cl.navBtn} onPress={nextMonth}>
          <Ionicons name={'chevron-forward' as IoniconsName} size={16} color="#777" />
        </TouchableOpacity>
      </View>

      {/* 星期標題 */}
      <View style={cl.weekRow}>
        {WEEKDAYS.map(w => (
          <Text key={w} style={cl.weekday}>{w}</Text>
        ))}
      </View>

      {/* 日期格子 */}
      {grid.map((row, ri) => (
        <View key={ri} style={cl.weekRow}>
          {row.map((day, ci) => {
            if (!day) return <View key={ci} style={cl.cell} />;
            const key      = dateKey(year, month, day);
            const hasData  = availableSet.has(key);
            const isSel    = selected.includes(key);
            const isFull   = !isSel && selected.length >= 2;
            const isToday  = key === todayKey;

            return (
              <TouchableOpacity
                key={ci}
                style={[
                  cl.cell,
                  isSel && { backgroundColor: themeColor, borderRadius: CELL / 2 },
                  !isSel && isToday && cl.todayCell,
                ]}
                onPress={() => { if (hasData && !isFull) onToggle(key); }}
                activeOpacity={hasData && !isFull ? 0.7 : 1}
              >
                <Text style={[
                  cl.dayBase,
                  hasData ? cl.dayBold : cl.dayThin,
                  isSel   && cl.daySelected,
                  !hasData && cl.dayNoData,
                ]}>
                  {day}
                </Text>
                {/* 有資料小點 */}
                {hasData && !isSel && (
                  <View style={[cl.dot, { backgroundColor: themeColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cl = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingBottom: 8 },
  navRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navBtn:  { padding: 8 },
  navYear: { fontSize: 18, fontWeight: '700', color: '#222', minWidth: 90, textAlign: 'center' },
  navMonth:{ fontSize: 16, fontWeight: '600', color: '#444', minWidth: 50, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 1 },
  weekday: { width: CELL, textAlign: 'center', fontSize: 11, color: '#AAA', fontWeight: '500' },
  cell:    { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  todayCell: { borderWidth: 1, borderColor: '#CCC', borderRadius: CELL / 2 },
  dayBase:   { fontSize: 16, lineHeight: 20 },
  dayBold:   { fontWeight: '800', color: '#111', fontSize: 17 },  // 有資料：粗體大字
  dayThin:   { fontWeight: '300', color: '#888888', fontSize: 14 }, // 無資料：細體中灰
  daySelected: { color: '#FFF', fontWeight: '800' },
  dayNoData:   { },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});

// ── 日期選取模態框 ───────────────────────────────────────────────────────────

function DatePickerModal({
  visible,
  availableDates,
  selected,
  onToggle,
  onConfirm,
  onClose,
  themeColor,
}: {
  visible: boolean;
  availableDates: string[];
  selected: string[];
  onToggle: (date: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  themeColor: string;
}) {
  // 初始月份設為最近有資料的那個月
  const initDate = availableDates[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dm.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={dm.sheet}>
        <View style={dm.handle} />
        <Text style={dm.title}>選擇兩個對比日期</Text>
        <Text style={dm.subtitle}>
          已選{' '}
          <Text style={{ color: themeColor, fontWeight: '700' }}>{selected.length}</Text>
          {' '}/ 2 個日期
        </Text>

        {availableDates.length === 0 ? (
          <View style={dm.emptyBox}>
            <Text style={dm.emptyText}>目前沒有可對比的照片</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <CalendarPicker
              availableDates={availableDates}
              selected={selected}
              onToggle={onToggle}
              themeColor={themeColor}
              initDate={initDate}
            />
          </ScrollView>
        )}

        <View style={dm.actions}>
          <TouchableOpacity style={dm.cancelBtn} onPress={onClose}>
            <Text style={dm.cancelText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dm.confirmBtn, { backgroundColor: selected.length === 2 ? themeColor : '#E0E0E0' }]}
            onPress={onConfirm}
            disabled={selected.length !== 2}
          >
            <Text style={[dm.confirmText, { color: selected.length === 2 ? '#FFF' : '#AAA' }]}>
              確認
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%', paddingBottom: 24,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2,
    alignSelf: 'center', marginTop: 12,
  },
  title:    { fontSize: 16, fontWeight: '700', color: '#333', textAlign: 'center', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 8 },
  emptyBox: { padding: 32, alignItems: 'center' },
  emptyText:{ color: '#AAA', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { color: '#666', fontSize: 15, fontWeight: '500' },
  confirmBtn: { flex: 2, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700' },
});

// ── 主頁面 ───────────────────────────────────────────────────────────────────

export default function ComparisonScreen() {
  const { photos, reload } = useBodyPhotos('desc');
  const themeColor = useSettingsStore((s) => s.themeColor);
  const swipeHandlers = useSwipeBack();

  const [photoType,      setPhotoType]      = useState<PhotoType>('front');
  const [showPicker,     setShowPicker]     = useState(false);
  const [pendingDates,   setPendingDates]   = useState<string[]>([]);
  const [confirmedDates, setConfirmedDates] = useState<string[]>([]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // 所有有照片的日期（不論正面/側面）
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => set.add(p.takenAt.slice(0, 10)));
    return Array.from(set).sort().reverse();
  }, [photos]);

  // 切換類型時「不重置」已選日期，直接換顯示
  function handleTypeChange(type: PhotoType) {
    setPhotoType(type);
  }

  // 日期 modal 操作
  function openPicker() {
    setPendingDates([...confirmedDates]);
    setShowPicker(true);
  }
  function toggleDate(date: string) {
    setPendingDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  }
  function confirmDates() {
    setConfirmedDates(pendingDates);
    setShowPicker(false);
  }

  // 依日期排序：before = 較舊，after = 較新
  const [beforeDate, afterDate] = useMemo(() => {
    if (confirmedDates.length !== 2) return [null, null];
    const sorted = [...confirmedDates].sort();
    return [sorted[0], sorted[1]];
  }, [confirmedDates]);

  function findPhoto(date: string | null): BodyPhoto | null {
    if (!date) return null;
    return photos.find((p) => p.takenAt.slice(0, 10) === date && p.photoType === photoType) ?? null;
  }

  function fmtDate(d: string | null) {
    if (!d) return '--';
    const [y, m, day] = d.split('-');
    return `${y}/${m}/${day}`;
  }

  // 篩選日期按鈕文字
  function filterLabel() {
    if (confirmedDates.length === 0) return '篩選日期';
    if (confirmedDates.length === 1) return fmtDate(confirmedDates[0]);
    const [a, b] = [...confirmedDates].sort();
    return `${fmtDate(a).slice(2)} ↔ ${fmtDate(b).slice(2)}`;
  }

  // 正面/側面 toggle（放入 TabHeader 右側）
  const TypeToggle = (
    <View style={ts.toggle}>
      {(['front', 'side'] as PhotoType[]).map((t) => (
        <TouchableOpacity
          key={t}
          style={[ts.btn, photoType === t && ts.btnActive]}
          onPress={() => handleTypeChange(t)}
          activeOpacity={0.75}
        >
          <Text style={[ts.btnText, photoType === t && { color: themeColor }]}>
            {t === 'front' ? '正面' : '側面'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const hasComparison = confirmedDates.length === 2;

  return (
    <SafeAreaView style={s.root} {...swipeHandlers}>
      <TabHeader title="身型對比" rightComponent={TypeToggle} />

      {/* 篩選日期列 */}
      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterBtn, { borderColor: themeColor + '88' }]}
          onPress={openPicker}
          activeOpacity={0.75}
        >
          <Ionicons name={'calendar-outline' as IoniconsName} size={15} color={themeColor} />
          <Text style={[s.filterBtnText, { color: themeColor }]}>{filterLabel()}</Text>
          <Ionicons name={'chevron-down' as IoniconsName} size={14} color={themeColor} />
        </TouchableOpacity>
      </View>

      {/* 對比區：flex:1 撐滿剩餘空間 */}
      {hasComparison ? (
        <View style={s.comparison}>
          <PhotoPanel
            photo={findPhoto(beforeDate)}
            label="Before"
            dateStr={fmtDate(beforeDate)}
            themeColor={themeColor}
          />
          <View style={s.divider} />
          <PhotoPanel
            photo={findPhoto(afterDate)}
            label="After"
            dateStr={fmtDate(afterDate)}
            themeColor={themeColor}
          />
        </View>
      ) : (
        <View style={s.emptyContainer}>
          <Ionicons name={'git-compare-outline' as IoniconsName} size={64} color="#CCCCCC" />
          <Text style={s.emptyText}>
            {availableDates.length < 2
              ? '需要至少 2 天的照片才能對比'
              : '請先點擊「篩選日期」選取兩個時間點'}
          </Text>
          {confirmedDates.length === 1 && (
            <Text style={s.emptySubtitle}>已選 1 / 2 個日期，請再選一個</Text>
          )}
        </View>
      )}

      {/* 日期 Modal */}
      <DatePickerModal
        visible={showPicker}
        availableDates={availableDates}
        selected={pendingDates}
        onToggle={toggleDate}
        onConfirm={confirmDates}
        onClose={() => setShowPicker(false)}
        themeColor={themeColor}
      />
    </SafeAreaView>
  );
}

// ── 正面/側面 toggle ──────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  toggle: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, padding: 2, gap: 2,
  },
  btn:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  btnActive: { backgroundColor: '#FFFFFF' },
  btnText:   { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 },
});

// ── 主樣式 ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  filterRow: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: '#FAFAFA',
  },
  filterBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },

  // 照片區：flex:1 撐到底（Tab bar 由 navigation 自動處理）
  comparison: {
    flex: 1,
    flexDirection: 'row',
  },
  divider: { width: 1, backgroundColor: '#E0E0E0' },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40,
  },
  emptyText:     { color: '#333', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { color: '#888', fontSize: 13, textAlign: 'center' },
});
