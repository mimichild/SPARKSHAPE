# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKSHAPE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-07-23 為 34 tests passed）
- monetization-001：passing；AdMob／RevenueCat 已設定並已實機 build 安裝成功；購買流程實測時遇到 RevenueCat 官方已知事故（詳見 SPARKWEAR 的 monetization_spec_5_apps 記憶），待事故排除後重測
- 目前最高優先級未完成功能：無（feature_list.json 內下一個 not_started 功能待下輪選取）
- 目前 blocker：RevenueCat 購買測試卡在官方事故（非本專案問題），等對方修復
- 背景：Apple Developer Program 已生效（2026-07-20）；ios-001～ios-006、native-001 皆已 passing（含 TestFlight 實機驗證），EAS 雲端建置成功產出 .ipa，也驗證了兩個 config plugin（fmt/RCTBridge）在雲端環境確實有效；實機測試核心流程（相機拍照/相簿選圖/資料持久化）皆無問題；App icon 圓形外菱格紋殘留問題已修好並實機確認（同時解決 iOS 與 Android，因為兩邊共用同一張來源圖）；已設定 EAS Update（OTA）支援與 eas.json ascAppId（submit 可完全非互動執行）

## 工作階段日誌

### 工作階段 016

- 日期：2026-07-27
- 本輪目標：實機建置驗證 AdMob／RevenueCat
- 已完成：`npx expo run:ios --device` 成功建置並安裝到實機，App 正常開啟
- 執行過的驗證：實機互動測試——升級 Pro 時遇到 RevenueCat 官方已知事故導致的錯誤（詳見 SPARKWEAR 的 monetization_spec_5_apps 記憶），排查過設定本身沒問題
- 已知風險或未解決問題：購買流程尚未驗證成功；5 個 App 目前只有 SPARKWEAR 測試成功過
- 下一步最佳動作：等 RevenueCat 網站上方事故提示消失後，直接開已裝好的 App 重測「升級 Pro」，不用重新 build；5 個 App 全部測過後才進入送 App Store 審查階段

### 工作階段 015

- 日期：2026-07-27
- 本輪目標：設定 RevenueCat（照 SPARKWEAR 範本流程複製）
- 已完成：建立 RevenueCat App（Bundle ID `com.sparkshape.app`，用 5 個 App 共用的 In-App Purchase Key P8）→ 拿到 Public API Key `appl_kpPQYYlfxadsVyGttcAgdWNOtfo`；建立 `pro` entitlement 並接上 `com.sparkshape.app.pro.monthly`／`.pro.yearly`；`default` offering 的 Monthly/Yearly package 接上對應商品；`src/constants/monetization.ts` 的 `REVENUECAT_API_KEY` 換成正式 Key
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤）；`npx jest`（7 suites、34 tests 全過）
- 已知風險或未解決問題：尚未實機測試真實購買流程
- 下一步最佳動作：5 個 App 的 AdMob／RevenueCat 都已設定完成，接下來找時間排一次原生 build（每個 App 都要），實機測試購買/恢復購買流程

### 工作階段 014

- 日期：2026-07-23
- 本輪目標：使用者在 AdMob 後台建好橫幅廣告單元，把測試版位換成正式的
- 已完成：`src/constants/monetization.ts` 的 `BANNER_AD_UNIT_ID` 改成 `Platform.select`，iOS 用正式 ID `ca-app-pub-8914492142878610/3627858585`，Android 維持 `TestIds.BANNER`
- 執行過的驗證：`npx tsc --noEmit`（無新增錯誤）；`npx jest`（7 suites、34 tests 全過）
- 已知風險或未解決問題：需要重新原生 build 才會真正生效；AdMob 應用程式狀態目前是「需審核」
- 下一步最佳動作：找時間跑一次原生 build 讓新 ID 生效；之後設定 RevenueCat

### 工作階段 013

- 日期：2026-07-23
- 本輪目標：使用者申請好真實 AdMob 帳號，把 iOS App ID 換成正式的
- 已完成：`app.json` config plugin 的 `iosAppId` 換成 `ca-app-pub-8914492142878610~4848460972`；`androidAppId` 維持 Google 官方測試 ID（Android 一律視為 Pro，`AdBanner` 永遠不會渲染，不需要申請真的 Android 廣告版位）
- 執行過的驗證：`python3 -c "json.load(...)"` 確認 app.json 仍是合法 JSON
- 已知風險或未解決問題：這個改動屬於原生設定（會寫入 iOS Info.plist 的 GADApplicationIdentifier），純 JS 的 `eas update` OTA 推不動，需要重新 `expo prebuild`/整套 build 才會生效；廣告單元 ID（`BANNER_AD_UNIT_ID`）還沒換，目前仍是 Google 測試版位，待使用者在 AdMob 後台建立橫幅版位後提供
- 下一步最佳動作：收到廣告單元 ID 後更新 `src/constants/monetization.ts`；之後找時間跑一次原生 build 讓新 App ID 生效

