# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKSHAPE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-07-17 為 17 tests passed）
- 目前最高優先級未完成功能：ios-004 EAS iOS 雲端建置成功（blocked：需先申請 Apple Developer Program 帳號）
- 目前 blocker：ios-004/ios-005 需要 Apple Developer Program（$99/年），尚未申請
- 背景：ios-001～ios-003、native-001 皆已 passing；fmt/RCTBridge 兩個原生修復已轉成 config plugin（plugins/withFmtConstevalFix.js、plugins/withRemoveRCTBridgeSourceURL.js），expo prebuild --clean 不再需要手動改 ios/

## 工作階段日誌

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
