import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// ── AdMob ────────────────────────────────────────────────────────
// iOS 用正式廣告單元 ID；Android 一律視為 Pro（AdBanner 不會渲染，見
// useIsPro.ts），維持 Google 測試 ID 即可，不需要申請真的 Android 版位。
export const BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-8914492142878610/3627858585',
  android: TestIds.BANNER,
  default: TestIds.BANNER,
}) ?? TestIds.BANNER;

// ── RevenueCat ───────────────────────────────────────────────────
// 申請好 RevenueCat 帳號、建立好 App 之後，把下面這個 Public API Key 換成
// 專案設定裡拿到的正式金鑰（iOS 用 App Store 專案的 key；Android 目前不開放
// 訂閱購買，這個 key 留空字串）。
export const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_kpPQYYlfxadsVyGttcAgdWNOtfo',
  android: '', // Android 目前不開放訂閱購買（見 monetization_spec_5_apps 記憶），留空即可
  default: '',
}) ?? '';

// Pro 版對應的 RevenueCat Entitlement 識別碼（在 RevenueCat 後台設定 Entitlement 時要用同一個名字）
export const PRO_ENTITLEMENT_ID = 'pro';

// ── 訂閱法規連結（Apple Guideline 3.1.2(c) 要求 App 內購買畫面要有可點擊的
// 服務條款與隱私權政策連結）──────────────────────────────────────────
export const PRIVACY_POLICY_URL = 'https://kyomistudio.github.io/privacy.html';
// 使用 Apple 標準 EULA（沒有自訂服務條款），要跟 App Store Connect「App 描述」
// 欄位裡附的連結完全一致（已用 curl 驗證這個 URL 回應 200）。
export const TERMS_OF_USE_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
