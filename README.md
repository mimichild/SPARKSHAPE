# SPARKSHAPE## 語言與核心框架

| 項目 | 版本 | 說明 |
|------|------|------|
| TypeScript | ~5.9.2 | strict 模式，所有程式碼須有型別 |
| React | 19.1.0 | 函數式元件 + Hooks |
| React Native | 0.81.5 | 跨平台 iOS / Android / Web |
| Expo SDK | ~54.0.33 | newArchEnabled: true（新架構） |
| Expo Router | ~6.0.23 | 檔案式路由（類 Next.js） |

---

## 主要套件

### UI / 畫面

| 套件 | 版本 | 用途 |
|------|------|------|
| `react-native-safe-area-context` | ~5.6.0 | Safe area / Dynamic Island 處理 |
| `react-native-screens` | ~4.16.0 | 原生 Screen 容器 |
| `react-native-gesture-handler` | ~2.28.0 | 手勢支援（滑動返回等） |
| `react-native-reanimated` | ~4.1.1 | 動畫 |
| `react-native-worklets` | ^0.8.3 | Reanimated Worklets 支援 |
| `@shopify/flash-list` | 2.0.2 | 高效能長列表（取代 FlatList） |
| `expo-status-bar` | ~3.0.9 | 狀態列控制 |
| `expo-splash-screen` | ~31.0.13 | 啟動畫面控制 |

### 資料 / 狀態

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-sqlite` | ~16.0.10 | 本機 SQLite 資料庫 |
| `zustand` | ^5.0.13 | 全域輕量狀態管理 |
| `@react-native-async-storage/async-storage` | 2.2.0 | 設定持久化（主題色、開關等） |

### 媒體 / 相機

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-camera` | ~17.0.10 | 相機拍攝 |
| `expo-image-picker` | ~17.0.11 | 從相簿選取照片 |
| `expo-image-manipulator` | ~14.0.8 | 照片壓縮 / 裁切 |
| `expo-media-library` | ~17.0.6 | 儲存照片到裝置相簿 |

### 檔案 / 分享

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-file-system` | ~19.0.22 | 本機檔案讀寫 |
| `expo-sharing` | ~14.0.8 | 分享檔案到系統 |
| `expo-document-picker` | ~14.0.8 | 選取備份檔案 |
| `fflate` | ^0.8.3 | 快速 ZIP 壓縮（備份/匯出） |
| `jszip` | ^3.10.1 | ZIP 解壓縮（備份還原） |

### 工具

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-constants` | ~18.0.13 | 裝置常數（App 版本等） |
| `expo-linking` | ~8.0.12 | Deep Link 處理 |

### 開發 / 測試

| 套件 | 版本 | 用途 |
|------|------|------|
| `jest` | ^29.7.0 | 單元測試框架 |
| `jest-expo` | ~54.0.17 | Expo 專用 Jest preset |
| `@testing-library/react-native` | ^13.3.3 | React Native 元件測試 |
| `@types/jest` | ^29.5.12 | Jest 型別定義 |
| `@types/react` | ~19.0.0 | React 型別定義 |
| `@babel/core` | ^7.24.0 | Babel 核心 |
| `typescript` | ~5.9.2 | 型別檢查 |

---

## 專案目錄結構（參考 SPARKPLATE）

```
SPARKSHAPE/
├── app/                        # Expo Router 路由頁面
│   ├── _layout.tsx             # Root Layout（Provider + Stack）
│   ├── index.tsx               # 首頁入口
│   └── (tabs)/
│       ├── _layout.tsx         # Tab Layout
│       └── *.tsx               # 各分頁
├── src/
│   ├── components/             # 可重用 UI 元件（PascalCase.tsx）
│   ├── constants/              # 常數定義
│   ├── hooks/                  # Custom Hooks（use 前綴）
│   ├── providers/              # Context Provider
│   ├── services/               # 純函式資料存取層
│   ├── stores/                 # Zustand 全域狀態
│   ├── types/                  # TypeScript 型別定義
│   └── __tests__/              # 測試檔案（對應 src 結構）
├── assets/                     # 圖示、啟動圖
├── docs/                       # 文件
├── android/                    # Android 原生專案（Expo 生成）
├── __mocks__/                  # Jest Mock
├── app.json                    # Expo 設定
├── babel.config.js             # babel-preset-expo
├── tsconfig.json               # TypeScript 設定
└── package.json
```

---

## 架構設計原則

### 資料流（單向）

