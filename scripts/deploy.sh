#!/usr/bin/env bash
# 发布到固定地址 http://hub.120.24.177.192.nip.io/
# 原理：本机 nginx（/etc/nginx/conf.d/hermes-hub.conf）把该域名指到 /var/www/hermes-hub。
# nip.io 是泛解析，域名固定、不用备案、不依赖证书。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET=/var/www/hermes-hub
FIXED_HOST=hub.120.24.177.192.nip.io

cd "$ROOT"

echo "1/4 采集 + 门禁 + 构建（无 basePath）"
npm run build

echo "2/4 同步产物到 $TARGET"
rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -r "$ROOT/out/." "$TARGET/"
chmod -R a+rX "$TARGET"

echo "3/4 校验 nginx 并重载"
nginx -t >/dev/null
systemctl reload nginx
sleep 1

echo "4/4 用 Host 头自检（绕开本机 hairpin）"
for p in / /skills/ /cron/ /agents/; do
  code=$(curl -s -m 10 -o /dev/null -w "%{http_code}" -H "Host: $FIXED_HOST" "http://127.0.0.1$p" || true)
  echo "  $p -> $code"
  [ "$code" = "200" ] || { echo "  ✗ 未通过"; exit 1; }
done

echo "完成：http://$FIXED_HOST/"