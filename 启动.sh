#!/bin/bash
# 不用 docker-compose，只用 docker 构建并运行（适合没有安装 Compose 的 NAS）
# 在项目目录下执行：bash 启动.sh
# 若 NAS 是 Intel/AMD（x86），把下面两处 linux/arm64 改成 linux/amd64

set -e
cd "$(dirname "$0")"

PLATFORM=linux/arm64
echo "正在构建镜像（首次约 20～40 分钟，平台: $PLATFORM）..."
docker build --platform "$PLATFORM" -t ws-scrcpy .

echo "停止并删除旧容器（若存在）..."
docker rm -f ws-scrcpy 2>/dev/null || true

echo "启动容器..."
docker run -d \
  --name ws-scrcpy \
  --platform "$PLATFORM" \
  -p 8000:8000 \
  -v "$(pwd)/config.yaml:/app/config.yaml:ro" \
  -e WS_SCRCPY_CONFIG=/app/config.yaml \
  --restart unless-stopped \
  ws-scrcpy

echo "完成。浏览器访问: http://本机IP:8000"
