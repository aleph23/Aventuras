import { eq } from 'drizzle-orm'
import { useEffect } from 'react'

import { APP_SETTINGS_SINGLETON_ID, appSettings as appSettingsTable, db } from '@/lib/db'

import { hydrateAppSettings } from './app-settings'

// Boot wrapper: injects the singleton-row read into the testable core.
// Non-blocking — no M1 surface waits on the mirror, so it fills the store
// shortly after the tree mounts.
export function useAppSettingsHydration(ready: boolean): void {
  useEffect(() => {
    if (!ready) return
    void hydrateAppSettings(async () => {
      const rows = await db
        .select()
        .from(appSettingsTable)
        .where(eq(appSettingsTable.id, APP_SETTINGS_SINGLETON_ID))
      const row = rows[0]
      if (!row) return undefined
      return {
        providers: row.providers,
        profiles: row.profiles,
        assignments: row.assignments,
        defaultProviderId: row.defaultProviderId,
      }
    })
  }, [ready])
}
