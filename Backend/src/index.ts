import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/database';
import routes from './routes';
import movingRoutes from './routes/moving';
import { initializeMoving } from './services/moving';
import { errorHandler } from './middleware/errorHandler';
import { initializeWorkspace } from './services/workspace';
import { mcpRouter } from './mcp/http';
import { mcpInfoRouter } from './routes/mcpInfo';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 初始化数据库
initializeDatabase();
initializeMoving();
initializeWorkspace();

// 中间件
app.use(helmet()); // 安全头
app.use(compression()); // 压缩响应
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API路由
app.use(API_PREFIX, routes);
app.use('/api', movingRoutes);
app.use('/api/mcp', mcpInfoRouter());
app.use('/mcp', mcpRouter());

// 生产环境：提供前端静态资源（Docker 部署时前端 build 拷贝到 public）
const publicPath = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 404处理（无静态资源或未匹配到文件时）
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: '接口不存在' 
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const httpServer = app.listen(PORT, () => {
  const address = httpServer.address();
  const actualPort = address && typeof address === 'object' ? address.port : PORT;
  console.log(`🚀 服务器运行在 http://localhost:${actualPort}`);
  console.log(`📡 API前缀: ${API_PREFIX}`);
  console.log(`💾 数据库路径: ${process.env.DATABASE_PATH || './data/storage.db'}`);
});
