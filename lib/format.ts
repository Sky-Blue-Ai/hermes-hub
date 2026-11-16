const PLATFORM_LABEL: Record<string, string> = {
  feishu: "飞书",
  qqbot: "QQ",
  telegram: "Telegram",
  discord: "Discord",
  cli: "CLI",
  cron: "定时任务",
  subagent: "子代理",
};

export function platformLabel(p: string) {
  return PLATFORM_LABEL[p] ?? p;
}

/** "2 小时前" / "昨天 20:01" / "11-14 09:12" */
export function relTime(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day === 1) return "昨天";
  if (day < 30) return `${day} 天前`;
  return iso.slice(0, 10);
}

export function shortDate(iso: string) {
  return iso.slice(5, 10).replace("-", "/");
}

export function money(n: number) {
  if (!n) return "$0";
  return `$${n.toFixed(2)}`;
}