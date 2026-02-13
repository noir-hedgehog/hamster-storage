# 故障排除指南

## better-sqlite3 编译错误

如果遇到 `better-sqlite3` 编译错误（特别是 Node.js v25+），有以下解决方案：

### 方案 1：使用 Node.js LTS 版本（推荐）

Node.js v25 是非常新的版本，建议使用 LTS 版本：

```bash
# 使用 nvm 安装 LTS 版本
nvm install --lts
nvm use --lts

# 或者安装特定版本
nvm install 20
nvm use 20

# 然后重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 方案 2：更新 better-sqlite3 到最新版本

已更新 package.json 中的 better-sqlite3 到最新版本。如果仍有问题：

```bash
npm install better-sqlite3@latest
```

### 方案 3：配置 C++ 编译器

如果必须使用 Node.js v25，可以配置编译器使用 C++20：

```bash
# macOS
export CXXFLAGS="-std=c++20"
export CPPFLAGS="-std=c++20"

# 然后重新安装
npm install
```

或者创建 `.npmrc` 文件（已创建）：
```
CXXFLAGS=-std=c++20
```

### 方案 4：使用预编译版本

```bash
npm install better-sqlite3 --build-from-source=false
```

### 方案 5：使用替代数据库（如果以上都不行）

如果 better-sqlite3 持续有问题，可以考虑使用其他数据库：

#### 选项 A：使用 sql.js（纯 JavaScript SQLite）

```bash
npm uninstall better-sqlite3
npm install sql.js
```

然后修改 `src/db/database.ts` 使用 sql.js。

#### 选项 B：使用 PostgreSQL

```bash
npm uninstall better-sqlite3
npm install pg
```

## 其他常见问题

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3001

# 杀死进程
kill -9 <PID>

# 或修改 .env 中的 PORT
```

### CORS 错误

确保 `.env` 文件中的 `CORS_ORIGIN` 设置正确：

```env
CORS_ORIGIN=http://localhost:3000
```

### 数据库权限错误

确保 `data/` 目录有写入权限：

```bash
mkdir -p data
chmod 755 data
```

### TypeScript 编译错误

```bash
# 清理并重新编译
rm -rf dist
npm run build
```

## 获取帮助

如果问题仍然存在，请检查：
1. Node.js 版本：`node -v`（推荐使用 18.x 或 20.x LTS）
2. npm 版本：`npm -v`
3. 操作系统和架构：`uname -a`
4. 错误日志：查看完整的错误信息
