# Substrate must emit exactly one React element — Fragments leak layout siblings

`SearchableOverlayList` previously returned `<>{trigger}<Sheet/></>`
from its phone branch. `@rn-primitives/dialog` Root renders a
default `<View>` on native, so the Fragment leaked two layout
siblings into the consumer's parent — `flex-row justify-between`
parents then saw THREE flex children and pinned the invisible Sheet
View to the trailing edge, floating the trigger mid-row.

## Resolved at the substrate

The phone branch now wraps in a single
`<View className={props.className}>`. Substrate always emits exactly
ONE React element on every tier / shape — `Shape1Inline`'s outer
ref-wrapper, the new phone wrap inside `Shape2Dialog`, and
`Shape2Dialog`'s desktop `PopoverPrimitive.Root` all satisfy this.
Consumers can drop the menu / picker into any flex container
without an intermediary View.

## What changed for consumers

`ActionsMenu` no longer needs its `<View className="shrink-0">`
wrapper (the workaround that prompted this fix). `ProviderModelPicker`
keeps its `<View className={className}>` wrap, but only because it
surfaces a className passthrough — the layout-leak motivation is
gone.

## The general lesson

When the same per-consumer shim appears twice, lift it into the
substrate. The fix landed only after a second consumer hit the same
workaround. Trust the pattern.

Related: [`asChild` slot props](./aschild-slot-props.md) — other
substrate-trigger gotcha that's still consumer-side.
