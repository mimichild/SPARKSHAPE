export interface MotivationParams {
  photoCount: number;
  sessionCount: number;      // 總共幾個不同日期有照片
  daysSinceFirst: number;    // 距第一次記錄幾天
  today: Date;
  hasUpdatedToday: boolean;  // 今天已更新照片＋數據
  streakDays: number;        // 連續幾天有記錄（含今天）
}

// ─── 尚未更新時：溫暖邀請語 ──────────────────────────────────────────────────
const INVITE_MESSAGES: string[] = [
  '今天還沒記錄喔，花一分鐘把現在的自己留下來吧！',
  '拍一張今天的你，給未來的自己留個驚喜！',
  '每天一拍，變化慢慢累積。今天也來記錄吧！',
  '你的身體每天都在努力，今天也給它一個紀念吧！',
  '還差一步就完成今天的記錄，現在去拍吧！',
  '今天還沒更新，趁現在留下這一刻的自己！',
  '一張照片，就是對自己最好的承諾。今天來拍吧！',
  '記錄不用完美，只要真實。今天也來留下自己吧！',
  '你還沒記錄今天喔！現在開始，今天的努力留存起來！',
  '只要今天也記錄，連續就不會中斷。加油！',
  '今天的身形值得被看見，趕快來拍一張吧！',
  '還沒記錄今天？現在正是時候，來留下這一刻！',
];

// ─── 今日已完成（一般） ────────────────────────────────────────────────────────
const COMPLETION_MESSAGES: string[] = [
  '今天的記錄完成了，你做到了！繼續保持吧！',
  '又是完成記錄的一天，未來的你會感謝今天的自己！',
  '今天也認真對待了自己，這份堅持很珍貴！',
  '打卡完成！每一次記錄都是給自己的一份禮物。',
  '今天的你已經很棒了，記錄完成，繼續前進！',
  '完成了！就算慢慢來，持續記錄就是最大的勝利！',
  '今天做到了，明天也一定可以。為自己喝采！',
  '記錄完成！你的故事，一天一天地寫下去。',
];

// ─── 里程碑：週 / 月 / 年 ─────────────────────────────────────────────────────
interface MilestoneMsg { days: number; text: string }

const STREAK_MILESTONES: MilestoneMsg[] = [
  { days: 7,   text: '連續一整週都完成記錄了！習慣正在成形，超棒！' },
  { days: 14,  text: '連續兩週的堅持！你正在建立真正屬於自己的習慣！' },
  { days: 21,  text: '連續三週！21 天養成習慣，你已經做到了！' },
  { days: 30,  text: '整整一個月每天記錄！這份自律，真的令人敬佩！' },
  { days: 60,  text: '兩個月不間斷！你對自己的承諾，說到做到！' },
  { days: 90,  text: '連續三個月！你是自己最忠實的見證者，繼續走下去！' },
  { days: 180, text: '半年的連續記錄！你已經成為真正改變自己的人！' },
  { days: 365, text: '整整一年！365 天的堅持是最了不起的人生成就，為你驕傲！' },
  { days: 730, text: '兩年！這份毅力超越了絕大多數人，繼續寫下屬於你的故事！' },
];

// ─── 主函式 ────────────────────────────────────────────────────────────────────

export function getMotivationalMessage(params: MotivationParams): string {
  const { today, hasUpdatedToday, streakDays } = params;

  if (!hasUpdatedToday) {
    // 以日期為種子，同一天同一條邀請語
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return INVITE_MESSAGES[seed % INVITE_MESSAGES.length];
  }

  // 已完成今日記錄 — 先檢查連續天數里程碑（精確命中才顯示）
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (streakDays === STREAK_MILESTONES[i].days) {
      return STREAK_MILESTONES[i].text;
    }
  }

  // 一般完成語（以日期為種子輪播）
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return COMPLETION_MESSAGES[seed % COMPLETION_MESSAGES.length];
}
