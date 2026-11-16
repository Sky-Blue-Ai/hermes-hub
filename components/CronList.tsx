"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { href } from "@/lib/paths";

export type CronRow = {
  id: string;
  name: string;
  kind: string;
  expr: string;
  display: string;
  enabled: boolean;
  summary: string;
  promptChars: number;
  owner?: { id: string; name: string };
};

type Health = { ok: boolean; write?: boolean };

/** 写操作只在本地 API（tools/api.py，127.0.0.1:8091）在同一源上可用；
 *  GitHub Pages 上没有 /api/health，按钮会自动隐藏。 */
export default function CronList({ rows }: { rows: CronRow[] }) {
  const [live, setLive] = useState<Health | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [state, setState] = useState(rows);

  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setLive(j))
      .catch(() => setLive({ ok: false }));
  }, []);

  const act = useCallback(
    async (kind: "pause" | "resume" | "run" | "refresh", id?: string) => {
      setBusy(id ?? kind);
      setMsg("");
      try {
        const url = kind === "refresh" ? "/api/refresh" : `/api/cron/${kind}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(id ? { id } : {}),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || j.out || "失败");
        if (kind === "refresh") {
          setMsg("快照已重建，正在刷新页面…");
          setTimeout(() => location.reload(), 1200);
        } else {
          setState((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, enabled: kind === "pause" ? false : kind === "resume" ? true : r.enabled }
                : r,
            ),
          );
          setMsg(kind === "run" ? "已排入下一轮调度" : kind === "pause" ? "已暂停" : "已恢复");
        }
      } catch (e) {
        setMsg(`操作失败：${(e as Error).message}`);
      } finally {
        setBusy("");
      }
    },
    [],
  );

  const canWrite = live?.write === true;

  return (
    <>
      {canWrite && (
        <div className="panel panel-pad" style={{ marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <span className="pill ok">写操作已启用</span>
          <span className="section-note">本机 API 在线，可直接暂停/恢复/立即运行</span>
          <button
            className="chip"
            style={{ marginLeft: "auto" }}
            disabled={busy === "refresh"}
            onClick={() => act("refresh")}
          >
            {busy === "refresh" ? "重建中…" : "刷新快照并重建"}
          </button>
        </div>
      )}

      <div className="panel">
        {state.map((c) => (
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
                <span className="pill">{c.kind === "cron" ? "cron" : c.kind}</span>
                <span className="pill">{c.display}</span>
                <span className="pill">提示词 {c.promptChars} 字符</span>
                {c.owner && (
                  <Link href={href(`/agents/${c.owner.id}/`)} className="pill accent">
                    {c.owner.name}
                  </Link>
                )}
              </div>

              {canWrite && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    className="chip"
                    disabled={busy === c.id}
                    onClick={() => act(c.enabled ? "pause" : "resume", c.id)}
                  >
                    {c.enabled ? "暂停" : "恢复"}
                  </button>
                  <button className="chip" disabled={busy === c.id} onClick={() => act("run", c.id)}>
                    立即运行
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <p className="section-note" style={{ marginTop: 10 }}>
          {msg}
        </p>
      )}
    </>
  );
}