import { beforeAll, afterAll } from 'vitest';
import { initializeDatabase } from '../db/database';
import db from '../db/database';

beforeAll(() => {
  // 初始化测试数据库
  initializeDatabase();
});

afterAll(() => {
  // 关闭数据库连接
  db.close();
});
