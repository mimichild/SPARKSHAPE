import {
  Keyboard,
  Modal,
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
import { THEME_COLORS, useSettingsStore } from '@/stores/settingsStore';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsSheet({ visible, onClose }: Props) {
  const store = useSettingsStore();

  // 本地（暫存）狀態，按下確認套用才寫入 store
  const [localOpenCamera, setLocalOpenCamera] = useState(store.openCameraOnLaunch);
  const [localAutoSave,   setLocalAutoSave]   = useState(store.autoSavePhotos);
  const [localTheme,      setLocalTheme]      = useState(store.themeColor);
  const [localHeight,     setLocalHeight]     = useState(store.height ?? '');

  // 每次開啟面板時同步最新 store 值
  useEffect(() => {
    if (visible) {
      setLocalOpenCamera(store.openCameraOnLaunch);
      setLocalAutoSave(store.autoSavePhotos);
      setLocalTheme(store.themeColor);
      setLocalHeight(store.height ?? '');
    }
  }, [visible]);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 半透明背景 */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      {/* 設定面板 */}
      <View style={s.sheet}>
        {/* 上拉條 */}
        <View style={s.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* 標題 */}
          <Text style={s.title}>設定</Text>

          {/* ── 開關：開啟時直接用相機打開 ── */}
          <View style={s.toggleRow}>
            <View style={s.toggleLabels}>
              <Text style={[s.toggleTitle, { color: localTheme }]}>開啟時直接用相機打開</Text>
              <Text style={s.toggleDesc}>開啟 APP 後自動跳過首頁，直接開啟相機</Text>
            </View>
            <Switch
              value={localOpenCamera}
              onValueChange={setLocalOpenCamera}
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
              onValueChange={setLocalAutoSave}
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
                onPress={() => setLocalTheme(color)}
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
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
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
