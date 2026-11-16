import Link from "next/link";
import { agents, crons, skills } from "@/lib/content";
import { href } from "@/lib/paths";
import { agentStyle } from "@/lib/style";
import { SkillGlyph } from "@/components/icons";

export default function AgentsPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Agent</h1>
          <p className="page-sub">
            一个 Hermes 实例，几副面孔。每个 Agent 是「一组技能 + 若干定时任务 + 一个通道/项目」的组合，
            点进去能看到它到底会什么、什么时候自己动手。
          </p>
        </div>
      </header>

      <div className="agent-grid">
        {agents.map((a) => {
          const list = a.skills.map((id) => skills.find((s) => s.id === id)).filter(Boolean);
          const cronList = a.crons.map((id) => crons.find((c) => c.id === id)).filter(Boolean);
          return (
            <Link key={a.id} href={href(`/agents/${a.id}/`)} className="agent-card">
              <div className="agent-avatar" style={agentStyle(a.color)}>
                {a.name.slice(0, 1)}
              </div>
              <div className="agent-main">
                <div className="agent-name">
                  {a.name}
                  <span className="dot" />
                </div>
                <div className="agent-role">{a.role}</div>
                <p className="agent-summary">{a.summary}</p>

                <div className="agent-foot" style={{ marginTop: 10 }}>
                  {list.slice(0, 3).map((s) => (
                    <span key={s!.id} className="pill">
                      {s!.title}
                    </span>
                  ))}
                  {list.length > 3 && <span className="pill">+{list.length - 3}</span>}
                </div>

                <div className="agent-foot">
                  <span className="pill accent">{a.stats.skills} 技能</span>
                  {cronList.length > 0 && (
                    <span className="pill ok">
                      {cronList.map((c) => c!.display).join(" · ")}
                    </span>
                  )}
                  {a.project && <span className="pill">{a.project}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="section-head">
        <h2 className="section-title">技能全部落地在这里</h2>
        <span className="section-note">Agent 只是视图，能力都在技能里</span>
      </div>
      <div className="panel panel-pad" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {skills.slice(0, 24).map((s) => (
          <Link key={s.id} href={href(`/skills/${s.id}/`)} title={s.desc}>
            <SkillGlyph id={s.id} label={s.categoryLabel} size={34} />
          </Link>
        ))}
        <Link className="pill" href={href("/skills/")} style={{ alignSelf: "center" }}>
          全部 {skills.length} 个技能 →
        </Link>
      </div>
    </>
  );
}