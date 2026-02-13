# 家庭收纳管理系统

一个现代化的家庭收纳工具，像维护文件系统一样管理你的家庭物品。

## 项目结构

```
收纳/
├── Frontend/          # React + TypeScript 前端
├── Backend/           # Node.js + Express 后端
├── TESTING.md         # 测试文档
└── INTEGRATION.md     # 集成指南
```

## 快速开始

### 1. 启动后端

```bash
cd Backend
npm install
npm run dev
```

后端服务运行在 `http://localhost:3001`

（可选）初始化示例数据（地点、房间、收纳、分类、标签与示例物品）：在 `Backend` 目录下执行 `npm run seed`。详见 [Backend README](./Backend/README.md) 中的「初始化示例数据」一节。

### 2. 启动前端

```bash
cd Frontend
npm install
cp .env.example .env  # 如果.env不存在
npm run dev
```

前端应用运行在 `http://localhost:3000`

## 功能特性

### 核心功能
- ✅ 多层储物空间管理（地点→房间→收纳位置）
- ✅ 物品管理（属性、价格、折旧、过期时间等）
- ✅ 智能提醒系统（过期、库存阈值）
- ✅ 标签打印功能
- ✅ RFID扫描和管理
- ✅ 场景化收纳模式
- ✅ 数字孪生视图
- ✅ 数据导入导出
- ✅ 批量操作
- ✅ 数据统计和图表分析

### 技术特性
- ✅ 前后端分离架构
- ✅ RESTful API设计
- ✅ 响应式设计（完美支持手机）
- ✅ 完整的单元测试和集成测试
- ✅ TypeScript类型安全
- ✅ SQLite数据库持久化

## 移动端优化

- **响应式布局**: 完美适配手机、平板、桌面
- **触摸优化**: 大触摸区域，流畅的交互
- **性能优化**: 快速加载，流畅滚动
- **离线提示**: 网络错误时显示友好提示

## 测试

### 前端测试
```bash
cd Frontend
npm test              # 运行测试
npm run test:ui       # 测试UI
npm run test:coverage # 测试覆盖率
```

### 后端测试
```bash
cd Backend
npm test              # 运行测试
npm run test:ui       # 测试UI
npm run test:coverage # 测试覆盖率
```

详细测试文档请查看 [TESTING.md](./TESTING.md)

## 开发

### 环境变量

**前端** (`.env`):
```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

**后端** (`.env`):
```
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/storage.db
CORS_ORIGIN=http://localhost:3000
API_PREFIX=/api/v1
```

### 构建

**前端**:
```bash
cd Frontend
npm run build
```

**后端**:
```bash
cd Backend
npm run build
npm start
```

## 文档

- [测试文档](./TESTING.md) - 测试指南和示例
- [集成指南](./INTEGRATION.md) - 前后端集成说明
- [后端API文档](./Backend/README.md) - 完整的API文档
- [前端文档](./Frontend/README.md) - 前端使用指南

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Recharts
- Vitest

### 后端
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Vitest + Supertest

## 许可证

MIT License
