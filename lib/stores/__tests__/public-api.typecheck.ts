// Not a runtime test (no .test.ts) — `pnpm typecheck` validates it. If any raw
// store handle ever leaks onto the lib/stores public API, LeakedHandles becomes
// non-never and the assertion below fails to compile.
//
// `import type * as` is the only way to obtain the full module-export type
// without inline `import()` annotations (banned by consistent-type-imports).
// eslint-disable-next-line no-restricted-syntax
import type * as StoresIndex from '@/lib/stores'

type PublicApi = typeof StoresIndex
type RawHandle = 'generationStore' | 'appSettingsStore' | 'navigationStore'
type LeakedHandles = Extract<keyof PublicApi, RawHandle>

export const _assertNoStoreHandleLeak: [LeakedHandles] extends [never]
  ? true
  : ['LEAKED — raw handle is exported from lib/stores', LeakedHandles] = true
