import { env } from "cloudflare:workers";

type ItemPayload = { name?: string; description?: string; brand?: string; category?: string; quantity?: number; unit?: string; location?: string; price?: number; purchaseDate?: string; expiryDate?: string; tags?: string[]; source?: string };
const itemsSql = `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', brand TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '', quantity INTEGER NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT '件', location TEXT NOT NULL DEFAULT '待整理', price_cents INTEGER NOT NULL DEFAULT 0, purchase_date TEXT, expiry_date TEXT, tags TEXT NOT NULL DEFAULT '[]', import_key TEXT NOT NULL UNIQUE, source TEXT NOT NULL DEFAULT 'manual', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`;
const batchesSql = `CREATE TABLE IF NOT EXISTS import_batches (id TEXT PRIMARY KEY, input TEXT NOT NULL, imported_count INTEGER NOT NULL DEFAULT 0, skipped_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);`;
async function ensureSchema() { await env.DB.batch([env.DB.prepare(itemsSql), env.DB.prepare(batchesSql)]); }
function mapRow(row: Record<string, unknown>) { return { ...row, price: Number(row.price_cents ?? 0) / 100, tags: JSON.parse(String(row.tags || "[]")) }; }

export async function GET() { await ensureSchema(); const result = await env.DB.prepare("SELECT * FROM items ORDER BY updated_at DESC").all(); return Response.json({ items: result.results.map((row) => mapRow(row as Record<string, unknown>)) }); }

export async function POST(request: Request) {
  const payload = (await request.json()) as ItemPayload; const name = payload.name?.trim();
  if (!name) return Response.json({ error: "商品名称不能为空" }, { status: 400 });
  await ensureSchema(); const now = new Date().toISOString(); const id = crypto.randomUUID(); const key = `${name}|${payload.location?.trim() || "待整理"}|${payload.brand?.trim() || ""}`;
  await env.DB.prepare("INSERT INTO items (id,name,description,brand,category,quantity,unit,location,price_cents,purchase_date,expiry_date,tags,import_key,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, name, payload.description?.trim() || "", payload.brand?.trim() || "", payload.category?.trim() || "", Math.max(1, Number(payload.quantity || 1)), payload.unit?.trim() || "件", payload.location?.trim() || "待整理", Math.round(Number(payload.price || 0) * 100), payload.purchaseDate || null, payload.expiryDate || null, JSON.stringify(payload.tags || []), key, payload.source || "manual", now, now).run();
  const row = await env.DB.prepare("SELECT * FROM items WHERE id = ?").bind(id).first(); return Response.json({ item: mapRow(row as Record<string, unknown>) }, { status: 201 });
}
