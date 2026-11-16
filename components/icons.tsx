import type { ReactNode } from "react";

type P = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconGrid = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
);

export const IconAgent = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="4" y="7" width="16" height="12" rx="4" />
    <path d="M12 3v4M9 13h.01M15 13h.01M9.5 16.5h5" />
  </svg>
);

export const IconSpark = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
);

export const IconClock = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconPlug = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M9 3v5M15 3v5" />
    <path d="M6 8h12v3a6 6 0 01-12 0z" />
    <path d="M12 17v4" />
  </svg>
);

export const IconChart = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const IconSearch = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </svg>
);

export const IconPlus = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconArrow = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconBack = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const IconFire = ({ size = 11 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2s5 4.5 5 9a5 5 0 11-10 0c0-2 1-3.5 1-3.5S9 11 10.5 11C12 11 12 8 12 5.5 12 4 12 2 12 2z" />
  </svg>
);

export const IconCopy = ({ size = 13 }: P) => (
  <svg {...base(size)} strokeWidth={1.8}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 5.5A2.5 2.5 0 0012.5 3H6a2 2 0 00-2 2v7" />
  </svg>
);

export const IconCheck = ({ size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconFolder = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <path d="M3 7a2 2 0 012-2h4l2 2.5h8a2 2 0 012 2V17a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

/** 分类配色：同色系图标底，浅底深字，和参考图的克制度一致 */
const PALETTE: Record<string, [string, string]> = {
  阿里百炼: ["#f3f0ff", "#5b3fd6"],
  飞书办公: ["#e9f2ff", "#1a6fe0"],
  效率工具: ["#eef7f1", "#0f7a4e"],
  创意设计: ["#fff2e8", "#b5541a"],
  软件开发: ["#eaf1fe", "#1f5fd0"],
  网站交付: ["#e8f7f6", "#0b7b74"],
  研究检索: ["#f0effe", "#4b3fbd"],
  "编码与 Agent": ["#efeafd", "#5f43c8"],
  "Apple 生态": ["#f2f3f6", "#3d4149"],
  邮件: ["#fdf0f0", "#a83a3a"],
  媒体处理: ["#fdeff6", "#9c2f6a"],
  社媒内容: ["#eaf3ff", "#155dbb"],
  笔记: ["#fff8e6", "#9a6b08"],
  运维部署: ["#eef1f4", "#37404c"],
  "桌面与 GUI": ["#eff1f6", "#39404d"],
  其他: ["#f3f4f7", "#4b5159"],
};

export function categoryColor(label: string): [string, string] {
  return PALETTE[label] ?? PALETTE["其他"];
}

const GLYPHS = [
  <path key="a" d="M4 17l5-9 4 6 3-4 4 7z" />,
  <path key="b" d="M5 15a7 7 0 0114 0zM3 19h18" />,
  <circle key="c" cx="12" cy="12" r="6" />,
  <path key="d" d="M12 4v16M4 12h16" />,
  <rect key="e" x="5" y="5" width="14" height="14" rx="4" />,
  <path key="f" d="M12 3l8 5v8l-8 5-8-5V8z" />,
  <path key="g" d="M4 16c4-8 12-8 16 0" />,
  <path key="h" d="M6 18V8l6 5 6-5v10" />,
];

export function hashIndex(id: string, mod: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h % mod;
}

export function SkillGlyph({ id, label, size = 44 }: { id: string; label: string; size?: number }) {
  const [bg, fg] = categoryColor(label);
  const glyph = GLYPHS[hashIndex(id, GLYPHS.length)];
  return (
    <div
      className="skill-icon"
      style={{ background: bg, color: fg, width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </svg>
    </div>
  );
}

export function ArtPanel({ id, label, children }: { id: string; label: string; children?: ReactNode }) {
  const [bg, fg] = categoryColor(label);
  const variant = hashIndex(id, 4);
  return (
    <div className="feat-art" style={{ background: bg }}>
      <svg viewBox="0 0 240 108" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={fg} stopOpacity="0.18" />
            <stop offset="100%" stopColor={fg} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <rect width="240" height="108" fill={`url(#g-${id})`} />
        {variant === 0 && (
          <g stroke={fg} strokeOpacity="0.35" strokeWidth="1.2" fill="none">
            <path d="M0 82c30-26 48 8 78-14s46 6 74-16 46 10 88-10" />
            <path d="M0 96c34-22 52 6 82-12s44 8 72-12 46 8 86-8" />
          </g>
        )}
        {variant === 1 && (
          <g stroke={fg} strokeOpacity="0.3" fill="none" strokeWidth="1.2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx={40 + i * 32} cy={38 + (i % 3) * 14} r={10 + i * 2} />
            ))}
          </g>
        )}
        {variant === 2 && (
          <g stroke={fg} strokeOpacity="0.32" fill="none" strokeWidth="1.2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={`M${-20 + i * 42} 108 L${10 + i * 42} 0`} />
            ))}
          </g>
        )}
        {variant === 3 && (
          <g fill={fg} fillOpacity="0.16">
            <circle cx="196" cy="26" r="34" />
            <circle cx="52" cy="92" r="26" />
          </g>
        )}
        <g transform="translate(18 34)">
          <rect width="40" height="40" rx="12" fill="#ffffff" fillOpacity="0.9" />
          <g
            transform="translate(8 8)"
            stroke={fg}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              {GLYPHS[hashIndex(id, GLYPHS.length)]}
            </svg>
          </g>
        </g>
      </svg>
      {children}
    </div>
  );
}