### 工作階段 012

- 日期：2026-07-23
- 本輪目標：分頁列底部安全區改成依「有沒有廣告」動態決定（跟其他四個 App 同步處理）
- 已完成：`app/(tabs)/_layout.tsx` 的 `CustomTabBar`（上一輪剛改成自繪）加 `useSafeAreaInsets()` + `useIsPro()`，`bottomInset = isPro ? insets.bottom : 0`，動態加到容器 `height`/`paddingBottom`
- 執行過的驗證：`npx tsc --noEmit`（無錯誤）；`npx jest`（7 suites、34 tests 全過）；模擬器（免費/有廣告狀態）screenshot＋PIL 像素量測確認分頁列高度維持 144px＝48pt（跟上一輪修好後一致，代表 `bottomInset=0` 這個分支沒有被改壞）
- 已知風險或未解決問題：Pro（無廣告）分支目前無法在模擬器上實測（RevenueCat 尚未設定金鑰），邏輯依賴標準 `useSafeAreaInsets()` 疊加，未做額外模擬器驗證
- 下一步最佳動作：待 RevenueCat 金鑰設定好或有 Android 實機時，實際切到 Pro 狀態確認分頁列底部有補回安全區

### 工作階段 011

- 日期：2026-07-23
- 本輪目標：UI 微調——移除首頁互連連結、修分頁列高度過高的問題
- 已完成：
  - `app/index.tsx` 移除跳轉到 SPARK FIT / SPARK PLATE 的互連連結區塊（連同 `openApp()`、`APP_DOWNLOAD_URLS`、相關 style）
  - 分頁列高度問題：原本猜是 `tabBarStyle.height` 沒被 react-navigation 完全遵守，試了兩輪調整都沒用（甚至使用者回報「變得更高了」）。改用像素量測screenshot（PIL 抓 pink 色塊邊界）才找到真正原因：**不是 tabBarStyle 的問題**，是三個分頁畫面（`current.tsx`/`wall.tsx`/`comparison.tsx`）各自的 `<SafeAreaView>` 沒有限制 `edges`，預設會把底部安全區（~34pt）當成 padding 保留，且背景色跟分頁列同樣是 `themeColor`（粉色），視覺上跟分頁列的粉色融成一塊，才會看起來「還是很高」。量測結果：34pt（畫面自己多墊的安全區）＋分頁列本身高度＝視覺上的總高度。
  - 修法：三個分頁畫面的 SafeAreaView 都加上 `edges={['top','left','right']}`（排除 bottom，因為真正的畫面底部是 AdBanner，不需要再留安全區）；順便把 `app/(tabs)/_layout.tsx` 的分頁列從「用 tabBarStyle 硬調樣式」改成完全自繪的 `CustomTabBar`（固定 `height:48` 的 `<View>`），避免以後又要跟 react-navigation 的內部樣式合併行為打架
  - 過程中也發現這個專案的 Metro（本輪之前就常態用 nohup 背景執行）file watcher 疑似壞掉——存檔後重新整理 app 都只看到 log 顯示 bundle 了「1 module」，不是完整重新打包；用 `--clear` 全新啟動 Metro 兩次才確認拿到真正反映最新程式碼的 bundle（1837 modules）。之後這個專案如果再遇到「明明改了程式碼、畫面卻沒變」，先懷疑 Metro watcher 而不是自己的程式碼邏輯
- 執行過的驗證：
  - `npx tsc --noEmit` 無錯誤
  - `npx jest` 全過（7 suites，34 tests）
  - Metro `--clear` 全新啟動後（確認 1837 modules 完整 bundle），用 `xcrun simctl openurl booted "sparkshape:///(tabs)/current"` 深連結逐一開三個分頁，screenshot 後用 Python/PIL 量測分頁列粉色色塊的實際像素高度：修好前 246px（=82pt，等於分頁列 48pt ＋ 多餘安全區 34pt）；修好後 144px（=48pt，跟程式碼設定的高度完全吻合）
  - 三個分頁（目前身材/照片牆/身型對比）screenshot 目視確認樣式一致、「編輯數據/刪除數據」按鈕不再被分頁列遮住
