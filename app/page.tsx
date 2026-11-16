import Link from "next/link";
import { data, fmtNum } from "@/lib/content";
import { href } from "@/lib/paths";
import { agentStyle } from "@/lib/style";
import { money, platformLabel, relTime } from "@/lib/format";
import { IconAgent, IconArrow, IconChart, IconClock, IconSpark } from "@/components/icons";

export default function OverviewPage() {
  const { stats, agents, channels, crons, projects, recent, system } = data;
  const connected = channels.filter((c) => c.status === "connected");
  const activeCrons = crons.filter((c) => c.enabled);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">概览</h1>
          <p className="page-sub">
            这台机器上 Hermes 的全部家当：能力（技能）、角色（Agent）、自动化（定时任务）和真实产生的会话。
            页面只读，数据来自 ~/.hermes 的采集快照。
          </p>
        </div>
      </header>

      <section className="stat-row">
        <div className="stat">
          <div className="stat-label">
            <IconSpark size={13} /> 技能
          </div>
          <div className="stat-value">{stats.skills}</div>
          <div className="stat-foot">
            本地 {stats.localSkills} · 内置 {stats.builtinSkills}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <IconAgent size={13} /> 角色
          </div>
          <div className="stat-value">{stats.agents}</div>
          <div className="stat-foot">1 个 Hermes 实例的 {stats.agents} 种分工</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <IconClock size={13} /> 定时任务
          </div>
          <div className="stat-value">
            {stats.cronEnabled}
            <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 500 }}>
              {" "}
              / {stats.cron}
            </span>
          </div>
          <div className="stat-foot">{activeCrons.map((c) => c.name).join("、") || "暂无启用"}</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            <IconChart size={13} /> 会话
          </div>
          <div className="stat-value">{stats.sessions}</div>
          <div className="stat-foot">
            {fmtNum(stats.messages)} 条消息 · {money(stats.costUsd)}
          </div>
        </div>
      </section>

      <div className="section-head">
        <h2 className="section-title">角色分工</h2>
        <span className="section-note">同一个 Hermes，不同角色</span>
        <Link className="more" href={href("/agents/")}>
          全部 <IconArrow size={12} />
        </Link>
      </div>
      <div className="agent-grid">
        {agents.map((a) => {
          const cronNames = a.crons
            .map((id) => crons.find((c) => c.id === id)?.name)
            .filter(Boolean);
          return (
            <Link key={a.id} href={href(`/agents/${a.id}/`)} className="agent-card">
              <div className="agent-avatar" style={agentStyle(a.color)}>
                {a.name.slice(0, 1)}
              </div>
              <div className="agent-main">
                <div className="agent-name">
                  {a.name}
                  <span className="dot" title="可用" />
                </div>
                <div className="agent-role">{a.role}</div>
                <p className="agent-summary">{a.summary}</p>
                <div className="agent-foot">
                  <span className="pill accent">{a.stats.skills} 个技能</span>
                  {a.stats.crons > 0 && <span className="pill ok">{a.stats.crons} 个自动化</span>}
                  {a.channel && <span className="pill">{a.channel === "feishu" ? "飞书通道" : a.channel}</span>}
                  {cronNames.slice(0, 1).map((n) => (
                    <span key={n} className="pill">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="section-head">
        <h2 className="section-title">最近活动</h2>
        <span className="section-note">按最后活动时间排序</span>
        <Link className="more" href={href("/usage/")}>
          用量详情 <IconArrow size={12} />
        </Link>
      </div>
      <div className="panel">
        {recent.slice(0, 7).map((r, i) => (
          <div className="row" key={`${r.title}-${i}`}>
            <span className="pill">{platformLabel(r.platform)}</span>
            <div className="row-main">
              <div className="row-title">{r.title}</div>
              <div className="row-sub">
                {r.messages} 条消息{r.cost > 0 ? ` · ${money(r.cost)}` : ""}
              </div>
            </div>
            <span className="row-num">{relTime(r.when)}</span>
          </div>
        ))}
      </div>

      <div className="agent-grid" style={{ marginTop: 26 }}>
        <section>
          <div className="section-head">
            <h2 className="section-title">通道</h2>
            <span className="section-note">{connected.length} 个在线</span>
            <Link className="more" href={href("/channels/")}>
              详情 <IconArrow size={12} />
            </Link>
          </div>
          <div className="panel">
            {channels.map((c) => (
              <div className="row" key={c.id}>
                <div className="row-main">
                  <div className="row-title">{c.name}</div>
                  <div className="row-sub">{c.detail}</div>
                </div>
                <span className={`status-tag ${c.status === "connected" ? "on" : "off"}`}>
                  {c.status === "connected" ? "在线" : "未接入"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2 className="section-title">运行环境</h2>
            <span className="section-note">hermes status 实时读数</span>
          </div>
          <div className="panel panel-pad">
            <dl className="meta-list" style={{ fontSize: 12.5, gap: "10px 14px" }}>
              <dt>模型</dt>
              <dd>{system.model || "—"}</dd>
              <dt>Provider</dt>
              <dd>{system.provider || "—"}</dd>
              <dt>Gateway</dt>
              <dd>{system.gateway || "—"}</dd>
              <dt>平台</dt>
              <dd>{system.platforms || "—"}</dd>
              <dt>任务</dt>
              <dd>{system.jobs || "—"}</dd>
              <dt>工具调用</dt>
              <dd>{stats.toolCalls} 次</dd>
            </dl>
          </div>
        </section>
      </div>

      <div className="section-head">
        <h2 className="section-title">在做的项目</h2>
        <span className="section-note">/root/work 下的 git 仓库</span>
      </div>
      <div className="panel">
        {projects.map((p) => (
          <div className="row" key={p.id}>
            <div className="row-main">
              <div className="row-title">{p.name}</div>
              <div className="row-sub">{p.desc || p.subject}</div>
            </div>
            <span className="pill">{p.branch}</span>
            <span className="row-num">{p.lastCommit}</span>
          </div>
        ))}
      </div>
    </>
  );
}