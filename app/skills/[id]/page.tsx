import Link from "next/link";
import { notFound } from "next/navigation";
import CopyCommand from "@/components/CopyCommand";
import { IconBack, SkillGlyph } from "@/components/icons";
import { skillById, skills, relatedSkills, SOURCE_LABEL } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { href } from "@/lib/paths";

export function generateStaticParams() {
  return skills.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = skillById.get(id);
  return { title: skill ? `${skill.title} · Hermes Hub` : "技能 · Hermes Hub" };
}

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = skillById.get(id);
  if (!skill) notFound();

  const html = renderMarkdown(skill.body);
  const related = relatedSkills(skill, 4);

  return (
    <>
      <nav className="crumbs">
        <Link href={href("/skills/")}>
          <IconBack size={12} /> 技能
        </Link>
        <span>/</span>
        <span>{skill.categoryLabel}</span>
        <span>/</span>
        <span style={{ color: "var(--ink-2)" }}>{skill.title}</span>
      </nav>

      <header className="detail-head">
        <SkillGlyph id={skill.id} label={skill.categoryLabel} size={54} />
        <div style={{ minWidth: 0 }}>
          <h1 className="detail-title">
            {skill.title}
            <span className="pill">{skill.id}</span>
            {skill.featured && <span className="pill hot">常用</span>}
          </h1>
          <p className="detail-desc">{skill.desc}</p>
          <div className="detail-tags">
            <span className="pill accent">{skill.categoryLabel}</span>
            <span className="pill">{SOURCE_LABEL[skill.source] ?? skill.source}</span>
            <span className="pill">{skill.chars} 字符</span>
            {skill.tags.map((t) => (
              <span className="pill" key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="detail-layout">
        <article className="md" dangerouslySetInnerHTML={{ __html: html }} />

        <aside className="meta-card">
          <div className="meta-title">技能信息</div>
          <dl className="meta-list">
            <dt>id</dt>
            <dd>{skill.id}</dd>
            <dt>分类</dt>
            <dd>{skill.categoryLabel}</dd>
            <dt>来源</dt>
            <dd>{SOURCE_LABEL[skill.source] ?? skill.source}</dd>
            <dt>状态</dt>
            <dd>{skill.status === "enabled" ? "已启用" : skill.status}</dd>
            <dt>正文</dt>
            <dd>{skill.chars} 字符</dd>
            <dt>文件</dt>
            <dd>~/{skill.path}</dd>
          </dl>

          <div className="meta-title" style={{ marginTop: 14 }}>
            在新会话里装回来
          </div>
          <CopyCommand command={`hermes skills install ${skill.id}`} />

          {related.length > 0 && (
            <>
              <div className="meta-title" style={{ marginTop: 16 }}>
                同类技能
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={href(`/skills/${r.id}/`)}
                    style={{ fontSize: 12.5, color: "var(--ink-2)" }}
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}