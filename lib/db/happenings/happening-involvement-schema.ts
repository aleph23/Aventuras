import { createInsertSchema } from 'drizzle-zod'
import type { z } from 'zod'

import { happeningInvolvements } from './happenings.table'

export const happeningInvolvementWriteSchema = createInsertSchema(happeningInvolvements).omit({
  id: true,
  branchId: true,
})

export type HappeningInvolvementWrite = z.infer<typeof happeningInvolvementWriteSchema>
