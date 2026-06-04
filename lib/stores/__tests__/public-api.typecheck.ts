// Not a runtime test (no .test.ts) — `pnpm typecheck` validates it. The public
// per-store namespaces (generationStore, …) are plain selector/mutator objects;
// a raw zustand vanilla handle must never leak onto the lib/stores surface. If
// one does, Leaked becomes non-never and the assertion below fails to compile.
//
// `import type * as` is the only way to obtain the full module-export type
// without inline `import()` annotations (banned by consistent-type-imports).
// eslint-disable-next-line no-restricted-syntax
import type * as StoresIndex from '@/lib/stores'

type PublicApi = typeof StoresIndex
// A raw zustand vanilla store exposes setState/getState/subscribe; the public
// namespaces expose named selectors + mutators and never these handles.
type RawStoreLike = { setState: unknown; getState: unknown; subscribe: unknown }
type Leaked = {
  [K in keyof PublicApi]: PublicApi[K] extends RawStoreLike ? K : never
}[keyof PublicApi]

export const _assertNoStoreHandleLeak: [Leaked] extends [never]
  ? true
  : ['LEAKED — a raw zustand store handle is exported from lib/stores', Leaked] = true
