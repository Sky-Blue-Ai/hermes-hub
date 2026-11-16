import { data } from "@/lib/content";

export const metadata = { title: "通道 · Hermes Hub" };

export default function ChannelsPage() {
  const { channels, system } = data;
  const connected = channels.filter((c) => c.status === "connected");

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">通道</h1>
          <p className="page-sub">
            Hermes 从哪些入口接到你：{connected.length} 个通道在线。
            数据来自 <code>hermes status</code> 的 Platforms 行，不是配置文件里的示例。
          </p>
        </div>
      </header>

      <div className="panel">
        {channels.map((c) => (
          <div className="row" key={c.id}>
            <div
              className="agent-avatar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                fontSize: 14,
                background: c.status === "connected" ? "var(--green-soft)" : "#f3f4f7",
                color: c.status === "connected" ? "#067647" : "var(--ink-3)",
              }}
            >
              {c.name.slice(0, 1)}
            </div>
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

      <div className="section-head">
        <h2 className="section-title">网关与运行时</h2>
        <span className="section-note">hermes status</span>
      </div>
      <div className="panel panel-pad">
        <dl className="meta-list" style={{ fontSize: 12.5, gap: "10px 16px" }}>
          <dt>Gateway</dt>
          <dd>{system.gateway || "—"}</dd>
          <dt>平台</dt>
          <dd>{system.platforms || "—"}</dd>
          <dt>模型</dt>
          <dd>{system.model || "—"}</dd>
          <dt>Provider</dt>
          <dd>{system.provider || "—"}</dd>
          <dt>任务</dt>
          <dd>{system.jobs || "—"}</dd>
        </dl>
      </div>

      <p className="section-note" style={{ marginTop: 22 }}>
        通道的接入/断开走 <code>hermes gateway setup</code>；本页只做状态展示，不提供操作入口。
      </p>
    </>
  );
}