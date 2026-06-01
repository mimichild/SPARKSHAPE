export interface MotivationParams {
  photoCount: number;       // 總共幾張照片（正面＋側面各算一張）
  sessionCount: number;     // 拍攝次數（一次含正面+側面）
  daysSinceFirst: number;   // 距第一次記錄幾天
  today: Date;
}

// ─── 30 條鼓勵語 ──────────────────────────────────────────────────────────
// 前8條為里程碑語（依天數觸發），後22條為每日輪播
// 有 {n} 佔位符的會被動態替換

const MILESTONE_MESSAGES: Array<{ minDays: number; text: string }> = [
  { minDays: 0,   text: '初始體態記錄已啟程，每一步都是改變的開始！' },
  { minDays: 2,   text: '連續記錄兩天了，好的習慣正在悄悄萌芽！' },
  { minDays: 6,   text: '持續記錄一週了，給自己拍拍手！' },
  { minDays: 13,  text: '兩週的堅持，身體的變化正在悄悄發生中！' },
  { minDays: 29,  text: '記錄滿一個月了，你是真正行動派的人！' },
  { minDays: 59,  text: '兩個月的堅持，你的自律令人敬佩！' },
  { minDays: 89,  text: '三個月的記錄，你已經成為自己最忠實的見證者！' },
  { minDays: 179, text: '半年的堅持，你正在悄悄蛻變，繼續走下去！' },
];

const SESSION_MILESTONE_MESSAGES: Array<{ minSessions: number; text: string }> = [
  { minSessions: 5,  text: '已完成 {n} 次完整記錄，每一張照片都是你的勳章！' },
  { minSessions: 10, text: '您已累積了 {n} 組正面與側面對比照片，繼續加油！' },
  { minSessions: 21, text: '您已累積了 {n} 組正面與側面對比照片，好棒！' },
  { minSessions: 50, text: '{n} 次完整記錄！你的毅力真的太厲害了！' },
  { minSessions: 100, text: '100 次！這已經是一項了不起的人生成就！' },
];

const DAILY_MESSAGES: string[] = [
  '體重計無法定義你的美，鏡子裡自信的線條才是你的獨特！',
  '今天也好好記錄了自己，你正在往亮眼的路上前進！',
  '穿上最喜歡的那件衣服，今天也帶著自信出門吧！',
  '不管今天的身形如何，記錄本身就是最勇敢的行為！',
  '慢慢來，但不要停下來。你的進步有目共睹！',
  '每一張照片都是你對自己的承諾，繼續加油！',
  '改變需要時間，而你正在給自己這個時間，了不起！',
  '你不是在追求完美，你是在成為最好的自己！',
  '今天的記錄，是明天回頭看時最美的風景！',
  '身材可以改變，但自信要從今天開始建立！',
  '你的努力，身體都記得。繼續前進吧！',
  '不必跟別人比，只要比昨天的自己更好就夠了！',
  '每一次記錄，都是對自己的一份愛與關注！',
  '你選擇了記錄，就是選擇了改變的可能！',
  '今天完成了記錄，你比你想像的更有毅力！',
  '美麗沒有標準答案，但你的堅持就是最好的答案！',
  '每個清晨都是新的開始，今天的你比昨天更靠近目標！',
  '你的身體每天都在努力配合你，請也好好欣賞它！',
  '無論快慢，只要在路上，就是勝利！',
  '今天記錄了自己，就是在對未來的自己說：我沒有放棄！',
  '你值得被認真對待，而記錄就是最好的方式！',
  '變化可能不是每天都看得見，但每天都在發生！',
];

// ─── 主函式 ───────────────────────────────────────────────────────────────

export function getMotivationalMessage(params: MotivationParams): string {
  const { sessionCount, daysSinceFirst, today } = params;

  // 1. 檢查里程碑（依天數，由高到低）
  for (let i = MILESTONE_MESSAGES.length - 1; i >= 0; i--) {
    if (daysSinceFirst >= MILESTONE_MESSAGES[i].minDays) {
      // 只在剛達到里程碑的那幾天顯示，之後換成 session 或 daily
      const overshot = daysSinceFirst - MILESTONE_MESSAGES[i].minDays;
      if (overshot <= 2) {
        return MILESTONE_MESSAGES[i].text;
      }
      break;
    }
  }

  // 2. 檢查拍攝次數里程碑
  for (let i = SESSION_MILESTONE_MESSAGES.length - 1; i >= 0; i--) {
    const sm = SESSION_MILESTONE_MESSAGES[i];
    if (sessionCount >= sm.minSessions) {
      const overshot = sessionCount - sm.minSessions;
      if (overshot <= 1) {
        return sm.text.replace('{n}', String(sessionCount));
      }
      break;
    }
  }

  // 3. 每日輪播（以日期為種子確保同一天顯示同一條）
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idx = seed % DAILY_MESSAGES.length;
  return DAILY_MESSAGES[idx];
}
