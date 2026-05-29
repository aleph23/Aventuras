import { eq } from 'drizzle-orm'
import { useEffect } from 'react'

import { APP_SETTINGS_SINGLETON_ID, appSettings, db } from '@/lib/db'

import { diagnosticsStore } from './store'

type DiagnosticsSettings = { enabled: boolean; debug_level_enabled: boolean }

// `read` is injected so the gate logic is unit-testable without sqlite — and
// without lib/diagnostics deep-importing lib/db's test helper, which the
// boundaries rule would reject.
export async function hydrateDiagnostics(
  read: () => Promise<DiagnosticsSettings | undefined>,
): Promise<void> {
  const settings = await read()
  // pnpm dev forces the gate ON without a DB read; production builds honor the
  // stored value. Applied here, not at module load, so node tests stay OFF.
  const devForceOn = typeof __DEV__ !== 'undefined' && __DEV__
  const store = diagnosticsStore.getState()
  store.setEnabled(devForceOn || (settings?.enabled ?? false))
  store.setDebugEnabled(settings?.debug_level_enabled ?? false)
}

export function useDiagnosticsHydration(ready: boolean): void {
  useEffect(() => {
    if (!ready) return
    void hydrateDiagnostics(async () => {
      const rows = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.id, APP_SETTINGS_SINGLETON_ID))
      return rows[0]?.diagnostics
    })
  }, [ready])
}