```
DB (SQLite)
  └─ services/     純函式，接受 db 參數，不持有狀態
       └─ hooks/   封裝 useState + useCallback，提供 reload()
            └─ screens (app/)   消費 hooks，只做 UI 渲染
```

### 狀態分層

| 層級 | 工具 | 用途 |
|------|------|------|
| 伺服器狀態 | expo-sqlite + custom hooks | 資料庫資料 |
| 全域 UI 狀態 | Zustand (`stores/`) | 主題色、設定、Modal 觸發信號 |
| 本機元件狀態 | useState | 表單欄位、Modal 開關 |
| 設定持久化 | AsyncStorage | 主題色、字體、開關等設定 |

### DB Provider 模式

```
DBProvider（Context）
  → 初始化 SQLite → 提供 db 實例給所有子元件
  → useDBContext() 取得 db
```

### Zustand 信號模式

觸發跨元件行為時，用 `pending*` boolean 作為單次信號，消費後立即清除：

```ts
triggerSomeAction()        // 設為 true
→ 目標元件 useEffect 監聽 → clearPendingSomeAction()  // 清除
```

### 照片儲存（若有相機功能）

- 照片存在本機檔案系統（`expo-file-system`），路徑：`documentDirectory/photos/{photoId}/`
- 多尺寸版本：

| 尺寸 | 用途 | 最大寬高 | 壓縮品質 |
|------|------|---------|---------|
| `thumb` | 縮圖 | 120×120 | 0.80 |
| `grid` | 格狀牆 | 400×400 | 0.85 |
| `detail` | 大圖檢視 | 800×800 | 0.90 |
| `backup-lite` | 備份輕量版 | 600×600 | 0.60 |

---

## 命名規範

### TypeScript / React

| 對象 | 規範 | 範例 |
|------|------|------|
| 變數 / 函式 | camelCase | `getItemById`, `usageCount` |
| 型別 / Interface | PascalCase | `Item`, `FilterCriteria`, `AppSettings` |
| React 元件 | PascalCase | `ItemCard`, `FilterPanel` |
| 常數 | UPPER_SNAKE_CASE | `DEFAULT_FONT_COLOR`, `DB_NAME`, `STORAGE_KEYS` |
| Custom Hook | `use` 前綴 | `useItems`, `useDB` |
| Zustand Store | `use` 前綴 + Store 後綴 | `useSettingsStore` |

### 檔案命名

| 類型 | 規範 | 範例 |
|------|------|------|
| React 元件 | PascalCase.tsx | `ItemCard.tsx` |
| Service | camelCase.ts | `itemService.ts` |
| Hook | camelCase.ts | `useItems.ts` |
| Store | camelCase.ts | `settingsStore.ts` |
| Constants | camelCase.ts | `themeColors.ts` |
| 路由頁面 | camelCase.tsx 或 `[param].tsx` | `home.tsx`, `[id].tsx` |
| 測試檔案 | `{目標}.test.ts(x)` | `ItemCard.test.tsx` |

### 日期格式

- 僅日期：`'YYYY-MM-DD'`
- 完整時間：`new Date().toISOString()` → `'YYYY-MM-DDTHH:mm:ss.sssZ'`
- SQLite 欄位型別皆為 `TEXT`

---

## TypeScript 設定

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- `@/` 路徑別名對應 `src/`
- strict 模式全開

---

## 測試規範

- 測試放 `src/__tests__/`，對應 src 目錄結構
- 檔名：`{目標}.test.ts(x)`
- Native 模組 mock 放 `__mocks__/`

```bash
npm test                  # 執行所有測試
npm run test:watch        # 監看模式
npm run test:coverage     # 覆蓋率報告
npx tsc --noEmit          # 型別檢查
```

---

## App 設定（app.json 範本）

| 項目 | SPARK FIT 參考值 | 說明 |
|------|-----------------|------|
| 方向 | portrait only | 依需求調整 |
| 新架構 | newArchEnabled: true | 建議啟用 |
| Android edgeToEdge | true | 建議啟用 |
| Typed Routes | experiments.typedRoutes: true | 建議啟用 |

---

## Build 與部署

### 環境需求（Android 本機 Build）

```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.7/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
```

### 常用指令

```bash
npx expo start --clear                          # 開發伺服器
npx expo run:android --variant release          # Release APK 建置
adb install -r android/app/build/outputs/apk/release/app-release.apk
npx tsc --noEmit                                # 型別檢查



