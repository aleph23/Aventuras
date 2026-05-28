# Reanimated 4 — JS-side shared-value writes are async on native

On native (Reanimated 4 `makeMutableNative`, see
`node_modules/react-native-reanimated/lib/module/mutables.js`),
writing to a shared value from the JS thread via `sv.value = X`
calls `scheduleOnUI(() => { mutable.value = newValue })` — the
JS-side cache isn't updated synchronously, and the next read calls
`runOnUISync` to fetch from the UI thread, which still has the old
value until it processes the scheduled write.

## Why

Order of events when `sv.value = X` runs during render and a child
reads it immediately:

1. The write schedules a UI-thread task (async).
2. React continues rendering, children mount.
3. Child's `useMemo([])` reads `sv.value` → JS getter calls
   `runOnUISync` → UI thread hasn't run the scheduled write yet →
   returns OLD value.
4. UI thread later processes the write; subsequent reads see the
   new value.

There's also a dev-mode warning ("Writing to value during component
render") that flags this pattern.

## How to apply

When a shared-value write needs to be visible to children mounting
in the same render — particularly when those children capture the
value in `useMemo` / `useSharedValue(...)` initial-value calls with
empty deps — wrap the write in `runOnUISync` so the UI thread
processes it synchronously before render proceeds:

```ts
import { runOnUISync } from 'react-native-worklets'

runOnUISync(() => {
  'worklet'
  sv.value = next
})
```

This blocks the JS thread until the UI thread completes the
worklet. Expensive in a hot loop; fine for infrequent reconciliation
writes (add / delete / sync). For frequent updates, restructure so
the SV is owned by the lib / hook that initialized it, not written
from outside.

Concrete instance: `components/compounds/suggestion-categories-editor.tsx`
— the lib's `useSortableList` initialises `positions` once; we sync
it on add / delete via `runOnUISync` because the new row's
`useSortable` reads positions in a `useMemo([])` at mount.

Related: [reanimated-dnd unstable extractor](./reanimated-dnd-unstable-extractor.md).
