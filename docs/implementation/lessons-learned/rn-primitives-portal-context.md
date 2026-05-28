# rn-primitives' native Portal drops custom contexts

`@rn-primitives/popover`, `@rn-primitives/dialog`, and
`@rn-primitives/portal` on **native** drop arbitrary React
contexts — the portaled subtree mounts under the PortalHost
component, not under the original render call-site. rn-primitives'
own contexts (e.g. `useRootContext`) are wired through internally
and stay accessible, but any custom `Context.Provider` you wrap
around the primitive **does not** reach components rendered inside
`<Foo.Portal>`.

**Symptom.** A custom hook like `useMyContext()` throws "must be
rendered inside `<Provider>`" the moment the overlay opens on
Android (web sometimes works because React Web's `createPortal`
preserves context — the failure is native-specific).

## Two patterns that work

1. **Resolve outside the portal, pass as props.** Call the custom
   hook in the body of the _outer_ component (the one above the
   Portal element), then thread the values down to inner
   components via props.
2. **Re-provide inside the portal.** Capture the context value
   above the Portal, then render `<MyContext.Provider value={captured}>`
   _inside_ the portaled tree so descendants can still call the
   hook.

## Worked example

`SheetContent` reads `useSheetA11y()` _before_
`<DialogPrimitive.Portal>` and passes `ariaLabel` /
`ariaLabelledBy` / `ariaDescribedBy` / focus-handler values into
`SheetPanel` as props. Popover never hit this gotcha because its
existing `PopoverContent` already followed pattern 1 by coincidence
— the hook was already called in the body, before the Portal.

## How to apply

When adding a custom `Context.Provider` that wraps an rn-primitives
overlay primitive (Popover / Sheet / Dialog / Tooltip / etc.),
audit every consumer hook call site: if any is _inside_ a
`<...Portal>` element, refactor to pattern 1 (cleaner — explicit
data flow) or pattern 2 (defensive — any future descendant can
still use the hook).

Related: [Native dep Expo link](./native-dep-expo-link.md) for the
other Expo / native-side gotcha that came up the same day.
