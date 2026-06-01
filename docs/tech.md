# SPARKSHAPE — Technical Specification

> 與 README.md 保持一致，以此為正式技術規格。

## 語言與核心框架

| 項目 | 版本 | 說明 |
|------|------|------|
| TypeScript | ~5.9.2 | strict 模式，所有程式碼須有型別 |
| React | 19.1.0 | 函數式元件 + Hooks |
| React Native | 0.81.5 | 跨平台 iOS / Android |
| Expo SDK | ~54.0.33 | newArchEnabled: true（新架構） |
| Expo Router | ~6.0.23 | 檔案式路由（類 Next.js） |

---

## 架構模式

**MVVM + Service / Hook 分層**（沿用 SPARKPLATE 慣例）

```
SQLite (expo-sqlite)
  └─ services/     純函式，接受 db 參數，不持有狀態
       └─ hooks/   封裝 useState + useCallback，提供 reload()
            └─ screens (app/)   消費 hooks，只做 UI 渲染
```

### 狀態分層

| 層級 | 工具 | 用途 |
|------|------|------|
| 伺服器狀態 | expo-sqlite + custom hooks | BodyPhoto 資料庫資料 |
| 全域 UI 狀態 | Zustand (`stores/`) | 對比頁選取照片、Modal 觸發信號 |
| 本機元件狀態 | useState | 表單欄位、Modal 開關、手勢狀態 |
| 設定持久化 | AsyncStorage | 照片排序偏好、主題設定 |

---

## 主要套件

### 媒體 / 相機

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-camera` | ~17.0.10 | 相機拍攝（3:4 比例） |
| `expo-image-picker` | ~17.0.11 | 從相簿選取照片 |
| `expo-image-manipulator` | ~14.0.8 | 照片壓縮 / 裁切多尺寸 |
| `expo-media-library` | ~17.0.6 | 儲存照片到裝置相簿 |

### 資料 / 狀態

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-sqlite` | ~16.0.10 | 本機 SQLite 資料庫 |
| `zustand` | ^5.0.13 | 全域輕量狀態管理 |
| `@react-native-async-storage/async-storage` | 2.2.0 | 設定持久化 |

### 檔案

| 套件 | 版本 | 用途 |
|------|------|------|
| `expo-file-system` | ~19.0.22 | 本機檔案讀寫 |

### UI / 手勢 / 動畫

| 套件 | 版本 | 用途 |
|------|------|------|
| `react-native-gesture-handler` | ~2.28.0 | Pan + Pinch 手勢（對齊校正畫面） |
| `react-native-reanimated` | ~4.1.1 | 流暢動畫（對齊縮放） |
| `react-native-worklets` | ^0.8.3 | Reanimated Worklets 支援 |
| `@shopify/flash-list` | 2.0.2 | 高效能九宮格列表 |
| `react-native-safe-area-context` | ~5.6.0 | Safe area / Dynamic Island |
| `react-native-screens` | ~4.16.0 | 原生 Screen 容器 |

### 開發 / 測試

| 套件 | 版本 | 用途 |
|------|------|------|
| `jest` | ^29.7.0 | 單元測試框架 |
| `jest-expo` | ~54.0.17 | Expo 專用 Jest preset |
| `@testing-library/react-native` | ^13.3.3 | React Native 元件測試 |
| `typescript` | ~5.9.2 | 型別檢查 |

---

## 專案結構

```
SPARKSHAPE/
├── app/                        # Expo Router 路由頁面
│   ├── _layout.tsx             # Root Layout（GestureHandlerRootView + DBProvider + Stack）
│   ├── index.tsx               # 重導向至 (tabs)/current
│   └── (tabs)/
│       ├── _layout.tsx         # Tab Layout（底部三分頁）
│       ├── current.tsx         # 目前身材頁
│       ├── wall.tsx            # 照片牆頁
│       └── comparison.tsx      # 身型對比頁
├── src/
│   ├── components/             # 可重用 UI 元件（PascalCase.tsx）
│   ├── constants/              # DB_NAME、PHOTO_SIZES、ASPECT_RATIO
│   ├── hooks/                  # useBodyPhotos（use 前綴）
│   ├── providers/              # DBProvider（SQLite Context）
│   ├── services/               # bodyPhotoService、photoStorageService（純函式）
│   ├── stores/                 # comparisonStore（Zustand）
│   ├── types/                  # BodyPhoto interface
│   └── __tests__/              # 測試（對應 src 結構）
├── assets/
│   └── images/
│       └── silhouette.png      # 人形輪廓圖（半透明 PNG）
├── __mocks__/                  # Jest Mock（expo-camera、expo-sqlite 等）
├── app.json                    # Expo 設定
├── babel.config.js             # babel-preset-expo
├── tsconfig.json               # TypeScript strict + @/* 別名
└── package.json
```

---

## 照片儲存規格

路徑：`documentDirectory/body_photos/{photoId}/{size}.jpg`

| 尺寸 | 用途 | 最大寬高 | 壓縮品質 |
|------|------|---------|---------|
| `thumb` | 縮圖（九宮格） | 120×120 | 0.80 |
| `grid` | 格狀牆 | 400×400 | 0.85 |
| `detail` | 大圖預覽 | 800×800 | 0.90 |
| `full` | 對比頁原圖 | 1080×1440 | 0.90 |

---

## 命名規範

| 對象 | 規範 | 範例 |
|------|------|------|
| 變數 / 函式 | camelCase | `getAllBodyPhotos`, `takenAt` |
| 型別 / Interface | PascalCase | `BodyPhoto` |
| React 元件 | PascalCase | `BodyPhotoCard`, `SilhouetteOverlay` |
| 常數 | UPPER_SNAKE_CASE | `DB_NAME`, `PHOTO_SIZES` |
| Custom Hook | `use` 前綴 | `useBodyPhotos` |
| Zustand Store | `use` 前綴 + Store 後綴 | `useComparisonStore` |
| Service 檔案 | camelCase.ts | `bodyPhotoService.ts` |
| 測試檔案 | `{目標}.test.ts(x)` | `BodyPhotoCard.test.tsx` |

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

---

## 測試規範

```bash
npm test                  # 執行所有測試
npm run test:watch        # 監看模式
npm run test:coverage     # 覆蓋率報告
npx tsc --noEmit          # 型別檢查
```

---

## App 設定（app.json）

| 項目 | 值 |
|------|---|
| 方向 | portrait only |
| 新架構 | newArchEnabled: true |
| Android edgeToEdge | true |
| Typed Routes | experiments.typedRoutes: true |

---

## 環境需求（Android 本機 Build）

```bash
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.7/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
```

```bash
npx expo start --clear                          # 開發伺服器
npx expo run:android --variant release          # Release APK 建置
```

## 權限需求

| 權限 | Android | iOS |
|------|---------|-----|
| 相機 | `CAMERA` | `NSCameraUsageDescription` |
| 相簿讀取 | `READ_MEDIA_IMAGES` | `NSPhotoLibraryUsageDescription` |
| 相簿寫入 | `WRITE_EXTERNAL_STORAGE`（API < 29）| `NSPhotoLibraryAddUsageDescription` |
