# 家庭收纳 - Docker 多阶段构建
# 前端 Vite + React，后端 Express + SQLite，单容器运行

# ========== 阶段 1：构建前端 ==========
FROM node:20-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
COPY Frontend/ .
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ========== 阶段 2：构建后端（TypeScript 编译） ==========
FROM node:20-bookworm-slim AS backend
WORKDIR /app/backend
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci
COPY Backend/ .
RUN npm run build

# ========== 阶段 3：运行镜像 ==========
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# 仅安装生产依赖（better-sqlite3 在当前环境编译）
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev

# 拷贝后端编译产物与前端静态
COPY --from=backend /app/backend/dist ./dist
COPY --from=frontend /app/frontend/build ./public

ENV NODE_ENV=production
ENV PORT=3847
EXPOSE 3847

# 数据持久化：挂载到 /app/data
VOLUME ["/app/data"]
ENV DATABASE_PATH=/app/data/storage.db

# 同源部署，CORS 可留空或与前端同域
ENV CORS_ORIGIN=

CMD ["node", "dist/index.js"]
