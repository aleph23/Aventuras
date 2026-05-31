import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import { APP_SETTINGS_DEFAULTS } from '@/lib/db'
import { logger } from '@/lib/diagnostics'

// In-memory mirror of the app_settings singleton's config fields. Raw JSON —
// no Zod parse yet (not a v1 dep), so providers/profiles stay loosely typed.
type AppSettingsSnapshot = {
  providers: unknown[]
  profiles: unknown[]
  assignments: Record<string, string>
  defaultProviderId: string | null
}

type AppSettingsState = AppSettingsSnapshot & {
  apply: (snapshot: AppSettingsSnapshot) => void
  __reset: () => void
}

const DEFAULT_SNAPSHOT: AppSettingsSnapshot = {
  providers: APP_SETTINGS_DEFAULTS.providers,
  profiles: APP_SETTINGS_DEFAULTS.profiles,
  assignments: APP_SETTINGS_DEFAULTS.assignments,
  defaultProviderId: APP_SETTINGS_DEFAULTS.defaultProviderId,
}

const appSettingsStore = createStore<AppSettingsState>()((set) => ({
  ...DEFAULT_SNAPSHOT,
  apply: (snapshot) => set(snapshot),
  __reset: () => set(DEFAULT_SNAPSHOT),
}))

function useAppSettings<T>(selector: (s: AppSettingsSnapshot) => T): T {
  return useStore(appSettingsStore, selector as (s: AppSettingsState) => T)
}

function getAppSettings(): AppSettingsSnapshot {
  const s = appSettingsStore.getState()
  return {
    providers: s.providers,
    profiles: s.profiles,
    assignments: s.assignments,
    defaultProviderId: s.defaultProviderId,
  }
}

// Injected-read core: testable without sqlite — the boot wrapper supplies the
// db read. On a missing row or a read/parse throw, apply defaults so boot
// continues; the blocking recovery screen lands with Zod parsing.
export async function hydrateAppSettings(
  read: () => Promise<AppSettingsSnapshot | undefined>,
): Promise<void> {
  try {
    const row = await read()
    appSettingsStore.getState().apply(row ?? DEFAULT_SNAPSHOT)
  } catch (err) {
    logger.error('bootstrap.app_settings_hydrate_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    appSettingsStore.getState().apply(DEFAULT_SNAPSHOT)
  }
}

export const appSettings = {
  useAppSettings,
  getAppSettings,
  __reset: appSettingsStore.getState().__reset,
}

export { appSettingsStore }
export type { AppSettingsSnapshot, AppSettingsState }
