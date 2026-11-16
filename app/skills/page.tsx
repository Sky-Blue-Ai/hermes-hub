import SkillsBrowser from "@/components/SkillsBrowser";
import { cardModels, data } from "@/lib/content";

export const metadata = {
  title: "技能 · Hermes Hub",
};

export default function SkillsPage() {
  const featured = cardModels.filter((c) => c.featured);
  const packs = data.agents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    summary: a.summary,
    skills: a.skills,
    skillTitles: a.skillTitles,
    status: a.status,
    color: a.color,
  }));

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">技能</h1>
          <p className="page-sub">
            为本机 Hermes 装载的能力。每个技能是一个 SKILL.md，Agent 执行任务时按需调用；
            分类来自技能自带的 metadata，不是人工编的。
          </p>
        </div>
      </header>

      <SkillsBrowser
        cards={cardModels}
        categories={data.categories.filter((c) => c.count > 0)}
        featured={featured}
        packs={packs}
        installedCount={data.stats.skills}
      />
    </>
  );
}