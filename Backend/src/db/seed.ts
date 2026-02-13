/**
 * 初始化示例数据：地点、房间、收纳、标签分组、标签、分类、物品。
 * 幂等：若已存在种子数据（loc_seed_1）则跳过。
 * 执行：npm run seed
 */
import db from './database';
import { initializeDatabase } from './database';

const SEED_LOCATION_ID = 'loc_seed_1';

function hasSeedData(): boolean {
  const row = db.prepare('SELECT 1 FROM locations WHERE id = ?').get(SEED_LOCATION_ID);
  return !!row;
}

function runSeed() {
  const now = new Date().toISOString();

  // 1. Location
  db.prepare(`
    INSERT INTO locations (id, name, type, icon, created_at, updated_at)
    VALUES (?, '我家', 'location', NULL, ?, ?)
  `).run(SEED_LOCATION_ID, now, now);

  // 2. Rooms
  const roomIds = ['room_seed_1', 'room_seed_2', 'room_seed_3'];
  const roomNames = ['客厅', '卧室', '厨房'];
  const roomStmt = db.prepare(`
    INSERT INTO rooms (id, name, type, location_id, icon, created_at, updated_at)
    VALUES (?, ?, 'room', ?, NULL, ?, ?)
  `);
  roomIds.forEach((id, i) => roomStmt.run(id, roomNames[i], SEED_LOCATION_ID, now, now));

  // 3. Storages (客厅 2, 卧室 2, 厨房 2)
  const storages: [string, string, string][] = [
    ['storage_seed_1', '电视柜', 'room_seed_1'],
    ['storage_seed_2', '茶几抽屉', 'room_seed_1'],
    ['storage_seed_3', '衣柜', 'room_seed_2'],
    ['storage_seed_4', '床头柜', 'room_seed_2'],
    ['storage_seed_5', '橱柜', 'room_seed_3'],
    ['storage_seed_6', '冰箱', 'room_seed_3'],
  ];
  const storageStmt = db.prepare(`
    INSERT INTO storages (id, name, type, room_id, parent_storage_id, description, icon, created_at, updated_at)
    VALUES (?, ?, 'storage', ?, NULL, NULL, NULL, ?, ?)
  `);
  storages.forEach(([id, name, roomId]) => storageStmt.run(id, name, roomId, now, now));

  // 4. Tag groups
  const tagGroups: [string, string, string | null][] = [
    ['tg_seed_1', '使用频率', '#3B82F6'],
    ['tg_seed_2', '季节', '#10B981'],
    ['tg_seed_3', '材质', '#8B5CF6'],
  ];
  const tgStmt = db.prepare(`
    INSERT INTO tag_groups (id, name, color, icon, description, created_at, updated_at)
    VALUES (?, ?, ?, NULL, NULL, ?, ?)
  `);
  tagGroups.forEach(([id, name, color]) => tgStmt.run(id, name, color, now, now));

  // 5. Tags
  const tags: [string, string, string][] = [
    ['tag_seed_1', '常用', 'tg_seed_1'],
    ['tag_seed_2', '少用', 'tg_seed_1'],
    ['tag_seed_3', '春夏', 'tg_seed_2'],
    ['tag_seed_4', '秋冬', 'tg_seed_2'],
    ['tag_seed_5', '塑料', 'tg_seed_3'],
    ['tag_seed_6', '金属', 'tg_seed_3'],
  ];
  const tagStmt = db.prepare(`
    INSERT INTO tags (id, name, tag_group_id, color, icon, created_at, updated_at)
    VALUES (?, ?, ?, NULL, NULL, ?, ?)
  `);
  tags.forEach(([id, name, groupId]) => tagStmt.run(id, name, groupId, now, now));

  // 6. Categories (层级：电子设备->手机/电脑，日用品->清洁/厨具)
  const categories: [string, string, string | null][] = [
    ['cat_seed_1', '电子设备', null],
    ['cat_seed_2', '手机', 'cat_seed_1'],
    ['cat_seed_3', '电脑', 'cat_seed_1'],
    ['cat_seed_4', '日用品', null],
    ['cat_seed_5', '清洁', 'cat_seed_4'],
    ['cat_seed_6', '厨具', 'cat_seed_4'],
  ];
  const catStmt = db.prepare(`
    INSERT INTO categories (id, name, parent_category_id, icon, description, attributes_template, created_at, updated_at)
    VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?)
  `);
  categories.forEach(([id, name, parentId]) => catStmt.run(id, name, parentId, now, now));

  // 7. Items
  const items: Array<{
    id: string;
    name: string;
    description: string | null;
    storage_id: string;
    category_id: string | null;
    price: number | null;
    quantity: number;
    unit: string;
    expiry_date: string | null;
    tag_ids: string[];
  }> = [
    { id: 'item_seed_1', name: '蓝牙耳机', description: '无线入耳式', storage_id: 'storage_seed_1', category_id: 'cat_seed_2', price: 299, quantity: 1, unit: '件', expiry_date: null, tag_ids: ['tag_seed_1'] },
    { id: 'item_seed_2', name: '充电器', description: '手机快充', storage_id: 'storage_seed_1', category_id: 'cat_seed_2', price: 89, quantity: 2, unit: '个', expiry_date: null, tag_ids: ['tag_seed_1'] },
    { id: 'item_seed_3', name: '笔记本电脑', description: '办公用', storage_id: 'storage_seed_2', category_id: 'cat_seed_3', price: 5999, quantity: 1, unit: '台', expiry_date: null, tag_ids: ['tag_seed_1', 'tag_seed_6'] },
    { id: 'item_seed_4', name: 'T恤', description: '纯棉', storage_id: 'storage_seed_3', category_id: null, price: null, quantity: 5, unit: '件', expiry_date: null, tag_ids: ['tag_seed_3'] },
    { id: 'item_seed_5', name: '羽绒服', description: '冬季', storage_id: 'storage_seed_3', category_id: null, price: 499, quantity: 1, unit: '件', expiry_date: null, tag_ids: ['tag_seed_4'] },
    { id: 'item_seed_6', name: '闹钟', description: '床头闹钟', storage_id: 'storage_seed_4', category_id: null, price: 49, quantity: 1, unit: '个', expiry_date: null, tag_ids: ['tag_seed_1'] },
    { id: 'item_seed_7', name: '洗洁精', description: '餐具清洁', storage_id: 'storage_seed_5', category_id: 'cat_seed_5', price: 15, quantity: 2, unit: '瓶', expiry_date: null, tag_ids: ['tag_seed_1', 'tag_seed_5'] },
    { id: 'item_seed_8', name: '保鲜袋', description: '食品用', storage_id: 'storage_seed_5', category_id: 'cat_seed_6', price: 12, quantity: 1, unit: '卷', expiry_date: null, tag_ids: ['tag_seed_5'] },
    { id: 'item_seed_9', name: '牛奶', description: '鲜牛奶', storage_id: 'storage_seed_6', category_id: null, price: 8, quantity: 3, unit: '盒', expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), tag_ids: [] },
    { id: 'item_seed_10', name: '鸡蛋', description: '一盒', storage_id: 'storage_seed_6', category_id: null, price: 18, quantity: 1, unit: '盒', expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), tag_ids: [] },
  ];

  const itemStmt = db.prepare(`
    INSERT INTO items (
      id, name, description, storage_id, category_id, brand, color,
      price, purchase_date, depreciation_rate, expiry_date,
      quantity, unit, min_threshold, max_threshold,
      rfid, barcode, images, attributes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)
  `);
  const itemTagStmt = db.prepare(`
    INSERT INTO item_tags (item_id, tag_id, created_at) VALUES (?, ?, ?)
  `);

  for (const it of items) {
    itemStmt.run(
      it.id,
      it.name,
      it.description,
      it.storage_id,
      it.category_id,
      it.price,
      it.expiry_date,
      it.quantity,
      it.unit,
      now,
      now
    );
    for (const tagId of it.tag_ids) {
      itemTagStmt.run(it.id, tagId, now);
    }
  }

  console.log('种子数据写入完成：1 个地点、3 个房间、6 个收纳、3 个标签组、6 个标签、6 个分类、10 个物品。');
}

