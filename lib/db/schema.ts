import { sql } from 'drizzle-orm'
import {
  type AnySQLiteColumn,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const stories = sqliteTable('stories', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  tags: text('tags', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  coverAssetId: text('cover_asset_id'),
  accentColor: text('accent_color'),
  status: text('status', { enum: ['draft', 'active', 'archived'] })
    .notNull()
    .default('draft'),
  favorite: integer('favorite').notNull().default(0),
  lastOpenedAt: integer('last_opened_at'),
  definition: text('definition', { mode: 'json' }).$type<Record<string, unknown>>(),
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  // FK-less on purpose: breaks the stories<->branches cycle so a story can be
  // inserted before its first branch. Logically references branches.id.
  currentBranchId: text('current_branch_id'),
})

export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  storyId: text('story_id')
    .notNull()
    .references(() => stories.id),
  parentBranchId: text('parent_branch_id').references((): AnySQLiteColumn => branches.id),
  forkEntryId: text('fork_entry_id'),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const storyEntries = sqliteTable(
  'story_entries',
  {
    // id is branch-scoped (unique within a branch, not globally) — the composite PK enforces it.
    id: text('id').notNull(),
    branchId: text('branch_id')
      .notNull()
      .references(() => branches.id),
    position: integer('position').notNull(),
    kind: text('kind', { enum: ['user_action', 'ai_reply', 'system', 'opening'] }).notNull(),
    content: text('content').notNull(),
    chapterId: text('chapter_id'),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.branchId, t.id] })],
)

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  providers: text('providers', { mode: 'json' })
    .$type<unknown[]>()
    .notNull()
    .default(sql`'[]'`),
  profiles: text('profiles', { mode: 'json' })
    .$type<unknown[]>()
    .notNull()
    .default(sql`'[]'`),
  assignments: text('assignments', { mode: 'json' })
    .$type<Record<string, string>>()
    .notNull()
    .default(sql`'{}'`),
  defaultProviderId: text('default_provider_id'),
  diagnostics: text('diagnostics', { mode: 'json' })
    .$type<{ enabled: boolean; debug_level_enabled: boolean }>()
    .notNull()
    .default(sql`'{"enabled":false,"debug_level_enabled":false}'`),
})

export const pipelineRuns = sqliteTable('pipeline_runs', {
  runId: text('run_id').primaryKey(),
  kind: text('kind').notNull(),
  actionId: text('action_id').notNull(),
  storyId: text('story_id'),
  startedAt: integer('started_at').notNull(),
  finishedAt: integer('finished_at'),
  outcome: text('outcome', { enum: ['completed', 'aborted', 'failed', 'recovered'] }),
})

export const dbSchema = { stories, branches, storyEntries, appSettings, pipelineRuns }
