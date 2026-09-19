import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSpace } from '../models/SpaceModel';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/storage.db');
const dbDir = path.dirname(dbPath);

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: InstanceType<typeof Database> = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建表结构
export function initializeDatabase() {
  // 地点表
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'location',
      icon TEXT,
      map_x REAL,
      map_y REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 房间表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'room',
      location_id TEXT NOT NULL,
      icon TEXT,
      floorplan_x REAL,
      floorplan_y REAL,
      floorplan_width REAL,
      floorplan_height REAL,
      floorplan_rotation REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    )
  `);

  // 收纳位置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS storages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'storage',
      room_id TEXT NOT NULL,
      parent_storage_id TEXT,
      description TEXT,
      icon TEXT,
      floorplan_x REAL,
      floorplan_y REAL,
      floorplan_width REAL,
      floorplan_height REAL,
      floorplan_rotation REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_storage_id) REFERENCES storages(id) ON DELETE CASCADE
    )
  `);

  // 分类表（支持层级嵌套）
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_category_id TEXT,
      icon TEXT,
      description TEXT,
      attributes_template TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // 标签分组表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tag_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      icon TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag_group_id TEXT,
      color TEXT,
      icon TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tag_group_id) REFERENCES tag_groups(id) ON DELETE SET NULL
    )
  `);

  // 物品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      storage_id TEXT NOT NULL,
      category_id TEXT,
      brand TEXT,
      color TEXT,
      price REAL,
      purchase_date TEXT,
      depreciation_rate REAL,
      expiry_date TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit TEXT DEFAULT '件',
      min_threshold INTEGER,
      max_threshold INTEGER,
      rfid TEXT,
      barcode TEXT,
      images TEXT,
      attributes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (storage_id) REFERENCES storages(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // 物品标签关联表（多对多）
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (item_id, tag_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // 数据库迁移：为 storages 表添加 parent_storage_id 列（如果不存在）
  try {
    const checkColumn = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('storages') 
      WHERE name = 'parent_storage_id'
    `);
    const result = checkColumn.get() as { count: number };
    
    if (result.count === 0) {
      console.log('正在迁移数据库：添加 parent_storage_id 列...');
      db.exec(`
        ALTER TABLE storages 
        ADD COLUMN parent_storage_id TEXT;
      `);
      console.log('数据库迁移完成：已添加 parent_storage_id 列');
    }
  } catch (error) {
    console.warn('检查 parent_storage_id 列时出错，可能表不存在:', error);
  }

  // 数据库迁移：更新 items 表结构
  try {
    // 检查 category_id 列是否存在
    const checkCategoryId = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('items') 
      WHERE name = 'category_id'
    `);
    const categoryIdResult = checkCategoryId.get() as { count: number };
    
    if (categoryIdResult.count === 0) {
      console.log('正在迁移数据库：更新 items 表结构...');
      // 添加 category_id 列
      db.exec(`ALTER TABLE items ADD COLUMN category_id TEXT;`);
      
      // 如果存在旧的 category 列，尝试迁移数据（这里先保留，后续可以手动迁移）
      // 注意：旧的 category 是文本，新的 category_id 是 ID，需要手动映射
      
      console.log('数据库迁移完成：已添加 category_id 列');
    }
  } catch (error) {
    console.warn('检查 category_id 列时出错:', error);
  }

  // 数据库迁移：为 categories 表添加 attributes_template 列
  try {
    const checkAttrTemplate = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('categories') 
      WHERE name = 'attributes_template'
    `);
    const attrTemplateResult = checkAttrTemplate.get() as { count: number };
    
    if (attrTemplateResult.count === 0) {
      console.log('正在迁移数据库：添加 attributes_template 列...');
      db.exec(`ALTER TABLE categories ADD COLUMN attributes_template TEXT;`);
      console.log('数据库迁移完成：已添加 attributes_template 列');
    }
  } catch (error) {
    console.warn('检查 attributes_template 列时出错:', error);
  }

  // 数据库迁移：为 locations 表添加地图坐标列
  try {
    const checkMapX = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('locations') 
      WHERE name = 'map_x'
    `);
    const mapXResult = checkMapX.get() as { count: number };
    
    if (mapXResult.count === 0) {
      console.log('正在迁移数据库：为 locations 表添加地图坐标列...');
      db.exec(`
        ALTER TABLE locations ADD COLUMN map_x REAL;
        ALTER TABLE locations ADD COLUMN map_y REAL;
      `);
      console.log('数据库迁移完成：已添加地图坐标列');
    }
  } catch (error) {
    console.warn('检查地图坐标列时出错:', error);
  }

  // 数据库迁移：为 rooms 表添加平面图布局列
  try {
    const checkFloorplanX = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('rooms') 
      WHERE name = 'floorplan_x'
    `);
    const floorplanXResult = checkFloorplanX.get() as { count: number };
    
    if (floorplanXResult.count === 0) {
      console.log('正在迁移数据库：为 rooms 表添加平面图布局列...');
      db.exec(`
        ALTER TABLE rooms ADD COLUMN floorplan_x REAL;
        ALTER TABLE rooms ADD COLUMN floorplan_y REAL;
        ALTER TABLE rooms ADD COLUMN floorplan_width REAL;
        ALTER TABLE rooms ADD COLUMN floorplan_height REAL;
        ALTER TABLE rooms ADD COLUMN floorplan_rotation REAL DEFAULT 0;
      `);
      console.log('数据库迁移完成：已添加平面图布局列');
    }
  } catch (error) {
    console.warn('检查平面图布局列时出错:', error);
  }

  // 数据库迁移：为 storages 表添加平面图布局列
  try {
    const checkStorageFloorplanX = db.prepare(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('storages') 
      WHERE name = 'floorplan_x'
    `);
    const storageFloorplanXResult = checkStorageFloorplanX.get() as { count: number };
    
    if (storageFloorplanXResult.count === 0) {
      console.log('正在迁移数据库：为 storages 表添加平面图布局列...');
      db.exec(`
        ALTER TABLE storages ADD COLUMN floorplan_x REAL;
        ALTER TABLE storages ADD COLUMN floorplan_y REAL;
        ALTER TABLE storages ADD COLUMN floorplan_width REAL;
        ALTER TABLE storages ADD COLUMN floorplan_height REAL;
        ALTER TABLE storages ADD COLUMN floorplan_rotation REAL DEFAULT 0;
      `);
      console.log('数据库迁移完成：已为 storages 添加平面图布局列');
    }
  } catch (error) {
    console.warn('检查 storages 平面图布局列时出错:', error);
  }

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_storage_id ON items(storage_id);
    CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
    CREATE INDEX IF NOT EXISTS idx_items_rfid ON items(rfid);
    CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON items(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_rooms_location_id ON rooms(location_id);
    CREATE INDEX IF NOT EXISTS idx_storages_room_id ON storages(room_id);
    CREATE INDEX IF NOT EXISTS idx_storages_parent_id ON storages(parent_storage_id);
    CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_category_id);
    CREATE INDEX IF NOT EXISTS idx_tags_group_id ON tags(tag_group_id);
    CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
    CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);
  `);

  initializeSpace();
  console.error('数据库初始化完成');
}

export default db;
