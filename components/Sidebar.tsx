"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconAgent,
  IconChart,
  IconClock,
  IconGrid,
  IconPlug,
  IconSpark,
} from "./icons";
import { href, stripBase } from "@/lib/paths";

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  isNew?: boolean;
};

export default function Sidebar({
  counts,
  generatedAt,
}: {
  counts: { skills: number; agents: number; cron: number; channels: number };
  generatedAt: string;
}) {
  const raw = usePathname() || "/";
  const path = stripBase(raw);

  const items: NavItem[] = [
    { path: "/", label: "概览", icon: <IconGrid /> },
    { path: "/agents", label: "Agent", icon: <IconAgent />, badge: counts.agents },
    { path: "/skills", label: "技能", icon: <IconSpark />, badge: counts.skills },
    { path: "/cron", label: "定时任务", icon: <IconClock />, badge: counts.cron },
    { path: "/usage", label: "用量", icon: <IconChart /> },
    { path: "/channels", label: "通道", icon: <IconPlug />, badge: counts.channels, isNew: true },
  ];

  const isActive = (target: string) => {
    if (target === "/") return path === "/";
    return path === target || path.startsWith(`${target}/`);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">H</div>
        <div className="brand-name">Hermes Hub</div>
        <div className="brand-tag">local</div>
      </div>

      <div className="side-profile">
        <div className="avatar">羽</div>
        <div className="side-profile-text">
          <span className="side-profile-name">default 配置</span>
          <span className="side-profile-sub">个人 Hermes · 运行中</span>
        </div>
      </div>

      <nav className="nav" aria-label="主导航">
        <div className="nav-label">工作区</div>
        {items.map((item) => (
          <Link
            key={item.path}
            href={href(item.path)}
            className="nav-item"
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.isNew ? (
              <span className="nav-new">New</span>
            ) : item.badge !== undefined ? (
              <span className="nav-badge">{item.badge}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="side-foot">
        <span>数据采集于 {generatedAt.replace("T", " ").slice(0, 16)}</span>
        <span>只读视图 · 不改动 ~/.hermes</span>
      </div>
    </aside>
  );
}