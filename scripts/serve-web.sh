#!/usr/bin/env bash
# 8090 静态服务：启动 / 停止 / 状态 / 日志 / 隧道
set -euo pipefail

PORT="${PORT:-8090}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/out"
RUN="$ROOT/.run"
mkdir -p "$RUN"
PIDFILE="$RUN/web.pid"
LOG="$RUN/web.log"
URL="http://127.0.0.1:${PORT}/"

ensure_build() {
  if [ ! -f "$OUT/index.html" ]; then
    echo "产物不存在，先构建…"
    cd "$ROOT"
    if [ ! -d node_modules ]; then
      echo "缺少依赖，npm install…"
      npm install --no-audit --no-fund
    fi
    npm run build
  fi
}

is_running() {
  [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

case "${1:-start}" in
  start)
    ensure_build
    if is_running; then
      echo "已在运行（pid $(cat "$PIDFILE")）：$URL"
      echo "重启：$0 restart ｜ 停止：$0 stop"
      exit 4
    fi
    if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
      echo "端口 ${PORT} 已被占用，换一个：PORT=8091 $0 start"
      exit 1
    fi
    cd "$OUT"
    nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    sleep 1
    code=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || true)
    echo "已启动：$URL（HTTP $code，日志 $LOG）"
    ;;
  api)
    # 本机写操作版：静态 + /api/*（暂停/恢复/立即运行定时任务、刷新快照）
    ensure_build
    API_PORT="${API_PORT:-8091}"
    APIPID="$RUN/api.pid"
    if [ -f "$APIPID" ] && kill -0 "$(cat "$APIPID")" 2>/dev/null; then
      echo "API 已在运行（pid $(cat "$APIPID")）：http://127.0.0.1:${API_PORT}/"
      exit 4
    fi
    nohup python3.11 "$ROOT/tools/api.py" >"$RUN/api.log" 2>&1 &
    echo $! >"$APIPID"
    sleep 1
    echo "已启动：http://127.0.0.1:${API_PORT}/（写操作 token 在 $RUN/api_token，日志 $RUN/api.log）"
    echo "health: $(curl -s -m 3 http://127.0.0.1:${API_PORT}/api/health || echo '失败')"
    ;;
  api-stop)
    APIPID="$RUN/api.pid"
    if [ -f "$APIPID" ] && kill -0 "$(cat "$APIPID")" 2>/dev/null; then
      kill "$(cat "$APIPID")" && rm -f "$APIPID" && echo "API 已停止"
    else
      echo "API 没有在运行"
    fi
    ;;
  stop)
    if is_running; then
      kill "$(cat "$PIDFILE")" && rm -f "$PIDFILE"
      echo "已停止"
    else
      echo "没有在运行"
    fi
    ;;
  restart)
    "$0" stop || true
    sleep 0.5
    "$0" start
    ;;
  status)
    if is_running; then
      echo "运行中（pid $(cat "$PIDFILE")）：$URL → HTTP $(curl -s -o /dev/null -w '%{http_code}' "$URL")"
    else
      echo "未运行"
    fi
    ;;
  logs)
    tail -n "${2:-40}" "$LOG"
    ;;
  tunnel)
    echo "起 serveo 隧道（临时的，断了换一条）…"
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
      -o ServerAliveInterval=20 -R 80:localhost:"$PORT" serveo.net
    ;;
  *)
    echo "用法：$0 {start|stop|restart|status|logs|tunnel|api|api-stop}"
    exit 1
    ;;
esac