- 已知風險或未解決問題：無
- 下一步最佳動作：commit 本輪修改；下次工作階段開始時照常從 feature_list.json 選下一個 not_started 功能

### 工作階段 010

- 日期：2026-07-23
- 本輪目標：複製 SPARKWEAR/SPARKPLATE 的付費功能範本到 SPARKSHAPE（monetization-001）
- 已完成：
  - 安裝 `react-native-google-mobile-ads`（鎖定 16.3.4）與 `react-native-purchases`
  - 新增 `src/constants/monetization.ts`、`src/services/purchases.ts`、`src/hooks/useIsPro.ts`、`src/hooks/useProGate.ts`、`src/components/AdBanner.tsx`
  - `settingsStore.ts` 加 `isProUnlocked`/`setProUnlocked`/`pendingSettingsOpen`（沿用 SPARKPLATE 那套 pattern，因為這個 App 的設定也是面板不是獨立畫面）
  - `SettingsSheet.tsx` 加 PRO 解鎖區塊；因為這個元件是「本地暫存、按確認套用才寫入 store」的設計，Pro 鎖選在互動當下（Switch onValueChange／色票 onPress）就攔截而不是最後 handleApply 才攔截，避免連未鎖定的「身高」欄位一起卡住
  - 廣告放置：首頁、三個分頁（掛在 `app/(tabs)/_layout.tsx` 共用一條，分頁列改固定高度 56）
  - 這個專案第一次有測試需要 import `settingsStore`，發現原本完全沒設定 `@react-native-async-storage/async-storage` 的 jest mock（`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null` 報錯），補上官方提供的 mock 檔案並用 moduleNameMapper 接上（用 setupFiles 掛載不會生效，因為官方 mock 檔本身只 export 物件、不會自動呼叫 jest.mock，要用 moduleNameMapper 直接替換整個模組）
  - 新增對應單元測試，34 tests 全過；`npx tsc --noEmit -p .` 完全無錯誤
  - `npx expo prebuild --platform ios && pod install` 成功；`npx expo run:ios` 建置成功並在模擬器實測：首頁看得到 AdMob 測試廣告、設定面板正常渲染 PRO 解鎖區塊、點「升級 Pro」正確跳出『升級失敗：RevenueCat 尚未設定，無法購買』
- 執行過的驗證：`./init.sh`（34 tests passed）、`npx tsc --noEmit -p .`（無錯誤）、模擬器手動操作（主流程）
- 已擷取證據：見 feature_list.json monetization-001 evidence
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：個別鎖點（開機用相機/拍照自動下載開關、主題色、匯出、匯入、恢復購買、Android 全功能開放、三個分頁的廣告位置）還沒逐一手動點過
- 下一步最佳動作：使用者有空時自己測一輪個別鎖點 → monetization-001 改 passing；接著複製到 SPARKFIT/SPARKLOG

### 工作階段 009

- 日期：2026-07-22
- 本輪目標：把 ios-006 icon 修復實際出貨到 TestFlight 並實機確認
- 已完成：
  - 設定 EAS Update（OTA）支援；eas.json 加 `ascAppId` 讓 submit 完全非互動
  - `eas build` + `eas submit`（Build 2，含 icon 修復）→ 使用者在 App Store Connect 加入測試群組 → iPhone TestFlight 安裝
  - 使用者實機確認「現在看起來都正常了」，icon 菱格紋問題確認解決
- 執行過的驗證：`./init.sh`（17 tests passed）、實機 TestFlight 圖示確認
- 已擷取證據：見 feature_list.json ios-006 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：無
- 下一步最佳動作：feature_list.json 全部 passing，無待辦項目

### 工作階段 008

