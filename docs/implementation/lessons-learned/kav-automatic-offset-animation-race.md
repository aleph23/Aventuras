# `react-native-keyboard-controller` KAV — `automaticOffset` races layout animations

`react-native-keyboard-controller`'s
`<KeyboardAvoidingView automaticOffset>` resolves its screen
position **once** at mount via a native `viewPositionInWindow` call
inside `onLayout`. If the KAV is mounted inside a Reanimated
layout-entering animation (e.g., Sheet's
`SlideInDown.duration(250)`), `viewPositionInWindow` fires while
the container is still mid-translate, capturing a stale screen
position. Transform-only animations don't re-trigger `onLayout`,
so the lib never re-measures — the stale frame is baked in
permanently.

## Why

Surfaced wiring `react-native-keyboard-controller` into the Sheet
primitive. The lib's bundled KAV with
`behavior='padding' automaticOffset` produced a first-keyboard-open
flicker after every Sheet open: wrong `paddingBottom` computed
against the mid-animation frame, the resulting reflow triggered a
fresh `onLayout`, second pass corrected. Sequence-of-events
diagnosis: open Sheet → flicker on first focus → focus a second
input or refocus → smooth; close + reopen Sheet → flickers again on
first focus. That signature is the giveaway.

## How to apply

For containers that animate in via transform (Reanimated
`SlideInDown` / `SlideInRight` / `FadeIn` / etc.), do NOT rely on
the lib's `KeyboardAvoidingView automaticOffset`. Instead, drive
`paddingBottom` (or `translateY`) directly off
`useReanimatedKeyboardAnimation()`'s `height` SharedValue:

```tsx
const keyboard = useReanimatedKeyboardAnimation()
const animatedStyle = useAnimatedStyle(() => ({
  flex: 1,
  paddingBottom: -keyboard.height.value, // height is negative when keyboard is open
}))
return <Animated.View style={animatedStyle}>{children}</Animated.View>
```

This works when the container's relationship to the keyboard is
**structurally known** — e.g., a Sheet anchored at `bottom: 0`
always has keyboard overlap = keyboard height, no screen-position
math needed. The lib's KAV is for cases where the container could
be anywhere on screen and needs runtime measurement to compute
overlap.

`KeyboardContext` still needs to be re-provided inside any
`@rn-primitives/{dialog,popover,portal}` Portal — see
[rn-primitives Portal context](./rn-primitives-portal-context.md) —
because `useReanimatedKeyboardAnimation` reads from the same
context as the KAV.

Don't try to "fix" this by re-mounting the KAV with a `key` prop
tied to animation completion — that still races because the
keyboard-context lib measures during the next animation cycle if
remount fires on every open.

> **Note (2026-05-28):** Sheet has since migrated to
> `@gorhom/bottom-sheet`, which handles keyboard avoidance
> natively. The KAV-from-`react-native-keyboard-controller`
> pattern still applies to **other** transform-animated containers
> that need keyboard avoidance.
