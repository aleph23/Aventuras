import { and, eq } from 'drizzle-orm'

import { entities, type Entity } from '@/lib/db'
import { entitiesStore } from '@/lib/stores'

import type { DbCtx } from '../types'

type OperationalFlags = Partial<{ embeddingStale: boolean; nameCollisionFlag: boolean }>

// Non-delta write seam for the compute-lifecycle columns
export async function setEntityOperationalFlags(
  branchId: string,
  id: string,
  flags: OperationalFlags,
  ctx: DbCtx,
): Promise<void> {
  const set: Partial<Pick<Entity, 'embeddingStale' | 'nameCollisionFlag'>> = {}
  if (flags.embeddingStale !== undefined) set.embeddingStale = flags.embeddingStale ? 1 : 0
  if (flags.nameCollisionFlag !== undefined) set.nameCollisionFlag = flags.nameCollisionFlag ? 1 : 0
  if (Object.keys(set).length === 0) return
  await ctx.runInTransaction([
    ctx.db
      .update(entities)
      .set(set)
      .where(and(eq(entities.branchId, branchId), eq(entities.id, id)))
      .toSQL(),
  ])
  entitiesStore.patch(branchId, { op: 'update', id, columns: set })
}
