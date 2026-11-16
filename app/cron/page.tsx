import { crons, agents } from "@/lib/content";
import { href } from "@/lib/paths";
import Link from "next/link";

export const metadata = { title: "定时任务 · Hermes Hub" };

export default function CronPage() {
  const enabled = crons.filter((c) => c.enabled).length;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">定时任务</h1>
          <p className="page-sub">
            Hermes 自己会醒来的时刻：{enabled} 个启用 / 共 {crons.length} 个。
            这里是只读视图，启停与编辑走 <code>hermes cron</code>。
          </p>
        </div>
      </header>

      <div className="panel">
        {crons.map((c) => {
          const owner = agents.find((a) => a.crons.includes(c.id));
          return (
            <div className="row" key={c.id} style={{ alignItems: "flex-start" }}>
              <div className="row-main">
                <div className="row-title">
                  {c.name}
                  <span className={`status-tag ${c.enabled ? "on" : "off"}`} style={{ marginLeft: 8 }}>
                    {c.enabled ? "启用中" : "已暂停"}
                  </span>
                </div>
                <div className="row-sub" style={{ whiteSpace: "normal" }}>
                  {c.summary || "—"}
                </div>
                <div className="skill-meta" style={{ marginTop: 8 }}>
                  <span className="pill">{c.kind === "cron" ? "cron" : `${c.kind}`}</span>
                  <span className="pill">{c.display}</span>
                  <span className="pill">提示词 {c.promptChars} 字符</span>
                  {owner && (
                    <Link href={href(`/agents/${owner.id}/`)} className="pill accent">
                      {owner.name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h2 className="section-title">怎么读这些配置</h2>
      </div>
      <div className="panel panel-pad" style={{ fontSize: 13, color: "var(--ink-2)" }}>
        <p style={{ marginTop: 0 }}>
          <strong>cron</strong> 是定点执行（如每天 20:00），<strong>interval</strong> 是固定间隔（如每 40 分钟）。
          任务内容就是一段完整提示词——Hermes 到点后用同样的工具与记忆执行，产出发到指定通道或静默写入文件。
        </p>
        <p style={{ marginBottom: 0 }}>
          暂停的任务不会丢配置，改 <code>enabled</code> 即可恢复；提示词里有敏感数据（base token、表格 id）时，
          本站采集阶段已做脱敏，只展示摘要。
        </p>
      </div>
    </>
  );
}