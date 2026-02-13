import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from '../../db/database';
import routes from '../../routes';
import { errorHandler } from '../../middleware/errorHandler';

// 加载环境变量
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/v1', routes);
app.use(errorHandler);

describe('API Integration Tests', () => {
  beforeAll(() => {
    initializeDatabase();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Locations API', () => {
    let locationId: string;

    it('should create a location', async () => {
      const response = await request(app)
        .post('/api/v1/locations')
        .send({ name: '测试地点' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试地点');
      locationId = response.body.data.id;
    });

    it('should get all locations', async () => {
      const response = await request(app)
        .get('/api/v1/locations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get location by id', async () => {
      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(locationId);
    });

    it('should update location', async () => {
      const response = await request(app)
        .put(`/api/v1/locations/${locationId}`)
        .send({ name: '更新后的名称' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('更新后的名称');
    });

    it('should delete location', async () => {
      const response = await request(app)
        .delete(`/api/v1/locations/${locationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Items API', () => {
    let locationId: string;
    let roomId: string;
    let storageId: string;
    let itemId: string;

    beforeAll(async () => {
      // 创建测试数据
      const locationRes = await request(app)
        .post('/api/v1/locations')
        .send({ name: '测试地点' });
      locationId = locationRes.body.data.id;

      const roomRes = await request(app)
        .post('/api/v1/rooms')
        .send({ name: '测试房间', locationId });
      roomId = roomRes.body.data.id;

      const storageRes = await request(app)
        .post('/api/v1/storages')
        .send({ name: '测试收纳', roomId });
      storageId = storageRes.body.data.id;
    });

    it('should create an item', async () => {
      const response = await request(app)
        .post('/api/v1/items')
        .send({
          name: '测试物品',
          storageId,
          quantity: 1,
          price: 100,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('测试物品');
      itemId = response.body.data.id;
    });

    it('should get items by storage', async () => {
      const response = await request(app)
        .get(`/api/v1/items?storageId=${storageId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get alerts', async () => {
      const response = await request(app)
        .get('/api/v1/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
