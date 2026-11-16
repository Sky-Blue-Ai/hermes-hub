import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/** SKILL.md -> HTML。内容是本机技能文件，属于受信来源，直接渲染。 */
export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}