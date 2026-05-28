# Drag-height constant drift — measure or enforce, never guess

When building a custom drag-reorder that uses `translateY: ±ROW_H`
on sibling rows, the assumed `ROW_H` constant **must** match the
actual rendered slot delta exactly. Drift between assumed and
actual size produces a release-time visual snap of magnitude
`(actual - assumed)` that no amount of animation tuning hides.

Six iterations of the SuggestionCategoriesEditor drag impl chased
the wrong vector (timing, easing match, useLayoutEffect bridge,
spring vs timing) before realizing `PHONE_ROW_HEIGHT_PX = 56` was
a guess and the actual row was 45px (44px inner + 1px AccordionItem
border). Transforms of `-56` against a 45px-tall slot left
siblings 11px above their natural target; the bridge then cleared
the transform and they visually "dropped" 11px to land at the slot.

## Always measure or enforce

For uniform-height drag systems: either compute heights via
`onLayout` per row (variable-height support), or hard-set the
inner content's `height: N` style and derive the transform
constant from `N + border + padding`. Don't guess the constant.

For `SuggestionCategoriesEditor` specifically: see the paired
`PHONE_ROW_CONTENT_HEIGHT_PX = 44` (forced on inner row) +
`PHONE_ROW_BORDER_PX = 1` (AccordionItem) + derived
`PHONE_ROW_HEIGHT_PX = 45`.

## Debugging discipline

When a release-time visual artifact is described as "few pixels",
that magnitude almost always points to a constant-vs-actual
mismatch, not an animation timing issue. Measure first.

Related: [Substrate fragment layout leak](./substrate-fragment-layout-leak.md)
— other native layout gotcha at the substrate level.
