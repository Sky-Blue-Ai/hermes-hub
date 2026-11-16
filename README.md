# Hermes Hub

把本机 Hermes 的技能、Agent、定时任务、会话用量读成一份**只读**的中文控制台（LightVela 式布局）。

## 数据从哪来

| 数据 | 来源 | 说明 |
|---|---|---|
| 技能 | `~/.hermes/skills/**/SKILL.md`（含符号链接目录） | 正文渲染成详情页，frontmatter 提供名称/描述/分类/标签 |
| 安装状态 | `hermes skills list` | source / trust / status |
| 定时任务 | `~/.hermes/cron/jobs.json` | schedule、enabled、提示词摘要（已脱敏） |
| 会话用量 | `~/.hermes/state.db`（只读连接） | sessions / messages / tokens / cost / tool_names |
| 通道与运行时 | `hermes status` | Platforms 行是唯一真实来源 |
| 项目 | `/root/work/*/.git` | 最近提交、分支、README 首行 |
| Agent 分组 | `content/agents.json` | 手写：技能组合 + 定时任务 + 项目 |

采集器**只读**，不写回 `~/.hermes`。

## 跑起来

```bash
npm install
npm run collect     # 采集 -> app/data/hermes.json
npm run check       # 门禁
npm run build       # 静态导出 -> out/
./scripts/serve-web.sh start   # http://127.0.0.1:8090/
```

`npm run build` 会通过 `prebuild` 自动跑 collect + check。

## 门禁（tools/check_content.py）

1. 每个技能必须有中文标题、描述、正文 ≥ 200 字符（抓空就报错）
2. `agents.json` 引用的 skill / cron 必须存在
3. 脱敏扫描：API key、open_id、手机号、邮箱、app id —— 命中即失败
4. 技能数骤降 20% 拒绝覆盖（`.baseline.json` 记基线）

## 结构

```
tools/collect.py       Hermes -> app/data/hermes.json
tools/check_content.py 门禁
content/agents.json    Agent 定义（角色 = 技能 + cron + 项目）
content/overrides.json 技能中文名 + 精选位
app/                   Next 16 App Router，output: export
components/            侧边栏、技能浏览器（客户端筛选）、图标
scripts/serve-web.sh   8090 静态服务 + tunnel
```

## 二期（未做）

- 「+ 安装技能」真装：需要一个只监听 127.0.0.1 的写 API（`hermes skills install`）+ 审计日志
- 启停定时任务：同上，走 `hermes cron enable/disable`
- 远端 SkillHub 搜索：`hermes skills browse` 在本机实测 180s 超时，必须带超时与缓存

## 部署到子路径

`NEXT_PUBLIC_BASE_PATH=/hermes-hub npm run build`，内部链接全部走 `lib/paths.ts` 的 `href()`。