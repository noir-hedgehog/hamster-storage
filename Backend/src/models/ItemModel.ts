import db from '../db/database';
import { Item, CreateItemDto, UpdateItemDto, Alert } from '../types';

export class ItemModel {
  static findAll(): Item[] {
    const stmt = db.prepare('SELECT * FROM items ORDER BY created_at DESC');
    const results = stmt.all() as any[];
    return results.map(row => this.mapRowToItem(row));
  }

  static findById(id: string): Item | null {
    const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
    const result = stmt.get(id) as any;
    if (!result) return null;
    return this.mapRowToItem(result);
  }

  static findByStorageId(storageId: string): Item[] {
    const stmt = db.prepare('SELECT * FROM items WHERE storage_id = ? ORDER BY created_at DESC');
    const results = stmt.all(storageId) as any[];
    return results.map(row => this.mapRowToItem(row));
  }

  static findByRfid(rfid: string): Item | null {
    const stmt = db.prepare('SELECT * FROM items WHERE rfid = ?');
    const result = stmt.get(rfid) as any;
    if (!result) return null;
    return this.mapRowToItem(result);
  }

  static search(query: string): Item[] {
    const searchTerm = `%${query}%`;
    const stmt = db.prepare(`
      SELECT DISTINCT i.* FROM items i
      LEFT JOIN item_tags it ON i.id = it.item_id
      LEFT JOIN tags t ON it.tag_id = t.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.name LIKE ? 
         OR i.description LIKE ? 
         OR c.name LIKE ?
         OR t.name LIKE ?
      ORDER BY i.created_at DESC
    `);
    const results = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as any[];
    return results.map(row => this.mapRowToItem(row));
  }

  static create(data: CreateItemDto): Item {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO items (
        id, name, description, storage_id, category_id, brand, color,
        price, purchase_date, depreciation_rate, expiry_date,
        quantity, unit, min_threshold, max_threshold,
        rfid, barcode, images, attributes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.description || null,
      data.storageId,
      data.categoryId || null,
      data.brand || null,
      data.color || null,
      data.price || null,
      data.purchaseDate || null,
      data.depreciationRate || null,
      data.expiryDate || null,
      data.quantity || 1,
      data.unit || '件',
      data.minThreshold || null,
      data.maxThreshold || null,
      data.rfid || null,
      data.barcode || null,
      data.images ? JSON.stringify(data.images) : null,
      data.attributes ? JSON.stringify(data.attributes) : null,
      now,
      now
    );

    // 处理标签关联
    if (data.tagIds && data.tagIds.length > 0) {
      this.setItemTags(id, data.tagIds);
    }
    
    return this.findById(id)!;
  }

