jest.mock('@/services/purchases', () => ({
  purchasePro: jest.fn(),
}));

import { Alert } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProGate } from '@/hooks/useProGate';
import { purchasePro } from '@/services/purchases';

const mockPurchasePro = purchasePro as jest.Mock;

describe('useProGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ isProUnlocked: false });
  });

  it('requirePro returns true and does not alert when already Pro', () => {
    useSettingsStore.setState({ isProUnlocked: true });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { result } = renderHook(() => useProGate());

    let allowed = false;
    act(() => { allowed = result.current.requirePro('主題色'); });

    expect(allowed).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('requirePro returns false and shows an upgrade alert when not Pro', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useProGate());

    let allowed = true;
    act(() => { allowed = result.current.requirePro('主題色'); });

    expect(allowed).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith(
      '主題色為 Pro 專屬功能',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('the alert "升級 Pro" button triggers a direct purchase and unlocks Pro on success', async () => {
    mockPurchasePro.mockResolvedValue(true);
    let upgradePress: (() => void) | undefined;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const upgradeBtn = buttons?.find(b => b.text === '升級 Pro');
      upgradePress = upgradeBtn?.onPress as (() => void) | undefined;
    });
    const { result } = renderHook(() => useProGate());

    act(() => { result.current.requirePro('匯出備份'); });
    expect(alertSpy).toHaveBeenCalled();

    await act(async () => { await upgradePress?.(); });

    expect(mockPurchasePro).toHaveBeenCalled();
    expect(useSettingsStore.getState().isProUnlocked).toBe(true);
    expect(alertSpy).toHaveBeenCalledWith('升級成功', 'Pro 功能已啟用');
  });

  it('the alert "升級 Pro" button shows an error alert when purchase fails', async () => {
    mockPurchasePro.mockRejectedValue(new Error('RevenueCat 尚未設定，無法購買'));
    let upgradePress: (() => void) | undefined;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const upgradeBtn = buttons?.find(b => b.text === '升級 Pro');
      upgradePress = upgradeBtn?.onPress as (() => void) | undefined;
    });
    const { result } = renderHook(() => useProGate());

    act(() => { result.current.requirePro('匯出備份'); });
    await act(async () => { await upgradePress?.(); });

    expect(alertSpy).toHaveBeenCalledWith('升級失敗', 'RevenueCat 尚未設定，無法購買');
  });
});
