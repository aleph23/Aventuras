import type { DiffPayload, EntitySummary, ScalarField } from './collision-resolve-diff'

export type MergeState = {
  canonicalId: string
  fieldChoices: Record<ScalarField, 'A' | 'B'>
  deselectedTags: string[]
}

export type MergeAction =
  | { type: 'pick-canonical'; id: string; entityAId: string }
  | { type: 'pick-field'; field: ScalarField; side: 'A' | 'B' }
  | { type: 'toggle-tag'; tag: string }
  | {
      type: 'reset'
      diff: DiffPayload
      defaultCanonicalId: string
      entityA: EntitySummary
      entityB: EntitySummary
    }

function sideForCanonical(canonicalId: string, entityAId: string): 'A' | 'B' {
  return canonicalId === entityAId ? 'A' : 'B'
}

function fieldChoicesForCanonical(
  diff: DiffPayload,
  side: 'A' | 'B',
): Record<ScalarField, 'A' | 'B'> {
  const result: Partial<Record<ScalarField, 'A' | 'B'>> = {}
  for (const field of diff.divergentScalars) {
    result[field] = side
  }
  return result as Record<ScalarField, 'A' | 'B'>
}

export function initMergeState(
  diff: DiffPayload,
  defaultCanonicalId: string,
  entityA: EntitySummary,
  _entityB: EntitySummary,
): MergeState {
  const side = sideForCanonical(defaultCanonicalId, entityA.id)
  return {
    canonicalId: defaultCanonicalId,
    fieldChoices: fieldChoicesForCanonical(diff, side),
    deselectedTags: [],
  }
}

export function mergeReducer(state: MergeState, action: MergeAction): MergeState {
  switch (action.type) {
    case 'pick-canonical': {
      // Rebase every divergent scalar to the new canonical's side.
      // entityAId comes in via the action so we don't need entity
      // references in the reducer. Preserve deselectedTags (tag
      // choices are independent of canonical pick).
      const newSide = sideForCanonical(action.id, action.entityAId)
      const fields = Object.keys(state.fieldChoices) as ScalarField[]
      const nextChoices: Partial<Record<ScalarField, 'A' | 'B'>> = {}
      for (const f of fields) nextChoices[f] = newSide
      return {
        ...state,
        canonicalId: action.id,
        fieldChoices: nextChoices as Record<ScalarField, 'A' | 'B'>,
      }
    }
    case 'pick-field': {
      return {
        ...state,
        fieldChoices: { ...state.fieldChoices, [action.field]: action.side },
      }
    }
    case 'toggle-tag': {
      const has = state.deselectedTags.includes(action.tag)
      return {
        ...state,
        deselectedTags: has
          ? state.deselectedTags.filter((t) => t !== action.tag)
          : [...state.deselectedTags, action.tag],
      }
    }
    case 'reset': {
      return initMergeState(action.diff, action.defaultCanonicalId, action.entityA, action.entityB)
    }
  }
}
