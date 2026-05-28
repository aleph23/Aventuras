# State-layer hover works on neutral surfaces only; filled surfaces use opacity

The project's `--tint-hover` / `--tint-press` slots are state-layer
tints designed to **replace a neutral background**. Applied to a
filled surface (e.g. selected Chip with `bg-fg-primary`, Button's
`primary` / `destructive` variants), the tint replaces the fill on
hover rather than layering — the bg flips to the tint color while
the text stays inverted. Result: visible color inversion
(light-over-light on dark theme, etc.).

## Pattern

- **Neutral / outline / transparent surface** → state-layer
  (`hover:bg-tint-hover` / `active:bg-tint-press`).
- **Filled surface** → opacity reduction (`hover:opacity-90` /
  `active:opacity-90`). Matches Button's `destructive` variant
  precedent.

For primitives with both states (toggleable Chip), gate per state:

```tsx
interactive && (selected ? 'active:opacity-90' : 'active:bg-tint-press'),
Platform.select({
  web: cn(
    interactive && (selected ? 'hover:opacity-90' : 'hover:bg-tint-hover'),
    ...
  ),
}),
```

## How to apply

Before adding `bg-tint-hover` / `bg-tint-press` to any primitive,
check whether the base surface is filled or neutral. If filled, use
opacity. If conditionally filled (selected / unselected), gate the
hover / press classes on the state.

Surfaced during Chip primitive review — applying state-layer
uniformly inverted selected chips. Diverged from the SwitchRow
pattern (which is always neutral, so always state-layer).
