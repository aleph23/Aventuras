import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { branches } from '../stories/stories.table'

export const translations = sqliteTable(
  'translations',
  {
    id: text('id').notNull(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id),
    targetKind: text('target_kind', {
      enum: [
        'entity',
        'lore',
        'thread',
        'happening',
        'story_entry',
        'character_relationship',
        'chapter',
      ],
    }).notNull(),
    targetId: text('target_id').notNull(),
    field: text('field').notNull(),
    language: text('language').notNull(),
    translatedText: text('translated_text'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.branchId, t.id] }),
    uniqueIndex('translations_natural_uniq').on(
      t.branchId,
      t.targetKind,
      t.targetId,
      t.field,
      t.language,
    ),
  ],
)
