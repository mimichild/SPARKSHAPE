import { Alert } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useIsPro } from './useIsPro';
import { purchasePro } from '@/services/purchases';

/**
 * 免費使用者點到 Pro 專屬功能時的統一互動：跳出升級提示，按「升級 Pro」直接
 * 觸發購買（不是導回首頁再打開設定面板要求使用者自己找按鈕點第二次——原本的
 * 導頁設計在使用者已經身處設定面板時，showSettings 狀態沒變化會看起來像
 * 「沒反應」）。
 * 用法：`if (!requirePro('主題色')) return;` 接在功能執行前面。
 */
export function useProGate() {
  const isProUnlocked = useIsPro();
  const setProUnlocked = useSettingsStore(s => s.setProUnlocked);

  function requirePro(featureLabel: string): boolean {
    if (isProUnlocked) return true;
    Alert.alert(
      `${featureLabel}為 Pro 專屬功能`,
      '升級 Pro 即可解鎖，要現在升級嗎？',
      [
        { text: '之後再說', style: 'cancel' },
        {
          text: '升級 Pro',
          onPress: async () => {
            try {
              const success = await purchasePro();
              if (success) {
                await setProUnlocked(true);
                Alert.alert('升級成功', 'Pro 功能已啟用');
              }
            } catch (e) {
              Alert.alert('升級失敗', e instanceof Error ? e.message : '請稍後再試');
            }
          },
        },
      ],
    );
    return false;
  }

  return { isProUnlocked, requirePro };
}
