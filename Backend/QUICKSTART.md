# 快速启动指南

## 1. 安装依赖

```bash
cd Backend
npm install
```

## 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，确保 `CORS_ORIGIN` 指向你的前端地址（默认是 `http://localhost:3000`）。

## 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 4. 测试API

### 使用 curl 测试

```bash
# 健康检查
curl http://localhost:3001/health

# 获取所有地点
curl http://localhost:3001/api/v1/locations

# 创建地点
curl -X POST http://localhost:3001/api/v1/locations \
  -H "Content-Type: application/json" \
  -d '{"name": "主住所"}'

# 获取统计数据
curl http://localhost:3001/api/v1/stats/dashboard
```

### 使用 Postman 或 Insomnia

导入以下API集合：

- Base URL: `http://localhost:3001/api/v1`
- 所有接口都在 `/api/v1` 前缀下

## 5. 前端集成

在前端的 `StorageContext.tsx` 中，将 API 调用指向后端：

```typescript
const API_BASE_URL = 'http://localhost:3001/api/v1';

// 示例：获取所有地点
const response = await fetch(`${API_BASE_URL}/locations`);
const data = await response.json();
```

## 常见问题

### 端口被占用

如果 3001 端口被占用，修改 `.env` 文件中的 `PORT` 值。

### CORS 错误

确保 `.env` 文件中的 `CORS_ORIGIN` 设置正确，指向你的前端地址。

### 数据库错误

确保 `data/` 目录有写入权限。数据库文件会自动创建。

## 下一步

- 查看 [README.md](./README.md) 了解完整的API文档
- 查看 [API文档](./README.md#api文档) 了解所有可用接口
- 开始集成前端和后端
