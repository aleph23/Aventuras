# `asChild` slot props need rest-spreading

When a custom component is wrapped with `<X.Trigger asChild>`,
`<X.Close asChild>`, `<PopoverTrigger asChild>`, etc., Radix /
rn-primitives Slot clones the child and injects: a `ref` for
positioning, an `onPress` / `onClick` to drive open / close, and
`aria-*` attributes (`aria-expanded`, `aria-controls`,
`aria-haspopup`, etc.). The injected props are passed as **regular
props** to the child component (React 19 made `ref` a regular
prop). If a function component destructures specific names and
doesn't spread the rest onto the underlying DOM / RN primitive,
all those injected props get **silently dropped**.

**Symptom.** On web the popover opens but renders as an unanchored
1280×0 wrapper at the viewport edge, content collapses. Floating
UI couldn't measure the trigger so it positioned at a fallback. On
native it may still work (rn-primitives' native trigger uses
different anchoring) — this is a web-bites-only bug, easy to ship
by accident.

## Fix

Always spread an unknown-rest object onto the underlying primitive:

```tsx
type MyButtonProps = Omit<ComponentProps<typeof Pressable>, 'onPress'> & {
  // ...custom props
}

function MyButton({ a, b, c, ...slotProps }: MyButtonProps) {
  return <Pressable {...intrinsicProps} {...slotProps} /> // slot last so it wins on collisions
}
```

The project's `Button` (`components/ui/button.tsx`) is the
reference pattern — it spreads `{...props}` onto `Pressable` after
its own classNames / accessibility defaults. Any custom
`Pressable` wrapper used inside an `asChild` slot needs the same
shape.

**Worked example.** ColorPicker's `SwatchButton` dropped the slot
— popover invisible on web, fine on mobile because phone uses
Sheet with controlled open (no slot involved).

Related: [rn-primitives Portal context](./rn-primitives-portal-context.md)
for the other rn-primitives gotcha from the same session.
