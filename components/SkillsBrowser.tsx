"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { href } from "@/lib/paths";
import { SOURCE_LABEL, type SkillCardModel } from "@/lib/content";
import { ArtPanel, IconFire, IconPlus, IconSearch, SkillGlyph } from "./icons";
import { agentStyle } from "@/lib/style";

type Pack = {
  id: string;
  name: string;
  role: string;
  summary: string;
  skills: string[];
  skillTitles: string[];
  status: string;
  color: string;
};

const TABS = [
  { id: "skills", label: "技能" },
  { id: "packs", label: "技能包" },
  { id: "installed", label: "已安装" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SkillsBrowser({
  cards,
  categories,
  featured,
  packs,
  installedCount,
}: {
  cards: SkillCardModel[];
  categories: { id: string; label: string; count: number }[];
  featured: SkillCardModel[];
  packs: Pack[];
  installedCount: number;
}) {
  const [tab, setTab] = useState<TabId>("skills");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hit = cards.filter((c) => {
      if (cat !== "全部" && c.category !== cat) return false;
      if (!needle) return true;
      const hay = [c.title, c.desc, c.id, c.category, ...c.tags].join(" ").toLowerCase();
      return hay.includes(needle);
    });
    if (!needle) return hit;
    // 标题命中优先，其次才是描述/标签命中（搜「历史」时本意是历史站，不是描述里提到历史资料）
    const rank = (c: SkillCardModel) =>
      (c.title.toLowerCase().includes(needle) ? 0 : 1) +
      (c.tags.join(" ").toLowerCase().includes(needle) ? 0 : 0.5);
    return [...hit].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, "zh"));
  }, [cards, q, cat]);

  const showFeatured = tab === "skills" && !q.trim() && cat === "全部";

  return (
    <>
      <div className="tabs" role="tablist" aria-label="技能视图">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            data-active={tab === t.id}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "installed" ? <span className="tab-count">{installedCount}</span> : null}
            {t.id === "packs" ? <span className="tab-count">{packs.length}</span> : null}
          </button>
        ))}
      </div>

      {tab !== "packs" && (
        <>
          <div className="searchbar">
            <IconSearch size={17} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索技能：飞书、历史、生图、调试……"
              aria-label="搜索技能"
            />
            <span className="kbd">/</span>
          </div>

          {showFeatured && (
            <>
              <div className="section-head">
                <h2 className="section-title">精选技能</h2>
                <span className="section-note">本机正在用的高频能力</span>
                <Link className="more" href={href("/skills/")}>
                  全部 {cards.length} 个 →
                </Link>
              </div>
              <div className="featured">
                {featured.map((f) => (
                  <Link key={f.id} href={href(`/skills/${f.id}/`)} className="feat-card">
                    <ArtPanel id={f.id} label={f.category} />
                    <div className="feat-body">
                      <SkillGlyph id={f.id} label={f.category} size={36} />
                      <div className="feat-text">
                        <div className="feat-title">{f.title}</div>
                        <div className="feat-sub">{f.desc}</div>
                      </div>
                      <span className="round-btn" aria-hidden>
                        <IconPlus />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="chips" role="group" aria-label="分类筛选">
            <button
              className="chip"
              data-active={cat === "全部"}
              onClick={() => setCat("全部")}
            >
              全部<span className="chip-count">{cards.length}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className="chip"
                data-active={cat === c.label}
                onClick={() => setCat(c.label)}
              >
                {c.label}
                <span className="chip-count">{c.count}</span>
              </button>
            ))}
          </div>

          <div className="section-head">
            <h2 className="section-title">
              {cat === "全部" ? (tab === "installed" ? "已安装技能" : "全部技能") : cat}
            </h2>
            <span className="section-note">
              {filtered.length} / {cards.length} 个
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">没有匹配的技能，换个词试试（比如「飞书」「历史」「出图」）。</div>
          ) : (
            <div className="skill-grid">
              {filtered.map((c) => (
                <Link key={c.id} href={href(`/skills/${c.id}/`)} className="skill-card">
                  <SkillGlyph id={c.id} label={c.category} />
                  <div className="skill-main">
                    <div className="skill-title">{c.title}</div>
                    <p className="skill-desc">{c.desc}</p>
                    <div className="skill-meta">
                      <span className="pill">{SOURCE_LABEL[c.source] ?? c.source}</span>
                      {c.featured && (
                        <span className="pill hot">
                          <IconFire /> 常用
                        </span>
                      )}
                      <span className="pill">{c.categoryLabel}</span>
                      {c.tags.slice(0, 1).map((t) => (
                        <span key={t} className="pill">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="skill-open" aria-hidden>
                    <IconPlus />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "packs" && (
        <>
          <div className="section-head">
            <h2 className="section-title">技能包</h2>
            <span className="section-note">按角色把技能捆在一起用</span>
          </div>
          <div className="agent-grid">
            {packs.map((p) => (
              <Link key={p.id} href={href(`/agents/${p.id}/`)} className="agent-card">
                <div className="agent-avatar" style={agentStyle(p.color)}>
                  {p.name.slice(0, 1)}
                </div>
                <div className="agent-main">
                  <div className="agent-name">{p.name}</div>
                  <div className="agent-role">{p.role}</div>
                  <p className="agent-summary">{p.summary}</p>
                  <div className="agent-foot">
                    {p.skillTitles.slice(0, 4).map((t) => (
                      <span key={t} className="pill">
                        {t}
                      </span>
                    ))}
                    {p.skillTitles.length > 4 && (
                      <span className="pill">+{p.skillTitles.length - 4}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
