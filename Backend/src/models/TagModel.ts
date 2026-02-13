import db from '../db/database';
import { Tag, CreateTagDto, UpdateTagDto } from '../types';

export class TagModel {
  static findAll(): Tag[] {
    const stmt = db.prepare('SELECT * FROM tags ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(t => ({
      ...t,
      tagGroupId: t.tag_group_id || undefined,
    }));
  }

  static findById(id: string): Tag | null {
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      ...result,
      tagGroupId: result.tag_group_id || undefined,
    };
  }

  static findByGroupId(tagGroupId: string): Tag[] {
    const stmt = db.prepare('SELECT * FROM tags WHERE tag_group_id = ? ORDER BY created_at DESC');
    const results = stmt.all(tagGroupId) as any[];
    return results.map(t => ({
      ...t,
      tagGroupId: t.tag_group_id || undefined,
    }));
  }

  static findWithoutGroup(): Tag[] {
    const stmt = db.prepare('SELECT * FROM tags WHERE tag_group_id IS NULL ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(t => ({
      ...t,
      tagGroupId: t.tag_group_id || undefined,
    }));
  }

  static create(data: CreateTagDto): Tag {
    const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tags (id, name, tag_group_id, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.tagGroupId || null,
      data.color || null,
      data.icon || null,
      now,
      now
    );
    
    return this.findById(id)!;
  }

  static update(id: string, data: UpdateTagDto): Tag | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.tagGroupId !== undefined) {
      updates.push('tag_group_id = ?');
      values.push(data.tagGroupId || null);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tags 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    // 检查是否有物品使用此标签
    const itemTagStmt = db.prepare('SELECT COUNT(*) as count FROM item_tags WHERE tag_id = ?');
    const itemTagResult = itemTagStmt.get(id) as { count: number };
    if (itemTagResult.count > 0) {
      throw new Error('无法删除：仍有物品使用此标签');
    }

    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
