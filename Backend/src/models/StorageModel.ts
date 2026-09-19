import db from '../db/database';
import { Storage, CreateStorageDto, UpdateStorageDto } from '../types';

export class StorageModel {
  static findAll(): Storage[] {
    const stmt = db.prepare('SELECT * FROM storages ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(s => ({
      ...s,
      roomId: s.room_id,
      parentStorageId: s.parent_storage_id || undefined,
      floorplanX: s.floorplan_x ?? undefined,
      floorplanY: s.floorplan_y ?? undefined,
      floorplanWidth: s.floorplan_width ?? undefined,
      floorplanHeight: s.floorplan_height ?? undefined,
      floorplanRotation: s.floorplan_rotation ?? undefined,
    }));
  }

  static findById(id: string): Storage | null {
    const stmt = db.prepare('SELECT * FROM storages WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      ...result,
      roomId: result.room_id,
      parentStorageId: result.parent_storage_id || undefined,
      floorplanX: result.floorplan_x ?? undefined,
      floorplanY: result.floorplan_y ?? undefined,
      floorplanWidth: result.floorplan_width ?? undefined,
      floorplanHeight: result.floorplan_height ?? undefined,
      floorplanRotation: result.floorplan_rotation ?? undefined,
    };
  }

  static findByRoomId(roomId: string): Storage[] {
    const stmt = db.prepare('SELECT * FROM storages WHERE room_id = ? AND (parent_storage_id IS NULL OR parent_storage_id = \'\') ORDER BY created_at DESC');
    const results = stmt.all(roomId) as any[];
    return results.map(s => ({
      ...s,
      roomId: s.room_id,
      parentStorageId: s.parent_storage_id || undefined,
      floorplanX: s.floorplan_x ?? undefined,
      floorplanY: s.floorplan_y ?? undefined,
      floorplanWidth: s.floorplan_width ?? undefined,
      floorplanHeight: s.floorplan_height ?? undefined,
      floorplanRotation: s.floorplan_rotation ?? undefined,
    }));
  }

  static findByParentStorageId(parentStorageId: string): Storage[] {
    const stmt = db.prepare('SELECT * FROM storages WHERE parent_storage_id = ? ORDER BY created_at DESC');
    const results = stmt.all(parentStorageId) as any[];
    return results.map(s => ({
      ...s,
      roomId: s.room_id,
      parentStorageId: s.parent_storage_id || undefined,
      floorplanX: s.floorplan_x ?? undefined,
      floorplanY: s.floorplan_y ?? undefined,
      floorplanWidth: s.floorplan_width ?? undefined,
      floorplanHeight: s.floorplan_height ?? undefined,
      floorplanRotation: s.floorplan_rotation ?? undefined,
    }));
  }

  static create(data: CreateStorageDto): Storage {
    const id = `stor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO storages (id, name, type, room_id, parent_storage_id, description, icon, created_at, updated_at)
      VALUES (?, ?, 'storage', ?, ?, ?, ?, ?, ?)
    `);
    
    // 参数顺序：id, name, room_id, parent_storage_id, description, icon, created_at, updated_at
    const parentStorageId = data.parentStorageId || null;
    
    return db.transaction(() => {
    stmt.run(
      id, 
      data.name, 
      data.roomId, 
      parentStorageId, 
      data.description || null, 
      data.icon || null, 
      now, 
      now
    );
    
    return this.update(id, data)!;
    })();
  }

  static update(id: string, data: UpdateStorageDto): Storage | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.parentStorageId !== undefined) {
      updates.push('parent_storage_id = ?');
      values.push(data.parentStorageId || null);
    }
    if (data.floorplanX !== undefined) {
      updates.push('floorplan_x = ?');
      values.push(data.floorplanX);
    }
    if (data.floorplanY !== undefined) {
      updates.push('floorplan_y = ?');
      values.push(data.floorplanY);
    }
    if (data.floorplanWidth !== undefined) {
      updates.push('floorplan_width = ?');
      values.push(data.floorplanWidth);
    }
    if (data.floorplanHeight !== undefined) {
      updates.push('floorplan_height = ?');
      values.push(data.floorplanHeight);
    }
    if (data.floorplanRotation !== undefined) {
      updates.push('floorplan_rotation = ?');
      values.push(data.floorplanRotation);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE storages 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM storages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
