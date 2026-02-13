import db from '../db/database';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';

export class CategoryModel {
  static findAll(): Category[] {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(c => ({
      ...c,
      parentCategoryId: c.parent_category_id || undefined,
      attributesTemplate: c.attributes_template ? JSON.parse(c.attributes_template) : undefined,
    }));
  }

  static findById(id: string): Category | null {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      ...result,
      parentCategoryId: result.parent_category_id || undefined,
      attributesTemplate: result.attributes_template ? JSON.parse(result.attributes_template) : undefined,
    };
  }

  static findByParentId(parentCategoryId: string | null): Category[] {
    if (parentCategoryId === null) {
      const stmt = db.prepare('SELECT * FROM categories WHERE parent_category_id IS NULL ORDER BY created_at DESC');
      const results = stmt.all() as any[];
      return results.map(c => ({
        ...c,
        parentCategoryId: c.parent_category_id || undefined,
        attributesTemplate: c.attributes_template ? JSON.parse(c.attributes_template) : undefined,
      }));
    }
    const stmt = db.prepare('SELECT * FROM categories WHERE parent_category_id = ? ORDER BY created_at DESC');
    const results = stmt.all(parentCategoryId) as any[];
    return results.map(c => ({
      ...c,
      parentCategoryId: c.parent_category_id || undefined,
      attributesTemplate: c.attributes_template ? JSON.parse(c.attributes_template) : undefined,
    }));
  }

  static create(data: CreateCategoryDto): Category {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO categories (id, name, parent_category_id, icon, description, attributes_template, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.parentCategoryId || null,
      data.icon || null,
      data.description || null,
      data.attributesTemplate ? JSON.stringify(data.attributesTemplate) : null,
      now,
      now
    );
    
    return this.findById(id)!;
  }

  static update(id: string, data: UpdateCategoryDto): Category | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.parentCategoryId !== undefined) {
      updates.push('parent_category_id = ?');
      values.push(data.parentCategoryId || null);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.attributesTemplate !== undefined) {
      updates.push('attributes_template = ?');
      values.push(data.attributesTemplate ? JSON.stringify(data.attributesTemplate) : null);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    // 检查是否有子分类
    const children = this.findByParentId(id);
    if (children.length > 0) {
      throw new Error('无法删除：该分类下还有子分类');
    }

    // 检查是否有物品使用此分类
    const itemStmt = db.prepare('SELECT COUNT(*) as count FROM items WHERE category_id = ?');
    const itemResult = itemStmt.get(id) as { count: number };
    if (itemResult.count > 0) {
      throw new Error('无法删除：仍有物品使用此分类');
    }

    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
