#!/usr/bin/env python3.11
"""采集本机 Hermes 的真实数据 -> content/hermes.json

只读：不修改 ~/.hermes 下任何文件。
用法: python3.11 tools/collect.py
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

HOME = Path(os.environ.get("HERMES_HOME", Path.home() / ".hermes"))
ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SKILL_ROOTS = [HOME / "skills", HOME / "plugins"]
WORK = Path(os.environ.get("WORK_DIR", "/root/work"))

CATEGORY_LABELS = {
    "bailian": "阿里百炼",
    "feishu": "飞书办公",
    "autonomous-ai-agents": "编码与 Agent",
    "creative": "创意设计",
    "devops": "运维部署",
    "email": "邮件",
    "media": "媒体处理",
    "note-taking": "笔记",
    "productivity": "效率工具",
    "research": "研究检索",
    "social-media": "社媒内容",
    "software-development": "软件开发",
    "web": "网站交付",
    "apple": "Apple 生态",
    "desktop": "桌面与 GUI",
    "other": "其他",
}

# 信用卡/API key/手机号/邮箱/飞书 id 等一律脱敏
REDACTIONS = [
    (re.compile(r"sk-[A-Za-z0-9_\-]{12,}"), "[已脱敏密钥]"),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{16,}"), "Bearer [已脱敏]"),
    (re.compile(r"\bou_[0-9a-f]{16,}\b"), "[飞书 open_id]"),
    (re.compile(r"\b1[3-9]\d{9}\b"), "[手机号]"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]{2,}"), "[邮箱]"),
    (re.compile(r"cli_[0-9a-f]{16,}"), "[飞书应用ID]"),
]


def scrub(text: str) -> str:
    if not text:
        return ""
    for pat, repl in REDACTIONS:
        text = pat.sub(repl, text)
    return text


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """极简 YAML frontmatter 解析：只取顶层标量与列表 + metadata.hermes.*

    额外处理 `description: >-` / `|` 这类块标量（bailian 家族都是这么写的）。
    """
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm_raw, body = text[3:end], text[end + 4 :]
    data: dict = {}
    section: list[str] = []
    lines = fm_raw.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        i += 1
        if not line.strip() or line.strip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        if indent == 0:
            key, _, val = line.partition(":")
            key, val = key.strip(), val.strip()
            section = [key]
            if val in (">", ">-", "|", "|-", ">+", "|+"):
                block: list[str] = []
                while i < len(lines):
                    nxt = lines[i]
                    if nxt.strip() and (len(nxt) - len(nxt.lstrip())) == 0:
                        break
                    block.append(nxt.strip())
                    i += 1
                joiner = "\n" if val.startswith("|") else ""
                data[key] = joiner.join(x for x in block if x).strip()
            elif val:
                data[key] = val.strip('"').strip("'")
            else:
                data[key] = data.get(key) or {}
            continue
        key, _, val = line.strip().partition(":")
        val = val.strip()
        if True:
            if not isinstance(data.get(section[0]), dict):
                data[section[0]] = {}
            node = data[section[0]]
            for parent in section[1:]:
                node = node.setdefault(parent, {})
            if val:
                node[key] = val.strip('"').strip("'")
            else:
                node.setdefault(key, {})
                section.append(key)
    return data, body.lstrip("\n")


def skill_files(root: Path):
    """rglob 不会进符号链接目录，而 bailian 家族是 symlink 到 ~/.bailian/skills 的。"""
    if not root.exists():
        return []
    files = []
    for entry in sorted(root.iterdir()):
        if entry.is_symlink() or entry.is_dir():
            direct = entry / "SKILL.md"
            if direct.exists():
                files.append(direct)
                continue
            files.extend(sorted(entry.rglob("SKILL.md")))
    return files


def walk_skills() -> list[dict]:
    found: dict[str, dict] = {}
    for root in SKILL_ROOTS:
        if not root.exists():
            continue
        for path in skill_files(root):
            text = path.read_text(encoding="utf-8", errors="replace")
            fm, body = parse_frontmatter(text)
            name = fm.get("name") or path.parent.name
            if name in found:
                continue
            rel = path.relative_to(root)
            parts = rel.parts
            if root.name == "plugins":
                category = "other"
                origin = "plugin"
            elif len(parts) == 2:  # skills/<name>/SKILL.md
                top = parts[0]
                category = "feishu" if top.startswith("feishu") else (
                    "bailian" if top.startswith("bailian") else "other"
                )
                origin = "local"
            else:
                category = parts[0]
                origin = "local"
            hermes_meta = {}
            meta = fm.get("metadata")
            if isinstance(meta, dict) and isinstance(meta.get("hermes"), dict):
                hermes_meta = meta["hermes"]
            if hermes_meta.get("category"):
                category = hermes_meta["category"]
            tags = hermes_meta.get("tags") or []
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.strip("[]").split(",") if t.strip()]
            desc = fm.get("description") or ""
            if not isinstance(desc, str):
                desc = str(desc)
            found[name] = {
                "id": name,
                "name": name,
                "desc": scrub(" ".join(desc.split())),
                "descEn": "",
                "category": category,
                "categoryLabel": CATEGORY_LABELS.get(category, category),
                "tags": [str(t) for t in tags][:6],
                "origin": origin,
                "path": str(path.relative_to(Path.home())),
                "body": body,
                "chars": len(body),
            }
    return list(found.values())


def bundled_names() -> set[str]:
    """hermes 安装目录里的捆绑技能名：用来区分「内置」与「本地写的」。

    `hermes skills list` 的表格列宽会随名称长度变化，按列取值不稳定，所以统计口径走文件系统。
    """
    root = HOME / "hermes-agent" / "skills"
    names: set[str] = set()
    if not root.exists():
        return names
    for path in root.rglob("SKILL.md"):
        names.add(path.parent.name)
        try:
            fm, _ = parse_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
            if isinstance(fm.get("name"), str):
                names.add(fm["name"])
        except Exception:  # noqa: BLE001
            pass
    return names


def installed_sources() -> dict[str, dict]:
    """`hermes skills list` -> {name: {source, trust, status}}"""
    out: dict[str, dict] = {}
    try:
        res = subprocess.run(
            ["hermes", "skills", "list"], capture_output=True, text=True, timeout=120
        )
        for line in res.stdout.splitlines():
            if "│" not in line and "┃" not in line:
                continue
            cells = [c.strip() for c in re.split(r"[│┃]", line)]
            cells = [c for c in cells if c]
            if len(cells) < 4 or cells[0].lower().startswith("name"):
                continue
            out[cells[0]] = {
                "source": cells[2] if len(cells) > 2 else "",
                "trust": cells[3] if len(cells) > 3 else "",
                "status": cells[4] if len(cells) > 4 else "enabled",
            }
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] hermes skills list 解析失败: {exc}")
    return out


def load_cron() -> list[dict]:
    jobs_file = HOME / "cron" / "jobs.json"
    if not jobs_file.exists():
        return []
    jobs = json.loads(jobs_file.read_text(encoding="utf-8")).get("jobs", [])
    result = []
    for job in jobs:
        sched = job.get("schedule") or {}
        prompt = scrub(job.get("prompt") or "")
        summary = ""
        for line in prompt.splitlines():
            line = line.strip(" -*#")
            if len(line) > 12 and "base_token" not in line:
                summary = line[:90]
                break
        result.append(
            {
                "id": job.get("id", ""),
                "name": job.get("name", ""),
                "kind": sched.get("kind", ""),
                "expr": sched.get("expr", ""),
                "display": sched.get("display", "") or sched.get("expr", ""),
                "enabled": bool(job.get("enabled")),
                "summary": summary,
                "promptChars": len(prompt),
            }
        )
    return result


def load_stats() -> dict:
    db = HOME / "state.db"
    stats = {
        "sessions": 0,
        "messages": 0,
        "tokensIn": 0,
        "tokensOut": 0,
        "toolCalls": 0,
        "costUsd": 0.0,
        "models": [],
        "days": [],
        "platforms": [],
        "topSessions": [],
        "topTools": [],
    }
    if not db.exists():
        return stats
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    try:
        row = con.execute(
            "select count(*), coalesce(sum(message_count),0), coalesce(sum(input_tokens),0),"
            " coalesce(sum(output_tokens),0), coalesce(sum(tool_call_count),0),"
            " coalesce(sum(estimated_cost_usd),0) from sessions"
        ).fetchone()
        stats.update(
            sessions=row[0],
            messages=row[1],
            tokensIn=row[2],
            tokensOut=row[3],
            toolCalls=row[4],
            costUsd=round(row[5] or 0, 4),
        )
        stats["models"] = [
            {"model": r[0] or "unknown", "sessions": r[1], "cost": round(r[2] or 0, 4)}
            for r in con.execute(
                "select model, count(*), sum(estimated_cost_usd) from sessions"
                " group by model order by count(*) desc limit 5"
            )
        ]
        stats["platforms"] = [
            {"platform": r[0] or "unknown", "sessions": r[1]}
            for r in con.execute(
                "select source, count(*) from sessions group by source order by count(*) desc"
            )
        ]
        stats["days"] = [
            {"date": r[0], "sessions": r[1], "messages": r[2], "cost": round(r[3] or 0, 4)}
            for r in con.execute(
                "select date(started_at,'unixepoch','localtime') d, count(*),"
                " coalesce(sum(message_count),0), coalesce(sum(estimated_cost_usd),0)"
                " from sessions where started_at > cast(strftime('%s','now','-45 days') as integer)"
                " group by d order by d"
            )
        ]
        stats["topSessions"] = [
            {
                "title": scrub(r[0] or "(未命名会话)"),
                "platform": r[1] or "cli",
                "messages": r[2],
                "cost": round(r[3] or 0, 3),
                "when": datetime.fromtimestamp(r[4], tz=timezone.utc).isoformat()
                if r[4]
                else "",
            }
            for r in con.execute(
                "select title, source, message_count, estimated_cost_usd, last_activity_at"
                " from sessions order by message_count desc limit 8"
            )
        ]
        tool_counter: dict[str, int] = {}
        for (names,) in con.execute("select tool_names from sessions where tool_names is not null"):
            try:
                parsed = json.loads(names)
            except Exception:  # noqa: BLE001
                continue
            if isinstance(parsed, dict):
                items = parsed.items()
            elif isinstance(parsed, list):
                items = [(str(x), 1) for x in parsed]
            else:
                continue
            for tool, count in items:
                n = count if isinstance(count, int) else 1
                tool_counter[tool] = tool_counter.get(tool, 0) + n
        stats["topTools"] = [
            {"tool": k, "calls": v}
            for k, v in sorted(tool_counter.items(), key=lambda kv: -kv[1])[:10]
        ]
    finally:
        con.close()
    return stats


def load_recent() -> list[dict]:
    db = HOME / "state.db"
    if not db.exists():
        return []
    con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
    try:
        rows = con.execute(
            "select title, source, message_count, estimated_cost_usd, last_activity_at"
            " from sessions where title is not null"
            " order by last_activity_at desc limit 12"
        ).fetchall()
    finally:
        con.close()
    return [
        {
            "title": scrub(r[0] or "(未命名会话)"),
            "platform": r[1] or "cli",
            "messages": r[2] or 0,
            "cost": round(r[3] or 0, 3),
            "when": datetime.fromtimestamp(r[4], tz=timezone.utc).isoformat() if r[4] else "",
        }
        for r in rows
    ]


def load_channels() -> tuple[list[dict], dict]:
    """`hermes status` 的 Platforms 行是唯一的真实来源（config.yaml 里全是注释示例）。

    没有 hermes CLI 的机器（CI）不炸：回落成全部未知。
    """
    out = ""
    try:
        proc = subprocess.run(["hermes", "status"], capture_output=True, text=True, timeout=90)
        out = proc.stdout + proc.stderr
    except FileNotFoundError:
        print("[warn] 找不到 hermes CLI，通道/运行时留空")
    status: dict = {}
    for key in ("Model", "Provider", "Gateway", "Platforms", "Jobs"):
        m = re.search(rf"^\s*{key}:\s*(.+)$", out, re.M)
        if m:
            status[key.lower()] = m.group(1).strip()
    active = status.get("platforms", "")
    known = [
        ("feishu", "飞书", "Lark 应用 · 私聊与群话题", ("Feishu", "Lark")),
        ("qqbot", "QQ", "QQ 官方机器人 · 频道与私聊", ("QQ",)),
        ("telegram", "Telegram", "Telegram Bot", ("Telegram",)),
        ("discord", "Discord", "Discord Bot", ("Discord",)),
        ("weixin", "微信", "微信通道", ("Weixin", "WeChat", "微信")),
    ]
    channels = []
    for cid, name, detail, aliases in known:
        connected = any(alias.lower() in active.lower() for alias in aliases)
        channels.append(
            {
                "id": cid,
                "name": name,
                "detail": detail,
                "status": "connected" if connected else "off",
            }
        )
    running = "running" in status.get("gateway", "").lower()
    return channels, {**status, "gatewayRunning": running}


def load_projects(limit: int = 8) -> list[dict]:
    projects = []
    if not WORK.exists():
        return projects
    for d in sorted(WORK.iterdir()):
        if not d.is_dir() or not (d / ".git").exists():
            continue
        def git(*args: str) -> str:
            try:
                return subprocess.run(
                    ["git", "-C", str(d), *args], capture_output=True, text=True, timeout=20
                ).stdout.strip()
            except Exception:  # noqa: BLE001
                return ""

        branch = git("rev-parse", "--abbrev-ref", "HEAD")
        when = git("log", "-1", "--format=%cs")
        subject = git("log", "-1", "--format=%s")
        desc = ""
        for name in ("README.md", "readme.md"):
            readme = d / name
            if readme.exists():
                for line in readme.read_text(encoding="utf-8", errors="replace").splitlines():
                    line = line.strip()
                    if line and not line.startswith(("#", "!", "[", "<", "|", "---")):
                        desc = line[:80]
                        break
                break
        projects.append(
            {
                "id": d.name,
                "name": d.name,
                "branch": branch,
                "lastCommit": when,
                "subject": scrub(subject)[:70],
                "desc": scrub(desc),
            }
        )
    projects.sort(key=lambda p: p["lastCommit"], reverse=True)
    return projects[:limit]


def asset_dir() -> Path:
    out = ROOT / "app" / "data"
    out.mkdir(parents=True, exist_ok=True)
    return out


def main() -> None:
    skills = walk_skills()
    installed = installed_sources()
    bundled = bundled_names()
    overrides_file = CONTENT / "overrides.json"
    overrides = json.loads(overrides_file.read_text(encoding="utf-8")) if overrides_file.exists() else {}
    title_map = overrides.get("titles", {})
    featured = set(overrides.get("featured", []))
    for s in skills:
        info = installed.get(s["id"], {})
        if s["origin"] == "plugin":
            s["source"] = "plugin"
        elif s["id"] in bundled or s["name"] in bundled:
            s["source"] = "builtin"
        else:
            s["source"] = "local"
        s["status"] = info.get("status") or "enabled"
        s["title"] = title_map.get(s["id"], s["id"])
        s["featured"] = s["id"] in featured

    skills.sort(key=lambda s: (not s["featured"], s["categoryLabel"], s["id"]))

    cron = load_cron()
    stats = load_stats()
    channels, system = load_channels()
    projects = load_projects()
    recent = load_recent()

    agents_file = CONTENT / "agents.json"
    agents_cfg = json.loads(agents_file.read_text(encoding="utf-8")) if agents_file.exists() else {"agents": []}
    skill_ids = {s["id"] for s in skills}
    cron_ids = {c["id"] for c in cron}
    agents = []
    for a in agents_cfg.get("agents", []):
        a_skills = [sid for sid in a.get("skills", []) if sid in skill_ids]
        a_crons = [cid for cid in a.get("crons", []) if cid in cron_ids]
        related = [s["title"] for s in skills if s["id"] in a_skills]
        agents.append(
            {
                "id": a["id"],
                "name": a["name"],
                "role": a.get("role", ""),
                "summary": a.get("summary", ""),
                "color": a.get("color", "violet"),
                "skills": a_skills,
                "skillTitles": related,
                "crons": a_crons,
                "channel": a.get("channel", ""),
                "project": a.get("project", ""),
                "status": "running" if a_crons or a.get("channel") else "idle",
                "stats": {
                    "skills": len(a_skills),
                    "crons": len(a_crons),
                },
            }
        )

    categories: dict[str, int] = {}
    for s in skills:
        categories[s["categoryLabel"]] = categories.get(s["categoryLabel"], 0) + 1

    payload = {
        "generatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "stats": {
            "skills": len(skills),
            "localSkills": sum(1 for s in skills if s["source"] == "local"),
            "builtinSkills": sum(1 for s in skills if s["source"] not in ("local", "plugin")),
            "agents": len(agents),
            "cron": len(cron),
            "cronEnabled": sum(1 for c in cron if c["enabled"]),
            "sessions": stats["sessions"],
            "messages": stats["messages"],
            "tokensIn": stats["tokensIn"],
            "tokensOut": stats["tokensOut"],
            "toolCalls": stats["toolCalls"],
            "costUsd": stats["costUsd"],
            "projects": len(projects),
            "skillChars": sum(s["chars"] for s in skills),
        },
        "skills": skills,
        "categories": [
            {"id": label, "label": label, "count": count}
            for label, count in sorted(categories.items(), key=lambda kv: -kv[1])
        ],
        "agents": agents,
        "crons": cron,
        "channels": channels,
        "system": system,
        "projects": projects,
        "recent": recent,
        "usage": stats,
    }

    target = asset_dir() / "hermes.json"
    text = json.dumps(payload, ensure_ascii=False, indent=1)
    target.write_text(text, encoding="utf-8")
    print(
        f"[ok] {target.relative_to(ROOT)}  {len(text)/1024:.0f}KB  "
        f"skills={len(skills)} agents={len(agents)} cron={len(cron)} "
        f"sessions={stats['sessions']} projects={len(projects)}"
    )


if __name__ == "__main__":
    main()