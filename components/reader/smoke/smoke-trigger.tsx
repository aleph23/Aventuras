// TODO(spine): smoke trigger — removed with the synthetic-story scaffolding
// (see docs/followups.md). Dev-only; labels intentionally un-i18n'd.
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { db, runInTransaction } from '@/lib/db'
import { domain } from '@/lib/stores'

import { runSmoke } from './run-smoke'

export function SmokeTriggerButton() {
  const inFlight = domain.useGeneration((s) => s.txState.runs.size > 0)
  const [outcome, setOutcome] = useState<string | null>(null)

  const onPress = async () => {
    const result = await runSmoke({ db, runInTransaction })
    if (result) setOutcome(result.outcome)
  }

  const label = inFlight ? 'Running…' : outcome ? `Smoke: ${outcome}` : 'Run smoke'

  return (
    <Button variant="secondary" onPress={onPress} disabled={inFlight}>
      <Text>{label}</Text>
    </Button>
  )
}
