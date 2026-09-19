import { randomUUID } from 'crypto';
import { z } from 'zod';
import db from '../db/database';
import { ItemModel } from '../models/ItemModel';

const candidate = z.object({
  name: z.string().trim().min(1).max(300),
  description: z.string().max(10000).default(''),
  brand: z.string().trim().max(300).default(''),
  category: z.string().trim().max(300).default(''),
  quantity: z.number().int().min(1).max(1000000).default(1),
  unit: z.string().trim().min(1).max(30).default('件'),
  location: z.string().trim().min(1).max(500).default('待整理'),
  price: z.number().finite().min(0).max(1000000000).default(0),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  tags: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
});
export type Candidate = z.infer<typeof candidate>;

export function initializeMoving() {
  db.exec(`CREATE TABLE IF NOT EXISTS moving_item_meta (
    item_id TEXT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
    source TEXT NOT NULL, original_storage_id TEXT NOT NULL, location TEXT NOT NULL
  ); CREATE TABLE IF NOT EXISTS import_batches (
    id TEXT PRIMARY KEY, input TEXT NOT NULL, imported_count INTEGER NOT NULL,
    skipped_count INTEGER NOT NULL, created_at TEXT NOT NULL
  );`);
}

export function normalizeCandidates(value: unknown): Candidate[] {
  const rows = z.array(z.record(z.unknown())).min(1).max(500).parse(value);
  return rows.map(row => candidate.parse({ ...row,
    price: row.price ?? (typeof row.price_cents === 'number' ? row.price_cents / 100 : undefined),
    purchaseDate: row.purchaseDate ?? row.purchase_date,
    expiryDate: row.expiryDate ?? row.expiry_date,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
  }));
}

export function listMovingItems() {
  const rows = db.prepare(`SELECT i.*, s.name AS storage_name, r.name AS room_name,
    l.name AS home_name, c.name AS category_name, m.source, m.location AS imported_location,
    m.original_storage_id FROM items i JOIN storages s ON s.id=i.storage_id
    JOIN rooms r ON r.id=s.room_id JOIN locations l ON l.id=r.location_id
    LEFT JOIN categories c ON c.id=i.category_id
    LEFT JOIN moving_item_meta m ON m.item_id=i.id ORDER BY i.updated_at DESC`).all() as any[];
  const tags = db.prepare('SELECT it.item_id, t.name FROM item_tags it JOIN tags t ON t.id=it.tag_id').all() as {item_id:string;name:string}[];
  const byItem = new Map<string, string[]>();
  tags.forEach(tag => byItem.set(tag.item_id, [...(byItem.get(tag.item_id) || []), tag.name]));
  return rows.map(row => ({ id: row.id, name: row.name, description: row.description || '',
    brand: row.brand || '', category: row.category_name || '', quantity: row.quantity,
    unit: row.unit || '件', location: row.original_storage_id === row.storage_id ? row.imported_location : `${row.home_name} / ${row.room_name} / ${row.storage_name}`,
    storageId: row.storage_id, price: row.price || 0, price_cents: Math.round((row.price || 0) * 100),
    purchase_date: row.purchase_date, expiry_date: row.expiry_date, tags: byItem.get(row.id) || [],
    source: row.source || 'manual', created_at: row.created_at, updated_at: row.updated_at,
  }));
}

const key = (item: {name: string; location: string; brand: string}) => JSON.stringify([item.name.trim(), item.location.trim(), item.brand.trim()]);

export function previewItems(candidates: Candidate[]) {
  const storages = storageAddresses();
  const canonicalKey = (item: {name:string;location:string;brand:string}) => {
    const match = matchStorage(item.location, storages);
    return key({...item, location: match ? `storage:${match.id}` : item.location});
  };
  const seen = new Set(listMovingItems().map(canonicalKey));
  return candidates.map(item => { const duplicate = seen.has(canonicalKey(item)); seen.add(canonicalKey(item)); return {...item, duplicate}; });
}

function storageAddresses() {
  return db.prepare(`SELECT s.id, s.name, r.name AS room_name, l.name AS home_name
    FROM storages s JOIN rooms r ON r.id=s.room_id JOIN locations l ON l.id=r.location_id`).all() as {id:string;name:string;room_name:string;home_name:string}[];
}
function matchStorage(location: string, storages: ReturnType<typeof storageAddresses>) {
  const exact = storages.filter(s => `${s.home_name} / ${s.room_name} / ${s.name}` === location);
  if (exact.length === 1) return exact[0];
  const names = storages.filter(s => s.name === location);
  return names.length === 1 ? names[0] : undefined;
}
function resolveStorage(location: string): string {
  const match = matchStorage(location, storageAddresses());
  if (match) return match.id;
  const imported = db.prepare('SELECT original_storage_id AS id FROM moving_item_meta m JOIN storages s ON s.id=m.original_storage_id WHERE m.location=? LIMIT 1').get(location) as {id:string}|undefined;
  if (imported) return imported.id;
  db.prepare("INSERT OR IGNORE INTO locations (id,name,type) VALUES ('moving-home','搬家清单','location')").run();
  let room = db.prepare("SELECT id FROM rooms WHERE location_id='moving-home' AND name=?").get(location) as {id:string}|undefined;
  if (!room) { room = { id: randomUUID() }; db.prepare("INSERT INTO rooms(id,name,location_id) VALUES (?,?,'moving-home')").run(room.id, location); }
  const id = randomUUID();
  db.prepare('INSERT INTO storages(id,name,room_id,icon) VALUES (?,?,?,?)').run(id, location, room.id, '📦');
  return id;
}

export function importMovingItems(candidates: Candidate[], input: string, source = 'migration') {
  return db.transaction(() => {
    const preview = previewItems(candidates);
    const imported = [];
    for (const item of preview.filter(row => !row.duplicate)) {
      let categoryId: string | undefined;
      if (item.category) {
        const existing = db.prepare('SELECT id FROM categories WHERE name=?').get(item.category) as {id:string}|undefined;
        categoryId = existing?.id || randomUUID();
        if (!existing) db.prepare('INSERT INTO categories(id,name) VALUES (?,?)').run(categoryId, item.category);
      }
      const tagIds = item.tags.map(name => {
        const existing = db.prepare('SELECT id FROM tags WHERE name=?').get(name) as {id:string}|undefined;
        if (existing) return existing.id;
        const id = randomUUID(); db.prepare('INSERT INTO tags(id,name) VALUES (?,?)').run(id, name); return id;
      });
      const storageId = resolveStorage(item.location);
      const created = ItemModel.create({...item, storageId, categoryId, tagIds: [...new Set(tagIds)],
        purchaseDate: item.purchaseDate || undefined, expiryDate: item.expiryDate || undefined});
      db.prepare('INSERT INTO moving_item_meta(item_id,source,original_storage_id,location) VALUES (?,?,?,?)')
        .run(created.id, source, storageId, item.location);
      imported.push(created.id);
    }
    const batchId = randomUUID();
    db.prepare('INSERT INTO import_batches(id,input,imported_count,skipped_count,created_at) VALUES (?,?,?,?,?)')
      .run(batchId, input, imported.length, candidates.length-imported.length, new Date().toISOString());
    return {batchId, importedCount: imported.length, skippedCount: candidates.length-imported.length, items: candidates};
  })();
}
