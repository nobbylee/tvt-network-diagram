#!/bin/sh
set -e

mkdir -p "${DATA_DIR:-/data}"

cd /app/server
node dist/index.js &
API_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

term() {
  kill -TERM "$API_PID" "$NGINX_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  wait "$NGINX_PID" 2>/dev/null || true
}
trap term INT TERM

# 轮询等待任一进程退出
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 1
done

term
exit 1
