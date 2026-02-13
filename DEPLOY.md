# 家庭收纳 - Docker 部署说明

应用为前后端一体单容器：前端静态由后端 Express 提供，API 前缀 `/api/v1`，数据库为 SQLite（文件持久化）。

## 一、本地构建与运行

### 使用 Docker Compose（推荐）

在项目根目录（与 `docker-compose.yml` 同级）执行：

```bash
# 构建并后台运行
docker compose up -d --build

# 查看日志
docker compose logs -f app
```

- 访问地址：**http://localhost:3847**
- 数据目录：Docker volume `storage-data`，对应容器内 `/app/data`（SQLite 文件 `storage.db`）

### 仅用 Docker 命令

```bash
# 构建镜像
docker build -t storage-app:latest .

# 运行（端口 3847，数据挂载到当前目录 ./data）
docker run -d --name storage-app -p 3847:3847 \
  -v "$(pwd)/data:/app/data" \
  -e NODE_ENV=production \
  storage-app:latest
```

## 二、通过 GitHub Release 发布镜像（推荐用于云服务器）

代码推送到 GitHub 后，每次**创建 Release** 会自动构建并推送 Docker 镜像到 **GitHub Container Registry (ghcr.io)**，无需在服务器上拉代码或本地构建。

### 1. 在 GitHub 上创建 Release 并生成镜像

1. 将本仓库推送到 GitHub（若尚未推送）。
2. 打开仓库页面 → **Releases** → **Create a new release**。
3. 选择或新建一个 tag（例如 `v1.0.0`），填写 Release 标题与说明，点击 **Publish release**。
4. 打开 **Actions** 页，等待 “Build and push Docker image on release” 工作流跑完（约 2～5 分钟）。
5. 镜像地址格式：`ghcr.io/<你的用户名>/<仓库名>:latest` 或 `ghcr.io/<你的用户名>/<仓库名>:v1.0.0`。  
   在仓库首页右侧 **Packages** 里也能看到刚发布的镜像。

### 2. 在云服务器上拉取并运行

**公开仓库**（任何人可拉取镜像）：

```bash
# 拉取最新镜像（或把 latest 换成具体版本如 v1.0.0）
docker pull ghcr.io/<你的用户名>/<仓库名>:latest

# 运行（端口 3847，数据挂到当前目录 ./data）
docker run -d --name storage-app -p 3847:3847 \
  -v "$(pwd)/data:/app/data" \
  -e NODE_ENV=production \
  -e PORT=3847 \
  ghcr.io/<你的用户名>/<仓库名>:latest
```

**私有仓库**：需先登录再拉取。在 GitHub → Settings → Developer settings → Personal access tokens 创建有 `read:packages` 的 token，在服务器上执行：

```bash
echo "你的PAT" | docker login ghcr.io -u <你的用户名> --password-stdin
docker pull ghcr.io/<你的用户名>/<仓库名>:latest
# 再执行上面的 docker run
```

使用 **docker-compose** 且只用镜像不本地构建时，可新建 `docker-compose.prod.yml`（或任意文件名），内容示例：

```yaml
name: storage-app
services:
  app:
    image: ghcr.io/<你的用户名>/<仓库名>:latest  # 改成你的镜像地址
    container_name: storage-app
    ports:
      - "3847:3847"
    environment:
      NODE_ENV: production
      PORT: 3847
      DATABASE_PATH: /app/data/storage.db
    volumes:
      - storage-data:/app/data
    restart: unless-stopped
volumes:
  storage-data:
```

在服务器上执行：`docker compose -f docker-compose.prod.yml up -d`。

---

## 三、服务器部署（本地构建方式）

### 1. 准备环境

- 已安装 Docker 与 Docker Compose（或 Docker Compose V2：`docker compose`）
- 如需对外通过 80/443 访问，可再配合 Nginx 做反向代理

### 2. 上传与构建

将项目代码上传到服务器（或从 Git 拉取），在项目根目录执行：

```bash
docker compose up -d --build
```

### 3. 使用 Nginx 反代（可选，同「二」中部署方式）

若希望通过域名或 80 端口访问，可在宿主机安装 Nginx，并添加站点配置（示例）：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改为你的域名或 IP

    location / {
        proxy_pass http://127.0.0.1:3847;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

重载 Nginx 后，访问 `http://your-domain.com` 即可。

### 4. HTTPS（可选，同「二」中部署方式）

- 使用 **Let's Encrypt + certbot** 在 Nginx 上配置 SSL，或  
- 在 Nginx 前再加一层 Caddy/Traefik 做自动 HTTPS。

## 三、环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 服务端口 | `3847` |
| `NODE_ENV` | 运行环境 | 生产建议 `production` |
| `DATABASE_PATH` | SQLite 数据库文件路径 | `/app/data/storage.db` |
| `CORS_ORIGIN` | 允许的跨域来源（同源部署可留空） | - |
| `API_PREFIX` | API 路径前缀 | `/api/v1` |

在 `docker-compose.yml` 的 `environment` 中按需覆盖即可。

## 四、数据与备份

- 数据库文件位于 volume `storage-data` 或挂载目录下的 `storage.db`。
- 备份：复制该文件即可（建议先停止写入或使用 SQLite 备份命令）。
- 迁移：将 `storage.db` 放到新环境的 `/app/data` 并重启容器。

## 五、常用命令

```bash
# 停止
docker compose down

# 仅停止不删 volume（保留数据）
docker compose stop

# 查看运行状态
docker compose ps

# 进入容器
docker compose exec app sh
```
