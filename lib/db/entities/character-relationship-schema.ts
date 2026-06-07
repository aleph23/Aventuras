import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { characterRelationships } from './entities.table'

export const characterRelationshipWriteSchema = createInsertSchema(characterRelationships, {
  kind: z.string().min(1).nullable().optional(),
  inverseKind: z.string().min(1).nullable().optional(),
}).omit({ id: true, branchId: true, createdAt: true, updatedAt: true })

export type CharacterRelationshipWrite = z.infer<typeof characterRelationshipWriteSchema>
