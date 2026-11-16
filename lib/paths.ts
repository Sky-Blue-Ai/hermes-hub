export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * 站内路由链接。
 *
 * 注意：设置了 next.config 的 basePath 后，next/link 与 router **会自己加前缀**，
 * 这里再加一次就会变成 /repo/repo/xxx（实测踩过）。所以对 <Link> 直接给根路径，
 * 只有手写的 <a href> 才需要 asset()。
 */
export const href = (p: string) => p;

/** 静态资源（public/ 下的文件、图片）：框架不会替你加前缀 */
export const asset = (p?: string | null) => {
  if (!p) return "";
  if (/^https?:/i.test(p)) return p;
  return `${BASE}${p}`;
};

/** usePathname() 在子路径部署时会带前缀，比较前剥掉 */
export const stripBase = (path: string) =>
  BASE && path.startsWith(BASE) ? path.slice(BASE.length) || "/" : path;