#!/usr/bin/env bash
# 发布到固定地址 https://jarvis.asia/hub/ （本机 nginx，产物在 /var/www/hermes-hub）
# 用法：./scripts/deploy-jarvis.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET=/var/www/hermes-hub
BASE_PATH=/hub

cd "$ROOT"

echo "1/4 采集 + 门禁 + 构建（basePath=$BASE_PATH）"
NEXT_PUBLIC_BASE_PATH="$BASE_PATH" npm run build

echo "2/4 同步产物到 $TARGET"
mkdir -p "$TARGET"
rsync -a --delete "$ROOT/out/" "$TARGET/"
chmod -R a+rX "$TARGET"

echo "3/4 校验 nginx 配置并重载"
nginx -t >/dev/null
systemctl reload nginx

echo "4/4 用 Host 头自检（绕开本机 hairpin）"
for p in /hub/ /hub/skills/ /hub/cron/; do
  code=$(curl -s -m 10 -k -o /dev/null -w "%{http_code}" --resolve jarvis.asia:443:127.0.0.1 "https://jarvis.asia$p" || true)
  echo "  $p -> $code"
  [ "$code" = "200" ] || { echo "  ✗ 未通过"; exit 1; }
done

echo "完成：https://jarvis.asia/hub/"