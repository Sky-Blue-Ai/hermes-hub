import type { CSSProperties } from "react";

const AGENT_COLORS: Record<string, [string, string]> = {
  violet: ["#f1edfe", "#5b3fd6"],
  amber: ["#fef3e2", "#b54708"],
  blue: ["#e8f2ff", "#1a6fe0"],
  green: ["#e7f8ef", "#0f7a4e"],
};

/** Agent 头像配色：server 与 client 组件共用，所以放在普通模块里 */
export function agentStyle(color: string): CSSProperties {
  const [bg, fg] = AGENT_COLORS[color] ?? AGENT_COLORS.violet;
  return { background: bg, color: fg };
}