import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_COLORS = [
  '#2D2D2D', // 黑色
  '#E8A8A4', // 玫瑰粉（預設）
  '#8EC8B8', // 薄荷綠
  '#C4B0DC', // 薰衣草紫
  '#F0B898', // 蜜桃橘
  '#A8C8E4', // 天空藍
  '#F0DC8C', // 奶油黃
  '#D4A8C8', // 霧紫粉
  '#B4C88C', // 橄欖綠
  '#C8B090', // 沙褐色
] as const;

export const DEFAULT_THEME = '#E8A8A4';

const STORAGE_KEY = '@sparkshape_settings';
const PRO_STORAGE_KEY = '@sparkshape_isProUnlocked';

interface SettingsData {
  openCameraOnLaunch: boolean;
  autoSavePhotos: boolean;
  themeColor: string;
  height: string;   // 身高，單位 cm，例如 "165"
}

interface SettingsState extends SettingsData {
  loaded: boolean;
  isProUnlocked: boolean;
  pendingCameraOpen: boolean;
  /** session flag：冷啟動時觸發一次後設為 true，返回首頁時不再重複觸發 */
  hasAutoLaunched: boolean;
  pendingSettingsOpen: boolean; // session-only, not persisted
  loadSettings: () => Promise<void>;
  applySettings: (patch: Partial<SettingsData>) => Promise<void>;
  setProUnlocked: (v: boolean) => Promise<void>;
  triggerCameraOpen: () => void;
  clearPendingCameraOpen: () => void;
  markAutoLaunched: () => void;
  triggerSettingsOpen: () => void;
  clearPendingSettingsOpen: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  openCameraOnLaunch: false,
  autoSavePhotos: false,
  themeColor: DEFAULT_THEME,
  height: '',
  loaded: false,
  isProUnlocked: false,
  pendingCameraOpen: false,
  hasAutoLaunched: false,
  pendingSettingsOpen: false,

  loadSettings: async () => {
    try {
      const [json, isPro] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PRO_STORAGE_KEY),
      ]);
      if (json) {
        const saved: Partial<SettingsData> = JSON.parse(json);
        set({ ...saved, isProUnlocked: isPro === 'true', loaded: true });
      } else {
        set({ isProUnlocked: isPro === 'true', loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  applySettings: async (patch) => {
    set(patch);
    try {
      const s = get();
      const data: SettingsData = {
        openCameraOnLaunch: s.openCameraOnLaunch,
        autoSavePhotos: s.autoSavePhotos,
        themeColor: s.themeColor,
        height: s.height,
        ...patch,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('settings save failed:', e);
    }
  },

  setProUnlocked: async (v: boolean) => {
    set({ isProUnlocked: v });
    await AsyncStorage.setItem(PRO_STORAGE_KEY, String(v));
  },

  triggerCameraOpen: () => set({ pendingCameraOpen: true }),
  clearPendingCameraOpen: () => set({ pendingCameraOpen: false }),
  markAutoLaunched: () => set({ hasAutoLaunched: true }),
  triggerSettingsOpen: () => set({ pendingSettingsOpen: true }),
  clearPendingSettingsOpen: () => set({ pendingSettingsOpen: false }),
}));
