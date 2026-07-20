# 進度日誌

<!-- 寫法與完整範例見 docs/harness/PLAYBOOK.md §5。
     規則：新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面），編號遞增。
     「目前已驗證狀態」每次收尾都要更新，永遠反映最新事實。 -->

## 目前已驗證狀態

- 儲存庫根目錄：/Users/mimi/Documents/SPARKSHAPE
- 標準啟動路徑：`RUN_START_COMMAND=1 ./init.sh`（實際指令見 init.sh 的 START_CMD）
- 標準驗證路徑：./init.sh（pnpm install + pnpm test；2026-07-17 為 17 tests passed）
- 目前最高優先級未完成功能：ios-003 模擬器驗證 ZIP 匯出/匯入
- 目前 blocker：無
- 背景：ios-001、ios-002 已 passing（模擬器啟動、身型照片新增+持久化皆驗證通過）；fmt/RCTBridge 原生修復目前還只在被 gitignore 的本機 ios/（勿跑 expo prebuild --clean，會清掉）；EAS 前必須完成 native-001 config plugin（SPARKPLATE 已有現成寫法可參考複製，見 SPARKPLATE/plugins/withRemoveRCTBridgeSourceURL.js，但 SPARKSHAPE 還多一個 fmt Podfile post_install 修復要處理）

## 工作階段日誌

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
