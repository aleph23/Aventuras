import { z } from 'zod'

const injectionMode = z.enum(['always', 'auto', 'disabled'])

// Writable (delta-logged) lore columns. Operational (embedding_stale, timestamps)
// and immutable (id, branch_id) columns are validated by Drizzle types, not here.
export const loreWriteSchema = z.object({
  title: z.string(),
  body: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  injectionMode,
  priority: z.number().int().min(0).max(100).default(0),
})

export type LoreWrite = z.infer<typeof loreWriteSchema>
