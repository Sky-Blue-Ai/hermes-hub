export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 内部链接统一走 href()，子路径部署（GitHub Pages）才不会 404 */
export const href = (p: string) => (p.startsWith("/") ? `${BASE}${p}` : p);

export const asset = (p?: string | null) => {
  if (!p) return "";
  if (/^https?:/i.test(p)) return p;
  return `${BASE}${p}`;
};

/** usePathname() 在子路径部署时会带前缀，比较前剥掉 */
export const stripBase = (path: string) =>
  BASE && path.startsWith(BASE) ? path.slice(BASE.length) || "/" : path;