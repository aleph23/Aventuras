# Wide-table scroll containment

When a table has more columns / wider content than the available
viewport width (typical example: probe per-type score tables with
13 columns, entity involvements, happenings columns), the
horizontal scroll **must** be scoped to a per-table wrapper
element — **not** allowed to bubble out to the surrounding
surface.

## How it should behave

The table wrapper has its own `overflow-x: auto`; the chrome
around it (diff banner, funnel summary, filter chips, tabs
strip, top-bar) stays anchored. Only the table cells slide
horizontally as the user scrolls within the table's own
scrollbar.

## What goes wrong if you skip this

A bare `<table>` with content wider than its parent forces the
parent to widen — the scroll moves to whichever ancestor has
overflow set, often the viewport itself. Filter chips, banners,
headers all scroll off the top-left as a block. User loses
orientation; expensive chrome elements (sticky tabs, diff banner)
become useless.

## How to apply

- Any table whose intrinsic content width can exceed the
  available column / surface width MUST live inside a wrapper
  element with `overflow-x: auto` (or equivalent scoped scroll).
- The wrapper needs to be sized by the layout (grid
  `minmax(0, 1fr)` cell, flex item with `min-width: 0`, etc.), so
  its own width doesn't itself expand to content.
- This applies whether or not the table currently overflows in
  any tested viewport — the rule is about not letting it leak,
  even at the narrowest tier.
- Wireframes should demonstrate the pattern (wrapping every wide
  table, not just the "main" one) so implementations don't
  inherit a half-applied pattern.

Surfaced on the memory-probe wireframe — the happenings tab table
wasn't wrapped, so scrolling horizontally took the diff banner
and funnel summary off-screen. The entities tab worked correctly
because it was wrapped in `.sim-col > .table-wrap` with
`overflow-x: auto`.
