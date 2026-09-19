import db from '../db/database';
import { Location, CreateLocationDto, UpdateLocationDto } from '../types';

export class LocationModel {
  static findAll(): Location[] {
    const stmt = db.prepare('SELECT * FROM locations ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(loc => ({
      ...loc,
      mapX: loc.map_x ?? undefined,
      mapY: loc.map_y ?? undefined,
    }));
  }

  static findById(id: string): Location | null {
    const stmt = db.prepare('SELECT * FROM locations WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      ...result,
      mapX: result.map_x ?? undefined,
      mapY: result.map_y ?? undefined,
    };
  }

  static create(data: CreateLocationDto): Location {
    const id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO locations (id, name, type, icon, created_at, updated_at)
      VALUES (?, ?, 'location', ?, ?, ?)
    `);
    
    stmt.run(id, data.name, data.icon || null, now, now);
    
    return this.findById(id)!;
  }

  static update(id: string, data: UpdateLocationDto): Location | null {
    const existing = this.findById(id);
    if (!existing) return null;

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
    if (data.mapX !== undefined) {
      updates.push('map_x = ?');
      values.push(data.mapX);
    }
    if (data.mapY !== undefined) {
      updates.push('map_y = ?');
      values.push(data.mapY);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE locations 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM locations WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
