import { Router } from 'express';
import { LocationController } from '../controllers/LocationController';
import { RoomController } from '../controllers/RoomController';
import { StorageController } from '../controllers/StorageController';
import { ItemController } from '../controllers/ItemController';
import { AlertController } from '../controllers/AlertController';
import { StatsController } from '../controllers/StatsController';
import { CategoryController } from '../controllers/CategoryController';
import { TagGroupController } from '../controllers/TagGroupController';
import { TagController } from '../controllers/TagController';

const router = Router();

// 地点路由
router.get('/locations', LocationController.getAll);
router.get('/locations/:id', LocationController.getById);
router.post('/locations', LocationController.create);
router.put('/locations/:id', LocationController.update);
router.delete('/locations/:id', LocationController.delete);

// 房间路由
router.get('/rooms', RoomController.getAll);
router.get('/rooms/:id', RoomController.getById);
router.post('/rooms', RoomController.create);
router.put('/rooms/:id', RoomController.update);
router.delete('/rooms/:id', RoomController.delete);

// 收纳位置路由
router.get('/storages', StorageController.getAll);
router.get('/storages/:id', StorageController.getById);
router.post('/storages', StorageController.create);
router.put('/storages/:id', StorageController.update);
router.delete('/storages/:id', StorageController.delete);

// 物品路由
router.get('/items', ItemController.getAll);
router.get('/items/:id', ItemController.getById);
router.get('/items/rfid/:rfid', ItemController.getByRfid);
router.post('/items', ItemController.create);
router.put('/items/:id', ItemController.update);
router.delete('/items/:id', ItemController.delete);
router.post('/items/batch-delete', ItemController.deleteMany);

// 提醒路由
router.get('/alerts', AlertController.getAll);

// 分类路由
router.get('/categories', CategoryController.getAll);
router.get('/categories/:id', CategoryController.getById);
router.post('/categories', CategoryController.create);
router.put('/categories/:id', CategoryController.update);
router.delete('/categories/:id', CategoryController.delete);

// 标签分组路由
router.get('/tag-groups', TagGroupController.getAll);
router.get('/tag-groups/:id', TagGroupController.getById);
router.post('/tag-groups', TagGroupController.create);
router.put('/tag-groups/:id', TagGroupController.update);
router.delete('/tag-groups/:id', TagGroupController.delete);

// 标签路由
router.get('/tags', TagController.getAll);
router.get('/tags/:id', TagController.getById);
router.post('/tags', TagController.create);
router.put('/tags/:id', TagController.update);
router.delete('/tags/:id', TagController.delete);

// 统计路由
router.get('/stats/dashboard', StatsController.getDashboard);

export default router;
