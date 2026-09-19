import db from '../db/database';
import { readRoomGeometry, saveRoomGeometry, geometrySchema } from './SpaceModel';
import { Room, CreateRoomDto, UpdateRoomDto } from '../types';

export class RoomModel {
  static findAll(): Room[] {
    const stmt = db.prepare('SELECT * FROM rooms ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(r => ({
      ...r,
      locationId: r.location_id,
      geometry: readRoomGeometry(r.id),
      floorplanX: r.floorplan_x ?? undefined,
      floorplanY: r.floorplan_y ?? undefined,
      floorplanWidth: r.floorplan_width ?? undefined,
      floorplanHeight: r.floorplan_height ?? undefined,
      floorplanRotation: r.floorplan_rotation ?? undefined,
    }));
  }

  static findById(id: string): Room | null {
    const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      ...result,
      locationId: result.location_id,
      geometry: readRoomGeometry(result.id),
      floorplanX: result.floorplan_x ?? undefined,
      floorplanY: result.floorplan_y ?? undefined,
      floorplanWidth: result.floorplan_width ?? undefined,
      floorplanHeight: result.floorplan_height ?? undefined,
      floorplanRotation: result.floorplan_rotation ?? undefined,
    };
  }

  static findByLocationId(locationId: string): Room[] {
    const stmt = db.prepare('SELECT * FROM rooms WHERE location_id = ? ORDER BY created_at DESC');
    const results = stmt.all(locationId) as any[];
    return results.map(r => ({
      ...r,
      locationId: r.location_id,
      geometry: readRoomGeometry(r.id),
      floorplanX: r.floorplan_x ?? undefined,
      floorplanY: r.floorplan_y ?? undefined,
      floorplanWidth: r.floorplan_width ?? undefined,
      floorplanHeight: r.floorplan_height ?? undefined,
      floorplanRotation: r.floorplan_rotation ?? undefined,
    }));
  }

  static create(data: CreateRoomDto): Room {
    const id = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO rooms (id, name, type, location_id, icon, created_at, updated_at)
      VALUES (?, ?, 'room', ?, ?, ?, ?)
    `);
    
    return db.transaction(() => {
      stmt.run(id, data.name, data.locationId, data.icon || null, now, now);
      return this.update(id, data)!;
    })();
  }

  static update(id: string, data: UpdateRoomDto): Room | null {
    const existing = this.findById(id);
    if (!existing) return null;

    if (data.geometry !== undefined && data.geometry !== null) geometrySchema.parse(data.geometry);
    if (data.geometry === null && db.prepare('SELECT id FROM furniture WHERE room_id=? LIMIT 1').get(id)) throw new Error('房间存在家具，不能移除实测尺寸');
    if (data.geometry !== undefined) saveRoomGeometry(id, data.geometry);
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
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

    if (updates.length === 0 && data.geometry === undefined) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE rooms 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
