import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsPro } from '@/hooks/useIsPro';

describe('useIsPro', () => {
  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('iOS：跟隨 store 的 isProUnlocked（true）', () => {
    Platform.OS = 'ios';
    useSettingsStore.setState({ isProUnlocked: true });
    const { result } = renderHook(() => useIsPro());
    expect(result.current).toBe(true);
  });

  it('iOS：跟隨 store 的 isProUnlocked（false）', () => {
    Platform.OS = 'ios';
    useSettingsStore.setState({ isProUnlocked: false });
    const { result } = renderHook(() => useIsPro());
    expect(result.current).toBe(false);
  });

  it('Android：不管 store 狀態一律回傳 true（沒有付費入口，全功能免費開放）', () => {
    Platform.OS = 'android';
    useSettingsStore.setState({ isProUnlocked: false });
    const { result } = renderHook(() => useIsPro());
    expect(result.current).toBe(true);
  });
});