- 日期：2026-07-22
- 本輪目標：修 ios-006（App icon 圓形外菱格紋殘留）
- 已完成：
  - 用 ImageMagick 分析發現實際範圍比原本以為的更大：不只角落，整個圓形外的背景都是灰白棋盤格，烙進 `assets/images/icon.png` 的真實像素（無 alpha 通道）
  - 嘗試單純用 `-opaque` 配 fuzz 比對單一灰色替換行不通：fuzz 不夠會殘留棋盤格邊緣，fuzz 太多會連粉紅圓形本體一起被洗掉，兩者安全區間沒有交集
  - 改用色彩飽和度判斷解法：`magick icon.png -fx "(abs(r-g)<0.05)&&(abs(g-b)<0.05)&&(abs(r-b)<0.05) ? 1 : u"`（無色彩/接近灰階的像素一律轉純白，其餘保留原色），完美清除棋盤格且完全不影響粉紅圓形與白色剪影
  - `npx expo prebuild --platform ios` 重新產生資源，確認 `Images.xcassets/AppIcon.appiconset` 裡的圖已經是修好的版本
  - 同一張 `icon.png` 也是 app.json 裡 Android `adaptiveIcon.foregroundImage`，這次修復對 Android 版一併有效
- 執行過的驗證：`./init.sh`（17 tests passed）、ImageMagick 像素級檢查（角落、圓形邊緣裁切放大比對）、prebuild 產出檔案比對
- 已擷取證據：見 feature_list.json ios-006 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：無
- 下一步最佳動作：feature_list.json 目前全部 passing，無待辦項目

### 工作階段 007

- 日期：2026-07-21
- 本輪目標：完成 ios-005（TestFlight 內部測試）剩餘步驟——加入測試群組＋實機驗證
- 已完成：
  - 使用者於 App Store Connect 把 Build 1 加入內部測試群組，iPhone 用 TestFlight 成功安裝並開啟 SPARKSHAPE
  - 實機重跑核心流程（相機拍照 CameraSheet、相簿選圖、關閉重開確認資料持久化），使用者確認「功能都測試過，沒有問題」
- 執行過的驗證：見上述，皆為使用者實機手動操作
- 已擷取證據：見 feature_list.json ios-005 evidence
- 提交記錄：（本輪 commit）
- 已知風險或未解決問題：無
- 下一步最佳動作：目前 feature_list.json 全部 passing，無待辦項目；有新需求再開新 feature

### 工作階段 006

- 日期：2026-07-21
- 本輪目標：ios-005 中不需要實機的部分先做完（eas submit）
- 已完成：使用者於 Terminal.app 互動執行 `eas submit --platform ios --profile production --latest`，Build a71afc9e-486b-4894-9eb-a1a80e939471 上傳成功
- 執行過的驗證：實際跑 eas submit，看到「Submitted your app to Apple App Store Connect!」完成訊息
- 已擷取證據：見 feature_list.json ios-005 evidence
- 提交記錄：76434b8
- 已知風險或未解決問題：ios-005 剩餘兩步需要使用者的實體 iPhone
- 下一步最佳動作：等使用者有 iPhone 可測時，完成 ios-005 剩餘步驟

### 工作階段 005

- 日期：2026-07-20
- 本輪目標：完成 ios-004（EAS iOS 雲端建置成功）
- 已完成：新增 eas.json（含 Node 22.13.0 修法）；`eas init` 建立 EAS 專案；`eas build --platform ios --profile production`（互動模式）一次就成功
- 執行過的驗證：實際跑 EAS 雲端建置，一次成功
- 已擷取證據：見 feature_list.json ios-004 evidence，含 build URL 與 .ipa 下載連結
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：無新增
- 下一步最佳動作：開始 ios-005（TestFlight 內部測試，需要實體 iPhone）

### 工作階段 004

- 日期：2026-07-20
- 本輪目標：完成 native-001（把 fmt/RCTBridge 原生修復轉成 Expo config plugin）
- 已完成：
  - 備份本機 `ios/`
  - 用 `npx expo install expo-build-properties` 裝上官方 plugin，設定 `ios.buildReactNativeFromSource: true`（取代手動改 Podfile.properties.json）
  - 複製 SPARKPLATE 的 `plugins/withRemoveRCTBridgeSourceURL.js` 處理 RCTBridge 問題
  - 新寫 `plugins/withFmtConstevalFix.js`（用 `withPodfile` mod）處理 fmt consteval 編譯錯誤
  - **踩坑**：第一版把 fmt 修復插在 `react_native_post_install(...)` 呼叫「之前」，導致設定被它蓋掉、建置仍然失敗，錯誤訊息跟修復前一模一樣；改成插在該呼叫「之後」（跟原本手動修復的順序一致）就成功了——這是用 config plugin 改 Podfile 時務必注意的順序陷阱
  - 修正後 `prebuild --clean` + 建置成功，確認三個修復（fmt、buildReactNativeFromSource、RCTBridge）都正確出現在重新產生的 `ios/`
