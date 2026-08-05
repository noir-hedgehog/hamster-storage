import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  id: text("id").primaryKey(), name: text("name").notNull(), description: text("description").notNull().default(""),
  brand: text("brand").notNull().default(""), category: text("category").notNull().default(""), quantity: integer("quantity").notNull().default(1), unit: text("unit").notNull().default("件"), location: text("location").notNull().default("待整理"), price: integer("price_cents").notNull().default(0), purchaseDate: text("purchase_date"), expiryDate: text("expiry_date"), tags: text("tags").notNull().default("[]"), importKey: text("import_key").notNull().unique(), source: text("source").notNull().default("manual"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const importBatches = sqliteTable("import_batches", {
  id: text("id").primaryKey(), input: text("input").notNull(), importedCount: integer("imported_count").notNull().default(0), skippedCount: integer("skipped_count").notNull().default(0), createdAt: text("created_at").notNull(),
});
