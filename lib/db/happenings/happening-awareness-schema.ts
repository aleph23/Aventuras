import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { happeningAwareness } from './happenings.table'

// retrieval_count is a ranker-owned operational counter (M3); not a write field here.
export const happeningAwarenessWriteSchema = createInsertSchema(happeningAwareness, {
  decayResistance: z.number().min(0).max(1).nullable().optional(),
}).omit({ id: true, branchId: true, retrievalCount: true })

export type HappeningAwarenessWrite = z.infer<typeof happeningAwarenessWriteSchema>
