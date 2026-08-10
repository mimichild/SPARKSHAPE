import {
  Alert,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSQLiteContext } from 'expo-sqlite';
import { THEME_COLORS, useSettingsStore } from '@/stores/settingsStore';
import {
  pickExportDirectory,
  exportBackup,
  importBackup,
} from '@/services/backupService';
import { AdBanner } from '@/components/AdBanner';
import { useProGate } from '@/hooks/useProGate';
import {
  purchasePro, purchasePackage, restorePurchases, fetchPackages,
} from '@/services/purchases';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/constants/monetization';

function packagePlanLabel(pkg: PurchasesPackage): string {
  if (pkg.packageType === 'ANNUAL') return 'SPARK SHAPE Pro 年費方案';
  if (pkg.packageType === 'MONTHLY') return 'SPARK SHAPE Pro 月費方案';
  return pkg.product.title;
}

function packagePeriodLabel(pkg: PurchasesPackage): string {
  if (pkg.packageType === 'ANNUAL') return '訂閱期間：每年自動續訂';
  if (pkg.packageType === 'MONTHLY') return '訂閱期間：每月自動續訂';
  const iso = pkg.product.subscriptionPeriod;
  if (iso === 'P1Y') return '訂閱期間：每年自動續訂';
  if (iso === 'P1M') return '訂閱期間：每月自動續訂';
  if (iso === 'P1W') return '訂閱期間：每週自動續訂';
  return '訂閱期間：自動續訂';
}

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsSheet({ visible, onClose }: Props) {
  const store = useSettingsStore();
  const db    = useSQLiteContext();
  const { isProUnlocked, requirePro } = useProGate();

  // 本地（暫存）狀態，按下確認套用才寫入 store
  const [localOpenCamera, setLocalOpenCamera] = useState(store.openCameraOnLaunch);
  const [localAutoSave,   setLocalAutoSave]   = useState(store.autoSavePhotos);
  const [localTheme,      setLocalTheme]      = useState(store.themeColor);
  const [localHeight,     setLocalHeight]     = useState(store.height ?? '');

  // 備份進度
  const [backupProgress, setBackupProgress] = useState<number | null>(null);
  const [backupMessage,  setBackupMessage]  = useState('');

  // Pro 升級／恢復購買
  const [purchasing, setPurchasing] = useState(false);
  const [restoring,  setRestoring]  = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // 每次開啟面板時同步最新 store 值
  useEffect(() => {
    if (visible) {
      setLocalOpenCamera(store.openCameraOnLaunch);
      setLocalAutoSave(store.autoSavePhotos);
      setLocalTheme(store.themeColor);
      setLocalHeight(store.height ?? '');
    }
  }, [visible]);

  // 需要顯示各方案的標題／期間／價格（Apple Guideline 3.1.2(c)），只有面板開啟、
  // iOS 且尚未解鎖 Pro 時才需要載入。
  useEffect(() => {
    if (!visible || Platform.OS === 'android' || isProUnlocked) return;
    let cancelled = false;
    setLoadingPackages(true);
    fetchPackages()
      .then(pkgs => { if (!cancelled) setPackages(pkgs); })
      .finally(() => { if (!cancelled) setLoadingPackages(false); });
    return () => { cancelled = true; };
  }, [visible, isProUnlocked]);

  // ── 匯出 ──
  async function handleExport() {
    if (!requirePro('匯出備份')) return;
    const dirResult = await pickExportDirectory();
    if (!dirResult.granted) return;

    setBackupProgress(0);
    setBackupMessage('正在準備匯出...');

    const result = await exportBackup(db, dirResult.uri, (pct) => {
      setBackupProgress(pct);
      if (pct < 50)       setBackupMessage('正在讀取資料...');
      else if (pct < 90)  setBackupMessage('正在壓縮檔案...');
      else                setBackupMessage('正在儲存...');
    });

    setBackupProgress(null);
    if (result.ok) {
      Alert.alert('匯出完成', `備份已儲存！\n檔案名稱：${result.fileName}`);
    } else if (!('cancelled' in result)) {
      Alert.alert('匯出失敗', result.error);
    }
  }

  // ── 匯入 ──
  async function runImport(mode: 'merge' | 'overwrite') {
    // 不提前顯示 overlay：importBackup 內部先開 DocumentPicker，
    // 選完檔案後第一次 onProgress 呼叫才讓 overlay 出現。
    const result = await importBackup(db, mode, (pct) => {
      setBackupProgress(pct);
      if (pct < 25)       setBackupMessage('正在解析備份檔案...');
      else if (pct < 60)  setBackupMessage('正在還原照片...');
      else if (pct < 80)  setBackupMessage('正在還原資料...');
      else                setBackupMessage('正在完成還原...');
    });

    setBackupProgress(null);
    if (result.ok) {
      Alert.alert('匯入完成', `已成功還原 ${result.count} 筆照片記錄！`);
    } else if ('error' in result) {
      Alert.alert('匯入失敗', result.error);
    }
  }

  function handleImport() {
    if (!requirePro('匯入備份')) return;
    Alert.alert(
      '選擇還原模式',
      '請選擇匯入方式：',
      [
        { text: '取消', style: 'cancel' },
        { text: '合併', onPress: () => runImport('merge') },
        { text: '覆蓋', style: 'destructive', onPress: () => runImport('overwrite') },
      ],
    );
  }

  async function handleApply() {
    Keyboard.dismiss();
    await store.applySettings({
      openCameraOnLaunch: localOpenCamera,
      autoSavePhotos:     localAutoSave,
      themeColor:         localTheme,
      height:             localHeight.trim(),
    });
    onClose();
  }

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const isPro = await purchasePro();
      if (isPro) {
        await store.setProUnlocked(true);
        Alert.alert('升級成功', 'Pro 功能已啟用');
      }
    } catch (e) {
      Alert.alert('升級失敗', e instanceof Error ? e.message : '請稍後再試');
    } finally {
      setPurchasing(false);
    }
  }

  async function handlePurchasePackage(pkg: PurchasesPackage) {
    setPurchasing(true);
    try {
      const isPro = await purchasePackage(pkg);
      if (isPro) {
        await store.setProUnlocked(true);
        Alert.alert('升級成功', 'Pro 功能已啟用');
      }
    } catch (e) {
      Alert.alert('升級失敗', e instanceof Error ? e.message : '請稍後再試');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const isPro = await restorePurchases();
      await store.setProUnlocked(isPro);
      Alert.alert(isPro ? '還原成功' : '沒有找到可還原的購買紀錄', isPro ? 'Pro 功能已啟用' : '若你曾經購買過，請確認使用的是同一個 Apple ID');
    } catch (e) {
      Alert.alert('還原失敗', e instanceof Error ? e.message : '請稍後再試');
    } finally {
      setRestoring(false);
    }
  }

  // 這裡刻意不用 <Modal>：匯出/匯入流程內部會呼叫 DocumentPicker /
  // Sharing（也是原生 Modal），iOS 上巢狀開多層原生 Modal 會讓畫面卡死
  // 不回應（實測會卡在匯入完成、關掉設定面板之後，連首頁按鈕都點不動）。
  // 改成一般的絕對定位 View 疊在最上層可以避免這個問題（同樣的修法見
  // SPARKPLATE 的 BackupRestoreModal.tsx）。
  if (!visible) return null;

  return (
    <View style={s.overlay}>
      {/* 半透明背景 */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      {/* 設定面板 */}
      <View style={s.sheet}>
        {/* 上拉條 */}
        <View style={s.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* 標題 */}
          <Text style={s.title}>設定</Text>

          {/* ── Pro 解鎖 ── */}
          <Text style={[s.sectionTitle, { color: localTheme }]}>PRO 解鎖</Text>
          {Platform.OS === 'android' ? (
            <Text style={s.proBadge}>✓ Pro 已解鎖（Android 版全功能免費開放）</Text>
          ) : isProUnlocked ? (
            <Text style={s.proBadge}>✓ Pro 已解鎖</Text>
          ) : (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.toggleDesc}>升級 Pro 即可解鎖開機用相機、拍照自動下載、主題色、匯出匯入，並移除廣告</Text>

              {loadingPackages ? (
                <Text style={s.toggleDesc}>載入方案中…</Text>
              ) : packages.length > 0 ? (
                packages.map(pkg => (
                  <View key={pkg.identifier} style={s.planRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planTitle}>{packagePlanLabel(pkg)}</Text>
                      <Text style={s.planMeta}>{packagePeriodLabel(pkg)}</Text>
                      <Text style={s.planMeta}>價格：{pkg.product.priceString}</Text>
                    </View>
                    <TouchableOpacity
                      style={[s.backupBtnFilled, { backgroundColor: localTheme, marginBottom: 0, height: 44, paddingHorizontal: 18 }]}
                      onPress={() => handlePurchasePackage(pkg)}
                      disabled={purchasing}
                      activeOpacity={0.82}
                    >
                      <Text style={s.backupBtnFilledText}>{purchasing ? '處理中…' : '訂閱'}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <TouchableOpacity
                  style={[s.backupBtnFilled, { backgroundColor: localTheme, marginTop: 12 }]}
                  onPress={handlePurchase}
                  disabled={purchasing}
                  activeOpacity={0.82}
                >
                  <Text style={s.backupBtnFilledText}>{purchasing ? '處理中…' : '升級 Pro'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleRestore} disabled={restoring} activeOpacity={0.7} style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: localTheme, fontSize: 13, fontWeight: '600' }}>{restoring ? '還原中…' : '恢復購買'}</Text>
              </TouchableOpacity>

              <View style={s.legalRow}>
                <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
                  <Text style={s.legalLink}>隱私權政策</Text>
                </TouchableOpacity>
                <Text style={s.legalDot}>·</Text>
                <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_USE_URL)} hitSlop={8}>
                  <Text style={s.legalLink}>服務條款</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.legalHint}>訂閱將自動續訂，可隨時於 App Store 帳號設定中取消</Text>
            </View>
          )}

          {/* ── 開關：開啟時直接用相機打開 ── */}
          <View style={s.toggleRow}>
            <View style={s.toggleLabels}>
              <Text style={[s.toggleTitle, { color: localTheme }]}>開啟時直接用相機打開</Text>
              <Text style={s.toggleDesc}>開啟 APP 後自動跳過首頁，直接開啟相機</Text>
            </View>
            <Switch
              value={localOpenCamera}
              onValueChange={(v) => { if (!requirePro('開啟時直接用相機打開')) return; setLocalOpenCamera(v); }}
              trackColor={{ false: '#E0E0E0', true: localTheme + '99' }}
              thumbColor={localOpenCamera ? localTheme : '#F4F4F4'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {/* ── 開關：拍照時自動下載照片 ── */}
          <View style={s.toggleRow}>
            <View style={s.toggleLabels}>
              <Text style={[s.toggleTitle, { color: localTheme }]}>拍照時自動下載照片</Text>
              <Text style={s.toggleDesc}>每次拍照後自動將照片儲存到手機相簿</Text>
            </View>
            <Switch
              value={localAutoSave}
              onValueChange={(v) => { if (!requirePro('拍照時自動下載照片')) return; setLocalAutoSave(v); }}
              trackColor={{ false: '#E0E0E0', true: localTheme + '99' }}
              thumbColor={localAutoSave ? localTheme : '#F4F4F4'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>

          {/* ── 目前身高 ── */}
          <Text style={[s.sectionTitle, { marginTop: 20, color: localTheme }]}>目前身高</Text>
          <View style={[s.heightRow, { borderColor: localTheme + '66' }]}>
            <TextInput
              style={s.heightInput}
              value={localHeight}
              onChangeText={setLocalHeight}
              placeholder="請輸入身高"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text style={s.heightUnit}>cm</Text>
          </View>

          {/* ── 主題顏色 ── */}
          <Text style={[s.sectionTitle, { marginTop: 20, color: localTheme }]}>主題顏色</Text>
          <View style={s.colorGrid}>
            {THEME_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[s.colorCircle, { backgroundColor: color }]}
                onPress={() => { if (!requirePro('主題色')) return; setLocalTheme(color); }}
                activeOpacity={0.75}
              >
                {localTheme === color && (
                  <Ionicons
                    name={'checkmark' as IoniconsName}
                    size={18}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* ── 備份與還原 ── */}
          <Text style={[s.sectionTitle, { marginTop: 20, color: localTheme }]}>備份與還原</Text>

          <TouchableOpacity
            style={[s.backupBtnFilled, { backgroundColor: localTheme }]}
            onPress={handleExport}
            activeOpacity={0.82}
          >
            <Text style={s.backupBtnFilledText}>匯出備份</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.backupBtnOutline, { borderColor: localTheme }]}
            onPress={handleImport}
            activeOpacity={0.82}
          >
            <Text style={[s.backupBtnOutlineText, { color: localTheme }]}>匯入備份</Text>
          </TouchableOpacity>

          <Text style={s.backupHint}>
            合併：新資料加入現有資料｜覆蓋：清除現有資料後還原
          </Text>

          {/* ── 確認套用 ── */}
          <TouchableOpacity
            style={[s.applyBtn, { backgroundColor: localTheme }]}
            onPress={handleApply}
            activeOpacity={0.82}
          >
            <Text style={s.applyText}>確認套用</Text>
          </TouchableOpacity>

          {/* ── 關閉 ── */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.closeText}>關閉</Text>
          </TouchableOpacity>

          <AdBanner />
        </ScrollView>

        {/* ── 備份進度 overlay ── */}
        {backupProgress !== null && (
          <View style={s.progressOverlay}>
            <View style={s.progressCard}>
              <Text style={s.progressMessage}>{backupMessage}</Text>
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${backupProgress}%` as `${number}%`,
                      backgroundColor: localTheme,
                    },
                  ]}
                />
              </View>
              <Text style={s.progressPct}>{backupProgress}%</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: 1,
  },

  /* 開關列 */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  toggleLabels: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#AAAAAA',
    lineHeight: 17,
  },

  /* 身高輸入 */
  heightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  heightInput: {
    flex: 1,
    fontSize: 17,
    color: '#333',
    fontWeight: '600',
  },
  heightUnit: { fontSize: 13, color: '#AAA', marginLeft: 4 },

  /* 主題顏色 */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
    marginBottom: 14,
  },
  proBadge: {
    fontSize: 15,
    fontWeight: '600',
    color: '#43a047',
    marginBottom: 12,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  planMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  legalLink: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 12,
    color: '#ccc',
  },
  legalHint: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  /* 備份按鈕 */
  backupBtnFilled: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backupBtnFilledText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  backupBtnOutline: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  backupBtnOutlineText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },
  backupHint: {
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 17,
  },

  /* 進度 overlay */
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressCard: {
    width: '76%',
    alignItems: 'center',
    gap: 14,
  },
  progressMessage: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 13,
    color: '#AAAAAA',
  },

  /* 按鈕 */
  applyBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  applyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  closeBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
  },
  closeText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});
