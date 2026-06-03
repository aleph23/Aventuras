import type { TxState } from '@/lib/stores'

import { getPipeline } from '../authoring/registry'

// True while any in-flight run declares hard-gate, or a prose reversal is
// sweeping (a concurrent edit can't insert a delta into the sweep's await windows).
export function isUserEditBlocked(txState: TxState): boolean {
  if (txState.reversalInProgress) return true
  return [...txState.runs.values()].some((r) => getPipeline(r.kind).gateBehavior === 'hard-gate')
}
