# Icon `fill="currentColor"` works on web, broken on Android

`<Icon as={Star} fill="currentColor" />` renders filled on web but
outlined on Android. `currentColor` is an SVG keyword RN-Web honors
via the wrapping SVG color cascade, but `react-native-svg`'s `Path`
doesn't resolve it — `fill` ends up as an unparsed literal and the
glyph stays stroke-only.

## Fix

`components/ui/icon.tsx` extends `cssInterop` with
`nativeStyleToProp: { fill: true }`, so Tailwind `fill-warning` /
`fill-current` classes propagate from className to the SVG attribute
on both platforms. Always drive fill via the **className** path,
not the `fill` prop. Already corrected in picker FavoriteToggle and
story-card; future Star / Heart / etc. callers should follow the
same shape.

## Why

RN-SVG predates the `currentColor` adoption that React's web SVG
renderer takes for granted; the `cssInterop` mapping bridges the
gap by resolving the color in JS before it reaches the Path.

## How to apply

If a glyph should appear filled, pair the stroke class with its
fill counterpart (`text-warning fill-warning`,
`text-fg-primary fill-current`). Drop any explicit `fill=` prop —
it'll override the className-derived one and re-introduce the bug.

Related: [TextClassContext + bare strings](./textclasscontext-bare-strings.md)
(same `cssInterop` machinery, color-context flavor).
