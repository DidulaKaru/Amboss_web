import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core'

export const materials = pgTable('materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'FDM' | 'SLA'
  densityGPerCm3: numeric('density_g_cm3', { precision: 6, scale: 3 }).notNull(),
  costPerGramLkr: numeric('cost_per_gram_lkr', { precision: 10, scale: 2 }).notNull(),
  tag: varchar('tag', { length: 50 }).notNull(),
  requiresEnclosure: boolean('requires_enclosure').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const machines = pgTable('machines', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'FDM' | 'SLA'
  buildXMm: integer('build_x_mm').notNull(),
  buildYMm: integer('build_y_mm').notNull(),
  buildZMm: integer('build_z_mm').notNull(),
  isEnclosed: boolean('is_enclosed').default(false).notNull(),
  hourlyRateLkr: numeric('hourly_rate_lkr', { precision: 10, scale: 2 }).notNull(),
  isOnline: boolean('is_online').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description').notNull(),
  priceLkr: numeric('price_lkr', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  boundingX: numeric('bounding_x', { precision: 8, scale: 2 }).notNull(),
  boundingY: numeric('bounding_y', { precision: 8, scale: 2 }).notNull(),
  boundingZ: numeric('bounding_z', { precision: 8, scale: 2 }).notNull(),
  volumeCm3: numeric('volume_cm3', { precision: 10, scale: 3 }).notNull(),
  surfaceAreaCm2: numeric('surface_area_cm2', { precision: 10, scale: 3 }).notNull(),
  materialId: uuid('material_id').references(() => materials.id).notNull(),
  machineId: uuid('machine_id').references(() => machines.id),
  infillPercentage: integer('infill_percentage').notNull(),
  layerHeightMm: numeric('layer_height_mm', { precision: 4, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  estimatedGrams: numeric('estimated_grams', { precision: 8, scale: 2 }).notNull(),
  estimatedPrintHours: numeric('estimated_print_hours', { precision: 8, scale: 2 }).notNull(),
  materialCostLkr: numeric('material_cost_lkr', { precision: 10, scale: 2 }).notNull(),
  machineCostLkr: numeric('machine_cost_lkr', { precision: 10, scale: 2 }).notNull(),
  handlingCostLkr: numeric('handling_cost_lkr', { precision: 10, scale: 2 }).notNull(),
  totalPriceLkr: numeric('total_price_lkr', { precision: 10, scale: 2 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 30 }),
  status: varchar('status', { length: 30 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export type Material = typeof materials.$inferSelect
export type NewMaterial = typeof materials.$inferInsert
export type Machine = typeof machines.$inferSelect
export type NewMachine = typeof machines.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
