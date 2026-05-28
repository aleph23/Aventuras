# Input adornment DOM identity — always render, toggle visibility

`components/ui/input.tsx` toggles between a bare `<TextInput>` (no
adornments) and a `<View>`-wrapped `<TextInput>` (with adornments)
based on whether `leading` or `trailing` is set. The decision is
per-render, so a `trailing={query ? <Pressable/> : undefined}`
pattern _unmounts and remounts_ the underlying TextInput on first
keystroke — every focus + cursor position is lost, external refs go
stale, layout shifts visibly.

**Symptom.** User can type exactly one character into a search-style
input, then the cursor disappears and subsequent keystrokes don't
register. Side effects can cascade (downstream state-sync paths run
on a focus-less input), so symptoms multiply: dropdown won't dismiss,
picked option doesn't reflect in the field, etc.

## Fix

Always render the adornment Pressable; toggle visibility via prop on
a stable element:

```tsx
function ClearButton({ visible, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!visible}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      className={cn('p-1 active:opacity-70', !visible && 'opacity-0')}
    >
      <Icon as={X} size="sm" className="text-fg-muted" />
    </Pressable>
  )
}

// usage:
trailing={<ClearButton visible={query.length > 0} onPress={() => onChange('')} />}
```

`components/ui/autocomplete.tsx` is the in-repo reference — its
inline `ClearButton` documents the same gotcha in a doc comment.
Any new search-style Input consumer (Autocomplete,
SearchableOverlayList, ProviderModelPicker, etc.) needs to follow
the pattern.

Discovered originally during Autocomplete's build; re-stepped in
SearchableOverlayList v1 — produced "type one char, cursor
disappears" plus a cluster of cascading state-sync symptoms that
all cleared once focus was sticky.

Related: [`asChild` slot props](./aschild-slot-props.md) and
[rn-primitives Portal context](./rn-primitives-portal-context.md)
for the other compound-component traps from the same component-build
sprint.
