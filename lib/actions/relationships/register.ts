import { and, eq } from 'drizzle-orm'

import type { CharacterRelationship } from '@/lib/db'
import { characterRelationships, characterRelationshipWriteSchema } from '@/lib/db'
import { generateId } from '@/lib/ids'
import { characterRelationshipsStore } from '@/lib/stores'

import { register, type ActionHandler } from '../delta/registry'
import type { DeltaSource } from '../types'

declare module '@/lib/actions/action-map' {
  interface PipelineActionMap {
    upsertCharacterRelationship: {
      source: DeltaSource
      payload: { branchId: string; subjectId: string; objectId: string; kind: string | null }
    }
    deleteCharacterRelationship: { source: DeltaSource; payload: { branchId: string; id: string } }
  }
}

const upsertHandler: ActionHandler = async (action, branchId, ctx) => {
  if (action.kind !== 'upsertCharacterRelationship')
    throw new Error(`handler/kind mismatch: ${action.kind}`)
  const { branchId: bid, subjectId, objectId, kind } = action.payload
  if (bid !== branchId)
    return { status: 'rejected', reason: `branch mismatch: delta ${branchId} vs target ${bid}` }
  if (subjectId === objectId) return { status: 'rejected', reason: 'self-relationship not allowed' }
  const parsed = characterRelationshipWriteSchema.pick({ kind: true }).safeParse({ kind })
  if (!parsed.success)
    return { status: 'rejected', reason: `invalid relationship kind: ${parsed.error.message}` }

  const [aId, bId] = subjectId < objectId ? [subjectId, objectId] : [objectId, subjectId]
  const subjectIsA = subjectId === aId
  const povCol = subjectIsA ? 'kind' : 'inverseKind'
  const otherCol = subjectIsA ? 'inverseKind' : 'kind'

  const [current] = await ctx.db
    .select()
    .from(characterRelationships)
    .where(
      and(
        eq(characterRelationships.branchId, bid),
        eq(characterRelationships.aId, aId),
        eq(characterRelationships.bId, bId),
      ),
    )

  if (!current) {
    if (kind === null) return { status: 'rejected', reason: 'no relationship to clear' }
    const now = Date.now()
    const row: CharacterRelationship = {
      id: generateId('rel'),
      branchId: bid,
      aId,
      bId,
      kind: subjectIsA ? kind : null,
      inverseKind: subjectIsA ? null : kind,
      createdAt: now,
      updatedAt: now,
    }
    return {
      status: 'ok',
      targetTable: 'character_relationships',
      targetId: row.id,
      op: 'create',
      undoPayload: null,
      ops: [ctx.db.insert(characterRelationships).values(row).toSQL()],
      patch: { op: 'create', id: row.id, row },
    }
  }

  // Nulling the last remaining POV would leave the row both-null (CHECK fails) → delete it.
  if (kind === null && current[otherCol] === null) {
    return {
      status: 'ok',
      targetTable: 'character_relationships',
      targetId: current.id,
      op: 'delete',
      undoPayload: { ...current },
      ops: [
        ctx.db
          .delete(characterRelationships)
          .where(
            and(
              eq(characterRelationships.branchId, bid),
              eq(characterRelationships.id, current.id),
            ),
          )
          .toSQL(),
      ],
      patch: { op: 'delete', id: current.id },
    }
  }

  const set = { [povCol]: kind }
  return {
    status: 'ok',
    targetTable: 'character_relationships',
    targetId: current.id,
    op: 'update',
    undoPayload: { [povCol]: current[povCol] },
    ops: [
      ctx.db
        .update(characterRelationships)
        .set(set)
        .where(
          and(eq(characterRelationships.branchId, bid), eq(characterRelationships.id, current.id)),
        )
        .toSQL(),
    ],
    patch: { op: 'update', id: current.id, columns: set },
  }
}

const deleteHandler: ActionHandler = async (action, branchId, ctx) => {
  if (action.kind !== 'deleteCharacterRelationship')
    throw new Error(`handler/kind mismatch: ${action.kind}`)
  const { branchId: bid, id } = action.payload
  if (bid !== branchId)
    return { status: 'rejected', reason: `branch mismatch: delta ${branchId} vs target ${bid}` }
  const [current] = await ctx.db
    .select()
    .from(characterRelationships)
    .where(and(eq(characterRelationships.branchId, bid), eq(characterRelationships.id, id)))
  if (!current)
    return { status: 'rejected', reason: `delete target relationship ${bid}:${id} not found` }
  return {
    status: 'ok',
    targetTable: 'character_relationships',
    targetId: id,
    op: 'delete',
    undoPayload: { ...current },
    ops: [
      ctx.db
        .delete(characterRelationships)
        .where(and(eq(characterRelationships.branchId, bid), eq(characterRelationships.id, id)))
        .toSQL(),
    ],
    patch: { op: 'delete', id },
  }
}

export function registerCharacterRelationships(): void {
  register({
    table: 'character_relationships',
    descriptor: {
      table: characterRelationships,
      idCol: characterRelationships.id,
      branchCol: characterRelationships.branchId,
    },
    columnSchemas: {},
    handlers: {
      upsertCharacterRelationship: upsertHandler,
      deleteCharacterRelationship: deleteHandler,
    },
    patcher: (branchId, p) => characterRelationshipsStore.patch(branchId, p),
  })
}
