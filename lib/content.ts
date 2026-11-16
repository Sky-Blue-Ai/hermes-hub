import raw from "@/app/data/hermes.json";

export type Skill = {
  id: string;
  name: string;
  title: string;
  desc: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  source: string;
  status: string;
  path: string;
  body: string;
  chars: number;
  featured: boolean;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  summary: string;
  color: string;
  skills: string[];
  skillTitles: string[];
  crons: string[];
  channel: string;
  project: string;
  status: string;
  stats: { skills: number; crons: number };
};

export type CronJob = {
  id: string;
  name: string;
  kind: string;
  expr: string;
  display: string;
  enabled: boolean;
  summary: string;
  promptChars: number;
};

export type Channel = {
  id: string;
  name: string;
  detail: string;
  status: "connected" | "off" | string;
};

export type Project = {
  id: string;
  name: string;
  branch: string;
  lastCommit: string;
  subject: string;
  desc: string;
};

export type SessionRow = {
  title: string;
  platform: string;
  messages: number;
  cost: number;
  when: string;
};

export type Data = {
  generatedAt: string;
  stats: {
    skills: number;
    localSkills: number;
    builtinSkills: number;
    agents: number;
    cron: number;
    cronEnabled: number;
    sessions: number;
    messages: number;
    tokensIn: number;
    tokensOut: number;
    toolCalls: number;
    costUsd: number;
    projects: number;
    skillChars: number;
  };
  skills: Skill[];
  categories: { id: string; label: string; count: number }[];
  agents: Agent[];
  crons: CronJob[];
  channels: Channel[];
  system: Record<string, string | boolean>;
  projects: Project[];
  recent: SessionRow[];
  usage: {
    days: { date: string; sessions: number; messages: number; cost: number }[];
    models: { model: string; sessions: number; cost: number }[];
    platforms: { platform: string; sessions: number }[];
    topSessions: SessionRow[];
    topTools: { tool: string; calls: number }[];
  };
};

export const data = raw as unknown as Data;

export const skills = data.skills;
export const agents = data.agents;
export const crons = data.crons;
export const projects = data.projects;

/** 卡片投影：客户端筛选只吃这些字段，不把 700KB 正文塞进 HTML */
export type SkillCardModel = {
  id: string;
  title: string;
  desc: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  source: string;
  featured: boolean;
};

export const cardModels: SkillCardModel[] = skills.map((s) => ({
  id: s.id,
  title: s.title,
  desc: s.desc,
  category: s.categoryLabel,
  categoryLabel: s.categoryLabel,
  tags: s.tags.slice(0, 3),
  source: s.source,
  featured: s.featured,
}));

export const featuredSkills = skills.filter((s) => s.featured);
export const skillById = new Map(skills.map((s) => [s.id, s]));

export function agentById(id: string) {
  return agents.find((a) => a.id === id);
}

export function cronById(id: string) {
  return crons.find((c) => c.id === id);
}

export function relatedSkills(skill: Skill, limit = 3) {
  return skills
    .filter((s) => s.category === skill.category && s.id !== skill.id)
    .slice(0, limit);
}

export function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export const SOURCE_LABEL: Record<string, string> = {
  local: "本地技能",
  builtin: "内置技能",
  plugin: "插件技能",
  hub: "SkillHub",
};