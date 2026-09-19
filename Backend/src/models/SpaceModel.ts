import { randomUUID } from 'crypto';
import { z } from 'zod';
import db from '../db/database';

const distance = z.number().finite().min(-100000).max(100000);
const size = z.number().finite().positive().max(100000);
export const geometrySchema = z.object({
  unit: z.literal('cm'), x: distance, y: distance,
  width: size, depth: size, height: size.optional(),
  rotation: z.number().finite().min(-360).max(360).default(0),
}).strict();
export const furnitureSchema = z.object({
  name: z.string().trim().min(1).max(300), roomId: z.string().min(1).max(200),
  kind: z.enum(['bed', 'sofa', 'table', 'chair', 'wardrobe', 'shelf', 'drawers', 'appliance', 'box', 'other']),
  width: size, depth: size, height: size,
  x: distance, y: distance, rotation: z.number().finite().min(-360).max(360).default(0),
  unit: z.literal('cm'),
  storageId: z.string().max(200).nullable().optional(),
  description: z.string().max(10000).optional(),
}).strict();
export type RoomGeometry = z.infer<typeof geometrySchema>;
export type FurnitureInput = z.infer<typeof furnitureSchema>;
export type Furniture = FurnitureInput & { id: string; created_at: string; updated_at: string };

export function initializeSpace() {
  db.exec(`CREATE TABLE IF NOT EXISTS room_geometry (
    room_id TEXT PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE, data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS furniture (
    id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    storage_id TEXT UNIQUE REFERENCES storages(id) ON DELETE SET NULL,
    data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_furniture_room ON furniture(room_id);`);
}

export function readRoomGeometry(roomId: string): RoomGeometry | undefined {
  const row = db.prepare('SELECT data FROM room_geometry WHERE room_id=?').get(roomId) as {data:string}|undefined;
  return row ? JSON.parse(row.data) : undefined;
}
export function saveRoomGeometry(roomId: string, value: unknown) {
  if (value === null) { db.prepare('DELETE FROM room_geometry WHERE room_id=?').run(roomId); return; }
  const geometry = geometrySchema.parse(value);
  db.prepare('INSERT INTO room_geometry(room_id,data) VALUES (?,?) ON CONFLICT(room_id) DO UPDATE SET data=excluded.data')
    .run(roomId, JSON.stringify(geometry));
}

export class FurnitureModel {
  private static map(row: any): Furniture {
    return {...JSON.parse(row.data), id:row.id, roomId:row.room_id, storageId:row.storage_id,
      created_at:row.created_at, updated_at:row.updated_at};
  }
  static findAll(): Furniture[] { return db.prepare('SELECT * FROM furniture ORDER BY id').all().map(this.map); }
  static findById(id: string): Furniture | null {
    const row = db.prepare('SELECT * FROM furniture WHERE id=?').get(id);
    return row ? this.map(row) : null;
  }
  private static validate(value: unknown, id?: string) {
    const data = furnitureSchema.parse(value);
    if (!db.prepare('SELECT id FROM rooms WHERE id=?').get(data.roomId)) throw new Error('房间不存在');
    if (!readRoomGeometry(data.roomId)) throw new Error('请先为房间录入厘米尺寸，不能将旧示意坐标视为实测尺寸');
    if (data.storageId) {
      const storage = db.prepare('SELECT room_id,parent_storage_id FROM storages WHERE id=?').get(data.storageId) as any;
      if (!storage || storage.room_id !== data.roomId || storage.parent_storage_id) throw new Error('家具只能关联同房间的顶层收纳位置');
      const occupied = db.prepare('SELECT id FROM furniture WHERE storage_id=? AND id<>?').get(data.storageId, id || '');
      if (occupied) throw new Error('该收纳位置已关联其他家具');
    }
    return data;
  }
  static create(value: unknown): Furniture {
    const data = this.validate(value), id = randomUUID(), now = new Date().toISOString();
    db.prepare('INSERT INTO furniture(id,room_id,storage_id,data,created_at,updated_at) VALUES (?,?,?,?,?,?)')
      .run(id,data.roomId,data.storageId || null,JSON.stringify(data),now,now);
    return this.findById(id)!;
  }
  static update(id: string, value: Partial<FurnitureInput>): Furniture | null {
    const before = this.findById(id); if (!before) return null;
    const {id:_,created_at,updated_at,...fields} = before;
    const data = this.validate({...fields,...value},id);
    db.prepare('UPDATE furniture SET room_id=?,storage_id=?,data=?,updated_at=? WHERE id=?')
      .run(data.roomId,data.storageId || null,JSON.stringify(data),new Date().toISOString(),id);
    return this.findById(id);
  }
  static delete(id: string) { return db.prepare('DELETE FROM furniture WHERE id=?').run(id).changes > 0; }
}
