#!/usr/bin/env python3.11
"""内容门禁：构建前跑，任何一条不通过 exit 1。

规则
1. 每个技能必须有 id / title / desc，正文 >= 200 字符
2. agents 引用的 skill、cron 必须存在；每个 agent 至少 2 个技能
3. 脱敏：产物里不得残留密钥 / token / open_id / 手机号 / 邮箱
4. 数量骤降（-20%）：拒绝覆盖（需人工删产物）
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "data" / "hermes.json"
AGENTS = ROOT / "content" / "agents.json"

SENSITIVE = [
    # sk- 前面不能紧跟字母（避免 risk-... / disk-... 这类单词被当成 key）
    (re.compile(r"(?<![A-Za-z0-9])sk-[A-Za-z0-9]{20,}"), "疑似 API key"),
    (re.compile(r"\bou_[0-9a-f]{16,}\b"), "飞书 open_id"),
    # 排除浮点百分比（13.1578947…）与 Apple 文档里的 1415555xxxx 示例号
    (re.compile(r"(?<![\d.])1(?!415555)[3-9]\d{9}(?![\d.])"), "手机号"),
    # 排除示例域名与包名版本号（p5.js-svg@1.6.0）
    (
        re.compile(r"[\w.+-]+@(?!example\.com|[\d])[\w-]+\.[\w.]{2,}"),
        "邮箱",
    ),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{24,}"), "Bearer token"),
    (re.compile(r"cli_[0-9a-f]{16,}"), "飞书应用 ID"),
]

# 文档里合法出现、不属于泄露的字符串
ALLOW = {
    "git@github.com",
    "noreply@github.com",
    "hermes@nousresearch.com",
    "nokey@localhost.run",
    "you@example.com",
    "user@example.com",
    "alice@example.com",
    "recipient@example.com",
    # 文档里的占位联系人
    "boss@company.com",
    "alice@co.com",
    "bob@co.com",
}

errors: list[str] = []
warnings: list[str] = []


def main() -> int:
    if not DATA.exists():
        print("[x] 缺少 app/data/hermes.json，先跑 tools/collect.py")
        return 1
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    skills = payload.get("skills", [])
    crons = payload.get("crons", [])
    agents = payload.get("agents", [])

    if len(skills) < 10:
        errors.append(f"技能数量异常：{len(skills)}")
    ids = set()
    for s in skills:
        sid = s.get("id") or ""
        if not sid:
            errors.append("存在没有 id 的技能")
            continue
        if sid in ids:
            errors.append(f"技能 id 重复：{sid}")
        ids.add(sid)
        if not s.get("title"):
            errors.append(f"{sid}: 缺中文标题（overrides.json）")
        if not (s.get("desc") or "").strip():
            errors.append(f"{sid}: 缺 description")
        if len(s.get("body") or "") < 200:
            errors.append(f"{sid}: 正文只有 {len(s.get('body') or '')} 字符，疑似抓空")
        if not s.get("categoryLabel"):
            errors.append(f"{sid}: 缺分类")

    cron_ids = {c["id"] for c in crons}
    cfg = json.loads(AGENTS.read_text(encoding="utf-8")) if AGENTS.exists() else {"agents": []}
    for a in cfg.get("agents", []):
        aid = a.get("id", "?")
        if len(a.get("skills", [])) < 2:
            errors.append(f"agent {aid}: 技能少于 2 个")
        for ref in a.get("skills", []):
            if ref not in ids:
                errors.append(f"agent {aid}: 引用了不存在的技能 {ref}")
        for ref in a.get("crons", []):
            if ref not in cron_ids:
                errors.append(f"agent {aid}: 引用了不存在的定时任务 {ref}")
        proj = a.get("project")
        if proj and proj not in {p["id"] for p in payload.get("projects", [])}:
            warnings.append(f"agent {aid}: 项目 {proj} 不在本次采集结果里")

    # 脱敏：只扫会出现在页面上的字段，正文与标题都要过
    text_blob = "\n".join(
        [
            *(s.get("desc", "") for s in skills),
            *(s.get("title", "") for s in skills),
            *(s.get("body", "") for s in skills),
            *(s.get("summary", "") for s in crons),
            *(r.get("title", "") for r in payload.get("recent", [])),
        ]
    )
    for pat, label in SENSITIVE:
        hits = [h for h in pat.findall(text_blob) if h not in ALLOW]
        if hits:
            errors.append(f"脱敏未通过：{label} 命中 {len(hits)} 处，例：{hits[0][:60]}")

    # 数量骤降保护
    baseline_file = ROOT / ".baseline.json"
    if baseline_file.exists():
        base = json.loads(baseline_file.read_text(encoding="utf-8"))
        prev = base.get("skills", 0)
        if prev and len(skills) < prev * 0.8:
            errors.append(f"技能数量从 {prev} 骤降到 {len(skills)}（>20%），拒绝覆盖产物")
    baseline_file.write_text(json.dumps({"skills": len(skills)}, ensure_ascii=False), encoding="utf-8")

    for w in warnings:
        print(f"[!] {w}")
    if errors:
        for e in errors:
            print(f"[x] {e}")
        print(f"\n门禁失败：{len(errors)} 个问题")
        return 1
    print(
        f"[ok] 门禁通过：{len(skills)} 个技能 / {len(agents)} 个 agent / {len(crons)} 个定时任务，"
        f"脱敏 0 命中"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())