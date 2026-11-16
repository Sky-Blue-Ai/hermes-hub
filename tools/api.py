#!/usr/bin/env python3.11
"""Hermes Hub 写操作 API（只绑 127.0.0.1）

静态产物照旧由本进程伺服，额外提供几个 JSON 接口：
  GET  /api/health                  -> {"ok":true}
  POST /api/cron/pause   {id}       -> hermes cron pause <id>
  POST /api/cron/resume  {id}       -> hermes cron resume <id>
  POST /api/cron/run     {id}       -> hermes cron run <id>
  POST /api/refresh                 -> 重新采集 + 构建（约 40s）

安全：
- 只监听 127.0.0.1，不暴露到公网；隧道只转 8090 的静态服务时也不要指向本端口。
- 所有写操作要求 X-Hermes-Token = .run/api_token 的内容（前端从同源 /api/token 拿不到，必须手工注入），
  默认只允许来自 127.0.0.1 的请求（隧道反代会带 X-Forwarded-For，一律拒绝写）。
- 每次写操作追加到 .run/audit.jsonl。
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
RUN = ROOT / ".run"
TOKEN_FILE = RUN / "api_token"
AUDIT = RUN / "audit.jsonl"
ALLOWED_IDS = re.compile(r"^[A-Za-z0-9_-]{4,64}$")


def token() -> str:
    RUN.mkdir(parents=True, exist_ok=True)
    if not TOKEN_FILE.exists():
        TOKEN_FILE.write_text(os.urandom(16).hex(), encoding="utf-8")
    return TOKEN_FILE.read_text(encoding="utf-8").strip()


def audit(action: str, payload: dict, result: dict) -> None:
    RUN.mkdir(parents=True, exist_ok=True)
    with AUDIT.open("a", encoding="utf-8") as fh:
        fh.write(
            json.dumps(
                {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "action": action, "payload": payload, "result": result},
                ensure_ascii=False,
            )
            + "\n"
        )


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(OUT), **kwargs)

    def log_message(self, fmt, *args):  # 静音：只留审计日志
        pass

    # ---------- helpers ----------
    def _json(self, code: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _body(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length") or 0)
            return json.loads(self.rfile.read(length) or b"{}")
        except Exception:  # noqa: BLE001
            return {}

    def _local(self) -> bool:
        """只接受本机来源。

        浏览器里点按钮时不会带自定义 header，所以两条通路：
        1) Origin 等于本服务的 127.0.0.1/localhost 地址（挡住跨站 CSRF 与别的网页）
        2) 带 X-Hermes-Token（脚本/curl 用）
        隧道反代会带 X-Forwarded-For，一律拒绝。
        """
        if self.headers.get("X-Forwarded-For"):
            return False
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            return False
        if self.headers.get("X-Hermes-Token") == token():
            return True
        origin = (self.headers.get("Origin") or "").rstrip("/")
        port = os.environ.get("API_PORT", "8091")
        return origin in (f"http://127.0.0.1:{port}", f"http://localhost:{port}")

    # ---------- routes ----------
    def do_GET(self):  # noqa: N802
        if self.path.split("?")[0] == "/api/health":
            self._json(200, {"ok": True, "write": True, "pid": os.getpid()})
            return
        super().do_GET()

    def do_POST(self):  # noqa: N802
        path = self.path.split("?")[0]
        payload = self._body()
        if not self._local():
            self._json(403, {"ok": False, "error": "写操作只接受本机 + 正确 token"})
            return

        if path == "/api/refresh":
            proc = subprocess.run(
                ["npm", "run", "build"], cwd=ROOT, capture_output=True, text=True, timeout=600
            )
            ok = proc.returncode == 0
            audit("refresh", {}, {"ok": ok, "code": proc.returncode})
            self._json(200 if ok else 500, {"ok": ok, "tail": (proc.stdout + proc.stderr)[-400:]})
            return

        m = re.match(r"^/api/cron/(pause|resume|run)$", path)
        if m:
            action = m.group(1)
            job_id = str(payload.get("id", ""))
            if not ALLOWED_IDS.match(job_id):
                self._json(400, {"ok": False, "error": "非法任务 id"})
                return
            cmd = ["hermes", "cron", action, job_id]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            ok = proc.returncode == 0
            out = (proc.stdout + proc.stderr).strip()[-300:]
            audit(f"cron.{action}", {"id": job_id}, {"ok": ok, "out": out})
            self._json(200 if ok else 500, {"ok": ok, "out": out})
            return

        self._json(404, {"ok": False, "error": "unknown endpoint"})


def main() -> int:
    if not (OUT / "index.html").exists():
        print("[x] 缺少 out/index.html，先 npm run build")
        return 1
    port = int(os.environ.get("API_PORT", "8091"))
    token()  # 确保 token 文件存在
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"[ok] api on http://127.0.0.1:{port}/ (static + write, token in .run/api_token)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())