# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKSHAPE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-07-22 為 17 tests passed）
- 目前最高優先級未完成功能：無（feature_list.json 目前全部 passing）
- 目前 blocker：無
- 背景：Apple Developer Program 已生效（2026-07-20）；ios-001～ios-006、native-001 皆已 passing（含 TestFlight 實機驗證），EAS 雲端建置成功產出 .ipa，也驗證了兩個 config plugin（fmt/RCTBridge）在雲端環境確實有效；實機測試核心流程（相機拍照/相簿選圖/資料持久化）皆無問題；App icon 圓形外菱格紋殘留問題已修好並實機確認（同時解決 iOS 與 Android，因為兩邊共用同一張來源圖）；已設定 EAS Update（OTA）支援與 eas.json ascAppId（submit 可完全非互動執行）

## 工作階段日誌

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
