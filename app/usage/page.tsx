import { data, fmtNum } from "@/lib/content";
import { money, platformLabel, shortDate } from "@/lib/format";

export const metadata = { title: "用量 · Hermes Hub" };

export default function UsagePage() {
  const { stats, usage } = data;
  const days = usage.days;
  const maxSessions = Math.max(1, ...days.map((d) => d.sessions));
  const maxModel = Math.max(1, ...usage.models.map((m) => m.sessions));
  const maxTool = Math.max(1, ...usage.topTools.map((t) => t.calls));
  const totalPlatform = Math.max(1, ...usage.platforms.map((p) => p.sessions));

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">用量</h1>
          <p className="page-sub">
            来自 state.db 的真实会话统计：{stats.sessions} 个会话、{fmtNum(stats.messages)} 条消息、
            {fmtNum(stats.toolCalls)} 次工具调用。费用按会话记录的估算值汇总。
          </p>
        </div>
      </header>

      <section className="stat-row">
        <div className="stat">
          <div className="stat-label">输入 token</div>
          <div className="stat-value">{fmtNum(stats.tokensIn)}</div>
          <div className="stat-foot">全部会话累计</div>
        </div>
        <div className="stat">
          <div className="stat-label">输出 token</div>
          <div className="stat-value">{fmtNum(stats.tokensOut)}</div>
          <div className="stat-foot">含思考与工具参数</div>
        </div>
        <div className="stat">
          <div className="stat-label">估算费用</div>
          <div className="stat-value">{money(stats.costUsd)}</div>
          <div className="stat-foot">Token Plan 内多为 0</div>
        </div>
        <div className="stat">
          <div className="stat-label">工具调用</div>
          <div className="stat-value">{fmtNum(stats.toolCalls)}</div>
          <div className="stat-foot">平均每会话 {Math.round(stats.toolCalls / Math.max(1, stats.sessions))} 次</div>
        </div>
      </section>

      <div className="section-head">
        <h2 className="section-title">近 45 天活动</h2>
        <span className="section-note">按会话数，柱高归一化</span>
      </div>
      <div className="panel panel-pad">
        <div className="bars">
          {days.map((d) => (
            <div
              key={d.date}
              className="bar"
              title={`${d.date} · ${d.sessions} 个会话 · ${d.messages} 条消息`}
              style={{ height: `${Math.max(4, (d.sessions / maxSessions) * 100)}%` }}
            />
          ))}
        </div>
        <div className="bar-labels">
          {days.map((d, i) => (
            <div className="bar-label" key={d.date}>
              {i % Math.max(1, Math.ceil(days.length / 8)) === 0 ? shortDate(d.date) : "\u00a0"}
            </div>
          ))}
        </div>
      </div>

      <div className="agent-grid" style={{ marginTop: 26 }}>
        <section>
          <div className="section-head">
            <h2 className="section-title">模型</h2>
            <span className="section-note">{usage.models.length} 个</span>
          </div>
          <div className="panel panel-pad">
            {usage.models.map((m) => (
              <div key={m.model} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{m.model}</span>
                  <span className="row-num">{m.sessions} 会话</span>
                </div>
                <div className="meter">
                  <span style={{ width: `${(m.sessions / maxModel) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2 className="section-title">入口</h2>
            <span className="section-note">会话来自哪个平台</span>
          </div>
          <div className="panel panel-pad">
            {usage.platforms.map((p) => (
              <div key={p.platform} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                  <span style={{ flex: 1 }}>{platformLabel(p.platform)}</span>
                  <span className="row-num">{p.sessions} 会话</span>
                </div>
                <div className="meter">
                  <span style={{ width: `${(p.sessions / totalPlatform) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="agent-grid" style={{ marginTop: 26 }}>
        <section>
          <div className="section-head">
            <h2 className="section-title">最重的会话</h2>
            <span className="section-note">按消息数</span>
          </div>
          <div className="panel">
            {usage.topSessions.map((s, i) => (
              <div className="row" key={`${s.title}-${i}`}>
                <span className="row-num" style={{ width: 18 }}>
                  {i + 1}
                </span>
                <div className="row-main">
                  <div className="row-title">{s.title}</div>
                  <div className="row-sub">
                    {platformLabel(s.platform)} · {s.messages} 条消息
                  </div>
                </div>
                <span className="row-num">{s.cost > 0 ? money(s.cost) : "—"}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2 className="section-title">最常用工具</h2>
            <span className="section-note">按调用次数</span>
          </div>
          <div className="panel panel-pad">
            {usage.topTools.length === 0 && (
              <div className="empty" style={{ border: 0 }}>
                这台机器的会话没有记录工具名
              </div>
            )}
            {usage.topTools.map((t) => (
              <div key={t.tool} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                  <span style={{ flex: 1, fontFamily: "var(--mono)" }}>{t.tool}</span>
                  <span className="row-num">{t.calls}</span>
                </div>
                <div className="meter">
                  <span style={{ width: `${(t.calls / maxTool) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}