# 仓鼠收纳 - 后端 API

仓鼠收纳的后端服务，提供 RESTful API 接口。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: SQLite (better-sqlite3)
- **验证**: Zod + Express Validator

## 功能特性

- ✅ 完整的CRUD操作（地点、房间、收纳位置、物品）
- ✅ RESTful API设计
- ✅ 数据验证和错误处理
- ✅ SQLite数据库持久化
- ✅ CORS支持
- ✅ 安全中间件（Helmet）
- ✅ 请求压缩
- ✅ 日志记录
- ✅ 智能提醒系统

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/storage.db
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api/v1
```

### 运行开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 初始化示例数据（可选）

首次使用或需要演示数据时，可执行种子脚本，写入一版基础数据：1 个地点、3 个房间、6 个收纳、3 个标签组、6 个标签、6 个分类、10 个示例物品。

```bash
npm run seed
```

- **幂等**：若已存在种子数据则会跳过，并提示「已初始化过」。
- **重新初始化**：需要清空种子数据并重新插入时，使用  
  `npm run seed -- --force`（仅建议在开发环境使用）。

### 构建生产版本

```bash
npm run build
npm start
```

## API文档

### 基础信息

- **Base URL**: `http://localhost:3001/api/v1`
- **Content-Type**: `application/json`
- **响应格式**: 
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

### 地点 (Locations)

#### 获取所有地点
```
GET /locations
```

#### 获取单个地点
```
GET /locations/:id
```

#### 创建地点
```
POST /locations
Body: {
  "name": "主住所",
  "icon": "home"
}
```

#### 更新地点
```
PUT /locations/:id
Body: {
  "name": "新名称",
  "icon": "building"
}
```

#### 删除地点
```
DELETE /locations/:id
```

### 房间 (Rooms)

#### 获取所有房间
```
GET /rooms
GET /rooms?locationId=loc_xxx
```

#### 获取单个房间
```
GET /rooms/:id
```

#### 创建房间
```
POST /rooms
Body: {
  "name": "卧室",
  "locationId": "loc_xxx",
  "icon": "door"
}
```

#### 更新房间
```
PUT /rooms/:id
Body: {
  "name": "新名称"
}
```

#### 删除房间
```
DELETE /rooms/:id
```

### 收纳位置 (Storages)

#### 获取所有收纳位置
```
GET /storages
GET /storages?roomId=room_xxx
```

#### 获取单个收纳位置
```
GET /storages/:id
```

#### 创建收纳位置
```
POST /storages
Body: {
  "name": "衣柜",
  "roomId": "room_xxx",
  "description": "主卧衣柜",
  "icon": "archive"
}
```

#### 更新收纳位置
```
PUT /storages/:id
Body: {
  "name": "新名称",
  "description": "新描述"
}
```

#### 删除收纳位置
```
DELETE /storages/:id
```

### 物品 (Items)

#### 获取所有物品
```
GET /items
GET /items?storageId=stor_xxx
GET /items?search=关键词
GET /items?category=电子产品
GET /items?tag=重要
```

#### 获取单个物品
```
GET /items/:id
```

#### 通过RFID获取物品
```
GET /items/rfid/:rfid
```

#### 创建物品
```
POST /items
Body: {
  "name": "蓝牙耳机",
  "description": "无线蓝牙耳机",
  "storageId": "stor_xxx",
  "category": "电子产品",
  "brand": "Apple",
  "color": "#000000",
  "price": 999.00,
  "purchaseDate": "2024-01-01",
  "depreciationRate": 20,
  "expiryDate": "2025-01-01",
  "quantity": 1,
  "unit": "件",
  "minThreshold": 1,
  "maxThreshold": 5,
  "rfid": "RFID-123456",
  "barcode": "1234567890",
  "images": ["base64..."],
  "attributes": {
    "型号": "AirPods Pro",
    "颜色": "白色"
  },
  "tags": ["电子产品", "重要"]
}
```

#### 更新物品
```
PUT /items/:id
Body: {
  "quantity": 2,
  "price": 899.00
}
```

#### 删除物品
```
DELETE /items/:id
```

#### 批量删除物品
```
POST /items/batch-delete
Body: {
  "ids": ["item_1", "item_2", "item_3"]
}
```

### 提醒 (Alerts)

#### 获取所有提醒
```
GET /alerts
```

返回所有过期、即将过期、库存不足、库存过多的提醒。

## 数据库结构

### locations 表
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `type` (TEXT DEFAULT 'location')
- `icon` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### rooms 表
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `type` (TEXT DEFAULT 'room')
- `location_id` (TEXT NOT NULL, FOREIGN KEY)
- `icon` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### storages 表
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `type` (TEXT DEFAULT 'storage')
- `room_id` (TEXT NOT NULL, FOREIGN KEY)
- `description` (TEXT)
- `icon` (TEXT)
- `created_at` (TEXT)
- `updated_at` (TEXT)

### items 表
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `description` (TEXT)
- `storage_id` (TEXT NOT NULL, FOREIGN KEY)
- `category` (TEXT)
- `brand` (TEXT)
- `color` (TEXT)
- `price` (REAL)
- `purchase_date` (TEXT)
- `depreciation_rate` (REAL)
- `expiry_date` (TEXT)
- `quantity` (INTEGER DEFAULT 1)
- `unit` (TEXT DEFAULT '件')
- `min_threshold` (INTEGER)
- `max_threshold` (INTEGER)
- `rfid` (TEXT)
- `barcode` (TEXT)
- `images` (TEXT, JSON格式)
- `attributes` (TEXT, JSON格式)
- `tags` (TEXT, JSON格式)
- `created_at` (TEXT)
- `updated_at` (TEXT)

## 错误处理

所有错误响应格式：

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见HTTP状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

## 开发

### 项目结构

```
Backend/
├── src/
│   ├── controllers/     # 控制器
│   ├── models/          # 数据模型
│   ├── routes/           # 路由
│   ├── middleware/       # 中间件
│   ├── db/              # 数据库
│   ├── types/           # TypeScript类型
│   └── index.ts         # 入口文件
├── data/                # 数据库文件目录
├── dist/                # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

### 添加新功能

1. 在 `models/` 中创建数据模型
2. 在 `controllers/` 中创建控制器
3. 在 `routes/index.ts` 中添加路由
4. 在 `types/index.ts` 中添加类型定义

## 部署

### 使用PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name storage-api
```

### 使用Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## 性能优化

- 数据库索引已创建在常用查询字段上
- 使用连接池管理数据库连接
- 响应压缩减少传输大小
- 外键约束保证数据完整性

## 安全

- Helmet中间件设置安全HTTP头
- CORS配置限制跨域请求
- 输入验证防止SQL注入
- 参数化查询防止注入攻击

## 许可证

MIT License
