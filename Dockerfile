##
# 多阶段构建：不编译 scrcpy server，使用项目自带的 scrcpy-server.jar。
# 1) 构建 ws-scrcpy 前端
# 2) 运行镜像（Ubuntu + apt 安装 adb，保证与 NAS 架构一致，避免 exec format error）
##

FROM node:20-bookworm AS ws-builder

WORKDIR /work

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci

COPY . .
# 使用项目自带的 vendor/Genymobile/scrcpy/scrcpy-server.jar，不编译
RUN npm run dist

# 在构建阶段安装 dist 的运行时依赖（含 node-pty），此处有 Python/g++ 可编译原生模块
RUN cd /work/dist && npm install --omit=dev


# 运行阶段：用 Ubuntu 22.04，apt 安装 adb（android-tools-adb），保证与当前 CPU 一致，避免 exec format error
FROM ubuntu:22.04 AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && apt-get install -y --no-install-recommends android-tools-adb \
  && rm -rf /var/lib/apt/lists/*

COPY --from=ws-builder /work/dist/ ./dist/

ENV NODE_ENV=production
ENV WS_SCRCPY_CONFIG=/app/config.yaml

EXPOSE 8000

WORKDIR /app/dist
CMD ["npm","start"]
