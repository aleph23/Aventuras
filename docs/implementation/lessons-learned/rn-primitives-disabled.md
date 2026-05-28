# rn-primitives `disabled` doesn't fully gate clicks on web — use inline `pointerEvents`

Wrappers around `@rn-primitives/*` + Radix on web don't fully forward
`disabled` to Radix's `onClick`. The rn-primitives Trigger forwards
`disabled` to the inner `Pressable` + Radix's `Trigger`, but Radix
attaches its `onClick` to the same DOM element via Slot's
`mergeProps`. `Pressable.disabled` only gates `Pressable`'s own
`onPress` — the Radix-side `onClick` fires regardless. Visible state
looks disabled but click still toggles.

`className="pointer-events-none"` doesn't reliably work either
(NativeWind / inline-style ordering). The foolproof gate is **inline
style at the DOM level**:

```tsx
style={
  Platform.OS === 'web' && props.disabled
    ? ({ pointerEvents: 'none' } as never)
    : undefined
}
```

This kills both `Pressable`'s `onPress` and Radix's `onClick`. Side
effect: `pointer-events: none` also prevents `:hover`, so
`cursor: not-allowed` won't display either — drop it from the
disabled className. Visual disabled cue: `opacity-50` driven directly
off the prop (Tailwind's `disabled:` variant doesn't fire when the
rendered web element is a `View` / `div` rather than a `button`).

## How to apply

Any primitive wrapping rn-primitives + Radix where the trigger is
`<View>` / `<div>` on web and `disabled` should block clicks — wire
the same inline-style gate, and drop className-based
pointer-events and `cursor-not-allowed`.

Confirmed on Tabs and Accordion during primitive review; likely the
same shape on Dialog, Popover, and any focusable / clickable
trigger.