- 執行過的驗證：模擬器實測建置（第一次失敗重現錯誤、修正後成功）、`./init.sh`（17 tests passed）
- 已擷取證據：見 feature_list.json native-001 evidence；截圖 docs/native-001-prebuild-clean-success.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：ios-004/ios-005 仍卡在 Apple Developer 帳號
- 下一步最佳動作：等使用者申請好 Apple Developer Program 後才能繼續 ios-004；在那之前可以考慮開始 SPARKFIT/SPARKNOTE 的 Phase B 模擬器驗證

### 工作階段 003

- 日期：2026-07-20
- 本輪目標：完成 ios-003（模擬器驗證 ZIP 匯出/匯入）
- 已完成：
  - 匯出備份正常
  - 匯入時發現真實 bug：匯入完成、關閉設定面板後，首頁「開始使用」按鈕完全無法點擊
  - 用程式碼比對找到根因：`SettingsSheet.tsx` 用 `<Modal>` 包住整個設定面板，內部匯出/匯入又呼叫 `DocumentPicker`/`Sharing`（也是原生 Modal），iOS 巢狀開多層原生 Modal 會讓畫面卡死不回應——這正是 SPARKPLATE 的 `BackupRestoreModal.tsx` 註解裡已經記錄過、也修過的同一種問題，SPARKSHAPE 沒有套用同樣的修法
  - 修復：`SettingsSheet.tsx` 改用絕對定位 `View` 取代 `<Modal>`，跟 SPARKPLATE 做法一致；移除未使用的 `Modal` import
  - 修復後不重開 App，重新走一次「設定 → 匯入 → 關閉面板 → 點開始使用」確認按鈕恢復正常
  - sqlite3 直接查容器內 sparkshape.db 確認匯入前後資料一致、無遺失
- 執行過的驗證：模擬器手動操作＋sqlite3 直接查詢資料庫內容＋Metro log 檢查＋`pnpm test`（17 passed）＋`pnpm typecheck`（無新增錯誤）
- 已擷取證據：見 feature_list.json ios-003 evidence；截圖 docs/ios-003-import-fixed.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：SPARKFIT/SPARKNOTE 是否有同樣的「設定面板 Modal + 內部呼叫 DocumentPicker/Sharing」模式尚未檢查，值得之後順手排查
- 下一步最佳動作：開始 native-001（可直接複製 SPARKPLATE 的 RCTBridge plugin，另外還要處理 fmt 的 Podfile post_install 修復）

### 工作階段 002

- 日期：2026-07-20
- 本輪目標：完成 ios-001、ios-002（模擬器啟動＋核心流程驗證）
- 已完成：
  - ios-001：`npx expo run:ios` 建置成功，首頁正常渲染，截圖存證
  - ios-002：新增身型照片紀錄（正面照+側面照）。過程中使用者不小心點到「拍攝正面照」，模擬器丟出 `Camera not available on simulator`（模擬器無實體相機的預期行為，非閃退），改用相簿選圖後正常完成存檔；用 sqlite3 直接查容器內 sparkshape.db 確認 2 筆新記錄與照片檔案（thumb/grid/detail/full）都正確寫入，完全關閉 App 重開後資料仍在
- 執行過的驗證：模擬器手動操作＋sqlite3 直接查詢資料庫內容＋Metro log 檢查＋simctl terminate/launch 持久化測試
- 已擷取證據：見 feature_list.json ios-001／ios-002 evidence；截圖 docs/ios-001-simulator-home.png、docs/ios-002-body-photo.png
- 提交記錄：（見本輪 commit）
- 已知風險或未解決問題：無新增
- 下一步最佳動作：開始 ios-003（模擬器驗證 ZIP 匯出/匯入）

### 工作階段 001

- 日期：2026-07-17
- 本輪目標：導入 harness-engineering 工作流（/harness-init）
- 已完成：安裝 harness 範本；init.sh 設定為 pnpm（pnpm test，17 tests 通過）；寫入 iOS 路線 6 項功能（含 native-001 config plugin 硬前置）
- 執行過的驗證：./init.sh
- 已擷取證據：見下方工作階段記錄與 git commit
- 提交記錄：chore: 導入 harness-engineering 工作流（本輪 commit）
- 已知風險或未解決問題：fmt/RCTBridge 修復未進 git，只在本機 ios/；ios-004/005 依賴 Apple Developer 帳號（未申請）
- 下一步最佳動作：開始 ios-001（先照 SPARKWEAR/docs/ios-testing/README.md 確認本機環境）