function main() {
  const force = process.argv.includes('--force');
  if (force) {
    console.log('--force: 清除已有种子数据后重新插入...');
    const seedItemIds = [
      'item_seed_1', 'item_seed_2', 'item_seed_3', 'item_seed_4', 'item_seed_5',
      'item_seed_6', 'item_seed_7', 'item_seed_8', 'item_seed_9', 'item_seed_10',
    ];
    db.prepare('DELETE FROM item_tags WHERE item_id IN (?,?,?,?,?,?,?,?,?,?)').run(...seedItemIds);
    db.prepare('DELETE FROM items WHERE id IN (?,?,?,?,?,?,?,?,?,?)').run(...seedItemIds);
    db.prepare("DELETE FROM categories WHERE id LIKE 'cat_seed_%'").run();
    db.prepare("DELETE FROM tags WHERE id LIKE 'tag_seed_%'").run();
    db.prepare("DELETE FROM tag_groups WHERE id LIKE 'tg_seed_%'").run();
    db.prepare("DELETE FROM storages WHERE id LIKE 'storage_seed_%'").run();
    db.prepare("DELETE FROM rooms WHERE id LIKE 'room_seed_%'").run();
    db.prepare('DELETE FROM locations WHERE id = ?').run(SEED_LOCATION_ID);
  }

  initializeDatabase();

  if (hasSeedData() && !force) {
    console.log('已初始化过种子数据，跳过。若需重新初始化请使用: npm run seed -- --force');
    process.exit(0);
    return;
  }

  const transaction = db.transaction(() => {
    runSeed();
  });
  transaction();
}

main();
