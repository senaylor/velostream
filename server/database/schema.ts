import { pgTable, uuid, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const assets = pgTable('assets', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', {length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(),

    //Cloudflare R2 Key mapping
    storageKey: text('storage_key').notNull(),
    fileSize: integer('file_size').notNull(),
    mimeType: varchar('mime_type', {length: 100}).notNull(),

    //Hi performance props
    duration: integer('duration'),
    thumbnailUri: text('thumbnail_uri'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const streamAnalytics = pgTable('steam_analytics', {
    id: uuid('id').defaultRandom().notNull(),
    assetId: uuid('asset_id').references( () => assets.id, {onDelete: 'cascade'} ).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Simulated user or auth ID
    bytesStreamed: integer('bytes_streamed').default(0).notNull(),
    lastPosition: integer('last_position').default(0).notNull(), // Timestamp marker in video
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
