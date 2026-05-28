# TextClassContext only flows through `<Text>` — bare strings render uncolored

Many primitives in this project (Button, AlertDialog Action /
Cancel, Accordion Trigger, Tabs Trigger, Tag, Chip when given
children) cascade their text color via `TextClassContext.Provider`.
The `<Text>` component reads the context and applies it. **A bare
string child doesn't render through `<Text>`** — it renders as a
raw text node in the DOM with no inherited color, falling through
to the browser default (typically black).

Symptom: the wrapping primitive looks correct (background, border,
etc.) but the label text is wrong-colored. Most visible on filled
buttons or dark backgrounds where the label should be inverted.

**Wrong:**

```tsx
<Button variant="destructive">Delete</Button>
<AlertDialogTrigger asChild>
  <Button variant="secondary">Open</Button>
</AlertDialogTrigger>
```

**Right:**

```tsx
<Button variant="destructive"><Text>Delete</Text></Button>
<AlertDialogTrigger asChild>
  <Button variant="secondary">
    <Text>Open</Text>
  </Button>
</AlertDialogTrigger>
```

For primitives that cascade text styling (active / inactive Tabs,
Accordion trigger context), the same applies — wrap label children
in `<Text>` so the inherited `cn()` value (color, weight, size)
actually lands.

## How to apply

When writing stories / dev pages / consumers of primitives that
have a `TextClassContext.Provider` in their implementation, always
wrap label children in `<Text>`.

When implementing a new primitive that uses `TextClassContext`,
ensure its `value=` includes a color slot (e.g. `text-fg-primary` /
`text-fg-muted`) — context value alone without a color leaves
`<Text>` falling through to its no-context fallback.

Related: [Icon fill currentColor](./icon-fill-currentcolor.md)
(same cssInterop machinery, color-context flavor).
