import Link from "next/link";
import { notFound } from "next/navigation";
import { agents, crons, projects, skills } from "@/lib/content";
import { agentStyle } from "@/lib/style";
import { href } from "@/lib/paths";
import { IconBack, SkillGlyph } from "@/components/icons";

export function generateStaticParams() {
  return agents.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  return { title: agent ? `${agent.name} · Hermes Hub` : "Agent · Hermes Hub" };
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();

  const agentSkills = agent.skills.map((sid) => skills.find((s) => s.id === sid)).filter(Boolean);
  const agentCrons = agent.crons.map((cid) => crons.find((c) => c.id === cid)).filter(Boolean);
  const project = projects.find((p) => p.id === agent.project);

  return (
    <>
      <nav className="crumbs">
        <Link href={href("/agents/")}>
          <IconBack size={12} /> Agent
        </Link>
        <span>/</span>
        <span style={{ color: "var(--ink-2)" }}>{agent.name}</span>
      </nav>

      <header className="detail-head">
        <div className="agent-avatar" style={{ ...agentStyle(agent.color), width: 54, height: 54 }}>
          {agent.name.slice(0, 1)}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 className="detail-title">
            {agent.name}
            <span className="pill ok">可用</span>
          </h1>
          <p className="detail-desc">{agent.summary}</p>
          <div className="detail-tags">
            <span className="pill accent">{agent.stats.skills} 个技能</span>
            {agent.stats.crons > 0 && <span className="pill ok">{agent.stats.crons} 个自动化</span>}
            {agent.channel && <span className="pill">通道：{agent.channel}</span>}
            {project && <span className="pill">项目：{project.name}</span>}
          </div>
        </div>
      </header>

      <div className="section-head">
        <h2 className="section-title">能力栈</h2>
        <span className="section-note">{agent.role}</span>
      </div>
      <div className="skill-grid">
        {agentSkills.map((s) => (
          <Link key={s!.id} href={href(`/skills/${s!.id}/`)} className="skill-card">
            <SkillGlyph id={s!.id} label={s!.categoryLabel} />
            <div className="skill-main">
              <div className="skill-title">{s!.title}</div>
              <p className="skill-desc">{s!.desc}</p>
              <div className="skill-meta">
                <span className="pill">{s!.categoryLabel}</span>
                <span className="pill">{s!.chars} 字符</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {agentCrons.length > 0 && (
        <>
          <div className="section-head">
            <h2 className="section-title">自己动手的部分</h2>
            <span className="section-note">定时任务（只读，启停去 hermes cron）</span>
          </div>
          <div className="panel">
            {agentCrons.map((c) => (
              <div className="row" key={c!.id}>
                <div className="row-main">
                  <div className="row-title">{c!.name}</div>
                  <div className="row-sub">
                    {c!.display} · {c!.summary || "—"}
                  </div>
                </div>
                <span className={`status-tag ${c!.enabled ? "on" : "off"}`}>
                  {c!.enabled ? "启用中" : "已暂停"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {project && (
        <>
          <div className="section-head">
            <h2 className="section-title">在维护的项目</h2>
            <span className="section-note">/root/work/{project.name}</span>
          </div>
          <div className="panel panel-pad">
            <div className="row-title">{project.name}</div>
            <p className="row-sub" style={{ whiteSpace: "normal", marginTop: 4 }}>
              {project.desc || project.subject}
            </p>
            <div className="skill-meta" style={{ marginTop: 10 }}>
              <span className="pill">{project.branch}</span>
              <span className="pill">最后提交 {project.lastCommit}</span>
              <span className="pill">{project.subject}</span>
            </div>
          </div>
        </>
      )}

      <p className="section-note" style={{ marginTop: 26 }}>
        Agent 是展示层的人为分组，写在 content/agents.json 里；技能与会话数据都来自本机采集，没有虚构。
      </p>
    </>
  );
}