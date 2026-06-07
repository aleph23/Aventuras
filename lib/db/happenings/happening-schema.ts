import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { happenings } from './happenings.table'

const emptyToNull = (v: unknown) => (v === '' ? null : v)

export const happeningWriteObject = createInsertSchema(happenings, {
  occurredAtEntryId: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  temporal: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  commonKnowledge: z.union([z.literal(0), z.literal(1)]).optional(),
}).omit({ id: true, branchId: true, embeddingStale: true, createdAt: true, updatedAt: true })

// occurred_at_entry_id and temporal are mutually exclusive — the friendlier surface
// over the DDL CHECK, which only rejects non-null/non-null (so '' must become null first).
export const happeningWriteSchema = happeningWriteObject.refine(
  (v) => v.occurredAtEntryId == null || v.temporal == null,
  {
    message: 'occurred_at_entry_id and temporal are mutually exclusive',
    path: ['occurredAtEntryId'],
  },
)

export type HappeningWrite = z.infer<typeof happeningWriteSchema>
