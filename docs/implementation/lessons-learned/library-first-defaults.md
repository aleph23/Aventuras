# Library-first defaults — use the library correctly before rewriting it

When a battle-tested library throws a known warning or error
(e.g., RN's "VirtualizedLists should never be nested inside plain
ScrollViews"), the first instinct must be: **read the library's
issue tracker / docs for the documented workaround**. These warnings
are universal; the library author has almost certainly addressed
them.

## Why

The `react-native-draggable-flatlist` rewrite (Unit 8 of component
prep) burned 8+ iterations of custom Reanimated + gesture-handler
work after hitting the VirtualizedList-in-ScrollView warning. The
library shipped two documented fixes for this exact scenario
(`scrollEnabled={false}` for bounded-small lists, or
`ListHeaderComponent` / `ListFooterComponent` to make the list the
root scroll). Picking either would have cost minutes; the rewrite
cost hours plus three follow-up lessons documenting traps the
library already handles correctly
([Drag height constant drift](./drag-height-constant-drift.md),
[rn-primitives Portal context](./rn-primitives-portal-context.md)
adjacent, shared-Accordion `LinearTransition` slide).

## How to apply

1. When a library throws a warning, before reaching for "let's
   write our own," **search the library's GitHub issues for the
   exact warning text**. If the maintainer has commented on it,
   that's the canonical fix.
2. When the user says "I'd rather we do it correctly," interpret
   that as "use the library properly," not "rewrite from scratch"
   — unless they explicitly call for the rewrite. Ask if unsure.
3. Custom impls of well-trodden UX (drag-reorder, keyboard
   handling, infinite scroll, virtualization) are nearly always
   worse than the library in subtle ways (transform-vs-layout
   sync, accessibility, edge cases like fling momentum,
   auto-scroll-on-drag). The library author has hit those edges;
   you haven't.
4. The "zero dependency cost" win of a custom impl is almost
   always wiped out by the cost of maintaining the subtle
   correctness it now lacks.

Treat this as load-bearing for future "should we just build this
ourselves?" moments.
