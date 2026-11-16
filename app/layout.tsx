import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { data } from "@/lib/content";
import { BASE } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Hermes Hub · 我的 Agent 与技能",
  description:
    "本机 Hermes 的只读控制台：技能库、Agent 名册、定时任务、会话用量与通道状态。",
  icons: {
    icon: [
      { url: `${BASE}/icon.svg`, type: "image/svg+xml" },
      { url: `${BASE}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: `${BASE}/apple-icon.png`, sizes: "180x180", type: "image/png" }],
    shortcut: [`${BASE}/icon-192.png`],
  },
  manifest: `${BASE}/site.webmanifest`,
};

export const viewport: Viewport = {
  themeColor: "#6c4cf1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const counts = {
    skills: data.stats.skills,
    agents: data.stats.agents,
    cron: data.stats.cron,
    channels: data.channels.filter((c) => c.status === "connected").length,
  };

  return (
    <html lang="zh-CN">
      <body>
        <div className="shell">
          <Sidebar counts={counts} generatedAt={data.generatedAt} />
          <main className="main">
            <div className="main-inner">{children}</div>
            <footer className="page-foot">
              <span>Hermes Hub · 只读视图</span>
              <span>数据采集于 {data.generatedAt.replace("T", " ").slice(0, 16)}</span>
              <span>不修改 ~/.hermes 中任何文件</span>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}