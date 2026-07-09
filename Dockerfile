# 前端构建
FROM node:22-bookworm AS web-build
WORKDIR /app/web
COPY packages/web/package.json packages/web/package-lock.json ./
RUN npm ci
COPY packages/web/ ./
# 生产环境通过 nginx 反代 /api，前端请求同源相对路径
ENV VITE_API_BASE=
RUN npm run build

# 后端构建
FROM node:22-bookworm AS server-build
WORKDIR /app/server
COPY packages/server/package.json packages/server/package-lock.json ./
RUN npm ci
COPY packages/server/ ./
RUN npm run build

# 运行镜像：API + 静态前端（nginx）
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    ca-certificates \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 后端运行时依赖（含 better-sqlite3 原生模块）
COPY packages/server/package.json packages/server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev
COPY --from=server-build /app/server/dist ./dist

WORKDIR /app
COPY --from=web-build /app/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=3001 \
    HOST=0.0.0.0 \
    JWT_SECRET=tvt-change-me-in-production \
    DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
