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
./scripts/serve-web.sh start   # 只读版 http://127.0.0.1:8090/
./scripts/serve-web.sh api     # 可写版 http://127.0.0.1:8091/（静态 + /api/*）
```

`npm run build` 会通过 `prebuild` 自动跑 collect + check。

## 写操作（可选，默认不开）

`tools/api.py` 只监听 `127.0.0.1:8091`，提供：

| 接口 | 作用 |
|---|---|
| `GET /api/health` | 前端用来判断「是否有写能力」，没有就不渲染按钮 |
| `POST /api/cron/pause` `{id}` | `hermes cron pause <id>` |
| `POST /api/cron/resume` `{id}` | `hermes cron resume <id>` |
| `POST /api/cron/run` `{id}` | `hermes cron run <id>` |
| `POST /api/refresh` | 重新采集 + 构建（约 40s） |

安全四道门：① 只绑 loopback；② 带 `X-Forwarded-For` 一律拒（隧道反代打不进来）；
③ `Origin` 必须是 `127.0.0.1:8091` / `localhost:8091`（挡跨站 CSRF），或带 `.run/api_token` 的
`X-Hermes-Token`（脚本用）；④ 任务 id 必须匹配 `^[A-Za-z0-9_-]{4,64}$`。每次写操作落在 `.run/audit.jsonl`。

隧道只指向 8090（只读版）：手机上能看不能改。要远程操作就把隧道指到 8091 并自己加一层鉴权——
脚本默认不做这件事，因为把能改 cron 的接口暴露到公网风险太高。

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

## 二期（已做一半）

- ✅ 暂停/恢复/立即运行定时任务：`tools/api.py` + 定时任务页按钮（仅本机 8091 可见）
- ✅ 刷新快照并重建：定时任务页右上按钮
- ⬜ 「+ 安装技能」真装：需要 `hermes skills install <id>`，远端 registry 搜索在本机实测会超时，
  要先做超时 + 缓存再上
- ⬜ GitHub Pages 固定地址：仓库建好后配 `.github/workflows/pages.yml`（产物里的写按钮会自动消失）

## 固定地址（本机 nginx）

https://jarvis.asia/hub/ ← 生产地址（HTTPS，证书 `/etc/letsencrypt/live/icxyule.fun` 已含 jarvis.asia）

```bash
./scripts/deploy-jarvis.sh    # 采集 + 门禁 + 构建(basePath=/hub) + rsync 到 /var/www/hermes-hub + reload nginx
```

- nginx 片段在 `/etc/nginx/conf.d/jarvis.conf`：`location = /hub`(301) + `location ^~ /hub/`(alias /var/www/hermes-hub/)
- 本机访问自己的公网 IP 会被 hairpin 挡掉（curl 回 000），自检要用
  `curl -k --resolve jarvis.asia:443:127.0.0.1 https://jarvis.asia/hub/`
- 这个地址是只读的：写按钮只在 `127.0.0.1:8091` 出现（同源 `/api/health` 不存在就自动隐藏）

## 隧道（备用，域名会不停轮换）

`./scripts/serve-web.sh start` + `./scripts/tunnel...`：localhost.run 每次重连换域名、serveo 十几分钟过期，
只用于临时预览。当前域名记在 `.run/tunnel_url.txt`。

## 部署到子路径

`NEXT_PUBLIC_BASE_PATH=/hermes-hub npm run build`。注意 `lib/paths.ts` 里的 `href()` 对 `<Link>` 返回根路径——
basePath 已经由 Next 自己加，再加一次会变成 `/repo/repo/`。`asset()` 才需要显式前缀。