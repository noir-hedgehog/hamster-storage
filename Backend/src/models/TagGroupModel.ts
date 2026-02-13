import db from '../db/database';
import { TagGroup, CreateTagGroupDto, UpdateTagGroupDto } from '../types';

export class TagGroupModel {
  static findAll(): TagGroup[] {
    const stmt = db.prepare('SELECT * FROM tag_groups ORDER BY created_at DESC');
    return stmt.all() as TagGroup[];
  }

  static findById(id: string): TagGroup | null {
    const stmt = db.prepare('SELECT * FROM tag_groups WHERE id = ?');
    const result = stmt.get(id) as any;
    return result || null;
  }

  static create(data: CreateTagGroupDto): TagGroup {
    const id = `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tag_groups (id, name, color, icon, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.color || null,
      data.icon || null,
      data.description || null,
      now,
      now
    );
    
    return this.findById(id)!;
  }

  static update(id: string, data: UpdateTagGroupDto): TagGroup | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tag_groups 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    // 检查是否有标签使用此分组
    const tagStmt = db.prepare('SELECT COUNT(*) as count FROM tags WHERE tag_group_id = ?');
    const tagResult = tagStmt.get(id) as { count: number };
    if (tagResult.count > 0) {
      throw new Error('无法删除：仍有标签属于此分组');
    }

    const stmt = db.prepare('DELETE FROM tag_groups WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
