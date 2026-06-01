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

interface SettingsData {
  openCameraOnLaunch: boolean;
  autoSavePhotos: boolean;
  themeColor: string;
  height: string;   // 身高，單位 cm，例如 "165"
}

interface SettingsState extends SettingsData {
  loaded: boolean;
  pendingCameraOpen: boolean;
  /** session flag：冷啟動時觸發一次後設為 true，返回首頁時不再重複觸發 */
  hasAutoLaunched: boolean;
  loadSettings: () => Promise<void>;
  applySettings: (patch: Partial<SettingsData>) => Promise<void>;
  triggerCameraOpen: () => void;
  clearPendingCameraOpen: () => void;
  markAutoLaunched: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  openCameraOnLaunch: false,
  autoSavePhotos: false,
  themeColor: DEFAULT_THEME,
  height: '',
  loaded: false,
  pendingCameraOpen: false,
  hasAutoLaunched: false,

  loadSettings: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const saved: Partial<SettingsData> = JSON.parse(json);
        set({ ...saved, loaded: true });
      } else {
        set({ loaded: true });
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

  triggerCameraOpen: () => set({ pendingCameraOpen: true }),
  clearPendingCameraOpen: () => set({ pendingCameraOpen: false }),
  markAutoLaunched: () => set({ hasAutoLaunched: true }),
}));
