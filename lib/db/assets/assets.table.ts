import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { branches } from '../stories/stories.table'

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['image', 'audio', 'file'] }).notNull(),
  mimeType: text('mime_type'),
  filePath: text('file_path').notNull(),
  sizeBytes: integer('size_bytes'),
  contentHash: text('content_hash'),
  createdAt: integer('created_at').notNull(),
  pendingDeleteAt: integer('pending_delete_at'),
})

export const entryAssets = sqliteTable(
  'entry_assets',
  {
    id: text('id').notNull(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id),
    // FK-less: story_entries has a composite PK (branch_id, id); a single-column FK is impossible.
    entryId: text('entry_id').notNull(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    role: text('role'),
    position: integer('position'),
  },
  (t) => [primaryKey({ columns: [t.branchId, t.id] })],
)
