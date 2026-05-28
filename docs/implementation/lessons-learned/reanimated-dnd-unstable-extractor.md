# `react-native-reanimated-dnd` — leave `itemKeyExtractor` inline

`useSortableList` from `react-native-reanimated-dnd` accepts an
`itemKeyExtractor` whose identity is in the dep array of the
internal data effect that resyncs `itemHeights` from `data`. With
an inline arrow (`itemKeyExtractor: (item) => item.id`) the
extractor identity churns and the effect re-runs every render —
wasteful, but apparently load-bearing.

## Why

Lifting the extractor to a module-level constant (or
`useCallback([])`) reduces the effect to firing only on actual
`data` changes. In the Aventuras `SuggestionCategoriesEditor`
Reset-to-seed case, this caused fresh-mounted rows to render
under-measured (probably a race between the render-time
`runOnUISync` positions write and the lib's data effect — the
previous extra re-runs of the effect masked it). Result: visible
row count fewer than `data.length`, expanding one made others
appear.

## How to apply

Don't "optimise" `itemKeyExtractor` to a stable reference for this
lib. Leave it inline. Performance cost is small (extra effect runs
on phone path for small N) and the alternative ships a visual
regression. Same likely holds for the lib's other
`useXxxSortableList` hooks (`useHorizontalSortableList`,
`useGridSortableList`) — same `useEffect([data, ..., itemKeyExtractor])`
pattern across all of them.

If the underlying issue actually needs fixing: instrument the data
effect vs `runOnUISync` write ordering and look for a state where
`itemHeightsSV.value` ends up shorter than `categories.length`.

Related: [Reanimated 4 async SV write](./reanimated4-async-sv-write.md).