  static update(id: string, data: UpdateItemDto): Item | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    const fields: Record<string, any> = {
      name: data.name,
      description: data.description,
      storage_id: data.storageId,
      category_id: data.categoryId,
      brand: data.brand,
      color: data.color,
      price: data.price,
      purchase_date: data.purchaseDate,
      depreciation_rate: data.depreciationRate,
      expiry_date: data.expiryDate,
      quantity: data.quantity,
      unit: data.unit,
      min_threshold: data.minThreshold,
      max_threshold: data.maxThreshold,
      rfid: data.rfid,
      barcode: data.barcode,
      images: data.images ? JSON.stringify(data.images) : undefined,
      attributes: data.attributes ? JSON.stringify(data.attributes) : undefined,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = db.prepare(`
        UPDATE items 
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
      
      stmt.run(...values);
    }

    // 更新标签关联
    if (data.tagIds !== undefined) {
      this.setItemTags(id, data.tagIds);
    }
    
    return this.findById(id);
  }

  static delete(id: string): boolean {
    // 先删除标签关联
    const deleteTagsStmt = db.prepare('DELETE FROM item_tags WHERE item_id = ?');
    deleteTagsStmt.run(id);

    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deleteMany(ids: string[]): number {
    if (ids.length === 0) return 0;
    
    // 删除标签关联
    const placeholders = ids.map(() => '?').join(',');
    const deleteTagsStmt = db.prepare(`DELETE FROM item_tags WHERE item_id IN (${placeholders})`);
    deleteTagsStmt.run(...ids);

    const stmt = db.prepare(`DELETE FROM items WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    return result.changes;
  }

  static getAlerts(): Alert[] {
    const items = this.findAll();
    const alerts: Alert[] = [];
    const now = new Date();

    items.forEach(item => {
      // 检查过期
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          alerts.push({
            id: `${item.id}-expired`,
            itemId: item.id,
            itemName: item.name,
            type: 'expired',
            severity: 'high',
            message: `已过期 ${Math.abs(daysUntilExpiry)} 天`,
            date: new Date().toISOString(),
          });
        } else if (daysUntilExpiry <= 7) {
          alerts.push({
            id: `${item.id}-expiring`,
            itemId: item.id,
            itemName: item.name,
            type: 'expiring',
            severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
            message: `还有 ${daysUntilExpiry} 天过期`,
            date: new Date().toISOString(),
          });
        }
      }

      // 检查库存低于阈值
      if (item.minThreshold !== undefined && item.quantity <= item.minThreshold) {
        alerts.push({
          id: `${item.id}-low-stock`,
          itemId: item.id,
          itemName: item.name,
          type: 'low-stock',
          severity: item.quantity === 0 ? 'high' : 'medium',
          message: `库存不足：当前 ${item.quantity}，最低需要 ${item.minThreshold}`,
          date: new Date().toISOString(),
        });
      }

      // 检查库存高于阈值
      if (item.maxThreshold !== undefined && item.quantity >= item.maxThreshold) {
        alerts.push({
          id: `${item.id}-overstock`,
          itemId: item.id,
          itemName: item.name,
          type: 'overstock',
          severity: 'low',
          message: `库存过多：当前 ${item.quantity}，建议最多 ${item.maxThreshold}`,
          date: new Date().toISOString(),
        });
      }
    });

    return alerts;
  }

  // 设置物品的标签关联
  private static setItemTags(itemId: string, tagIds: string[]): void {
    // 先删除所有现有关联
    const deleteStmt = db.prepare('DELETE FROM item_tags WHERE item_id = ?');
    deleteStmt.run(itemId);

    // 插入新关联
    if (tagIds.length > 0) {
      const insertStmt = db.prepare('INSERT INTO item_tags (item_id, tag_id, created_at) VALUES (?, ?, ?)');
      const now = new Date().toISOString();
      const insertMany = db.transaction((tags: string[]) => {
        for (const tagId of tags) {
          insertStmt.run(itemId, tagId, now);
        }
      });
      insertMany(tagIds);
    }
  }

  // 获取物品的标签 ID 列表
  private static getItemTagIds(itemId: string): string[] {
    const stmt = db.prepare('SELECT tag_id FROM item_tags WHERE item_id = ?');
    const results = stmt.all(itemId) as any[];
    return results.map(r => r.tag_id);
  }

  private static mapRowToItem(row: any): Item {
    // 获取标签 ID 列表
    const tagIds = this.getItemTagIds(row.id);

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      storageId: row.storage_id,
      categoryId: row.category_id || undefined,
      brand: row.brand || undefined,
      color: row.color || undefined,
      price: row.price || undefined,
      purchaseDate: row.purchase_date || undefined,
      depreciationRate: row.depreciation_rate || undefined,
      expiryDate: row.expiry_date || undefined,
      quantity: row.quantity,
      unit: row.unit || '件',
      minThreshold: row.min_threshold || undefined,
      maxThreshold: row.max_threshold || undefined,
      rfid: row.rfid || undefined,
      barcode: row.barcode || undefined,
      images: row.images ? JSON.parse(row.images) : undefined,
      attributes: row.attributes ? JSON.parse(row.attributes) : {},
      tags: tagIds,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
