# Searchable overlay list — extracting the shared substrate

Design session record, 2026-05-22. Outcome: a new canonical pattern
doc, [`searchable-overlay-list.md`](../ui/patterns/searchable-overlay-list.md),
plus consumer-doc reconciliation. This record keeps the decision
rationale, the adversarial pass, and the integration plan; the
component spec is canonical in the pattern doc.

## Problem

Three patterns — [`Autocomplete-with-create`](../ui/patterns/forms.md#autocomplete-with-create-primitive),
[`provider-model-picker`](../ui/patterns/provider-model-picker.md),
and the [`Actions menu`](../ui/patterns/actions-menu.md) — each
describe composing an "Autocomplete substrate": per-tier
Popover/Sheet dispatch, type-to-filter, a virtualized list. It
existed only as a doc-level phrase, never a component.
[`followups.md`](../followups.md) flagged the extraction, with the
seam called out explicitly: `Autocomplete-with-create`'s trigger is
its own input, unlike the other two.

Build state at design time: `Autocomplete` is **shipped**
(`components/ui/autocomplete.tsx`, already virtualized);
`ProviderModelPicker` and `ActionsMenu` are **build-ready** (specced,
not built). The extraction therefore refactors one shipped component
and lets the other two be built against the substrate from the
start — far cheaper than reconciling three shipped components later.

## The finding — a 1 + 2 split that collapses on phone

The three consumers split **1 + 2** by ARIA pattern:

- **`Autocomplete-with-create`** is a _combobox_ — the text input
  you type into is itself the trigger and the search field; the
  overlay below holds only the list.
- **`provider-model-picker`** and the **`Actions menu`** are a
  _dialog-with-search-inside_ — a separate trigger (a button, or the
  `⚲` icon and `Cmd-K`) opens an overlay that _contains_ the search and
  list.

But **on phone all three converge** — each is a bottom Sheet with the
search field pinned at the top and the list scrolling below. The
divergence is desktop/tablet-only, and it is exactly one axis: does
the search input render at the trigger position, or inside the
overlay?

| Axis                  | Autocomplete       | provider-model-picker             | Actions menu            |
| --------------------- | ------------------ | --------------------------------- | ----------------------- |
| Trigger               | the input itself   | form-control button               | `⚲` icon + `Cmd-K`      |
| Search home — desktop | at trigger         | inside overlay                    | inside overlay          |
| Search home — phone   | top of Sheet       | top of Sheet                      | top of Sheet            |
| Grouping              | flat + tail row    | Favorites-pinned + provider sects | two zones + 3 core grps |
| Create affordance     | inline `+ Add new` | sticky footer composer            | none                    |
| Activation result     | commit `string`    | commit `ModelRef`                 | fire command            |

The shared core is large: per-tier Popover/Sheet dispatch, the
virtualized filtered list, keyboard highlight nav, no-results state,
sectioned-data rendering. The divergent surface — trigger, grouping,
create, row shape, commit shape — is either consumer-owned data or an
additive slot. The one genuinely structural divergence is
search-input placement.

## Approach

Three were weighed:

- **A — one component, `searchPlacement` as one structural mode.**
  A single `SearchableOverlayList`; `searchPlacement` is a
  two-value mode; trigger, footer, and rows are slots. All three
  are direct consumers.
- **B — headless core + rendered shells.** A `useSearchableOverlayList`
  engine with thin rendered components on top. Cleanest separation,
  but introduces a headless layer the codebase does not otherwise
  have (`Select` is an options-dispatcher, not headless) — more
  abstraction than a one-axis seam earns.
- **C — two components sharing an inner list.** Honest about the two
  ARIA shapes, but yields two top-level components when the followup
  wanted one, makes Autocomplete a sibling rather than a consumer,
  and shrinks the shared surface.

**Chosen: A.** The seam is narrow enough (one axis, desktop-only) that
B over-engineers it and C under-delivers on "one shared component." A
satisfies the followup literally and keeps the shared surface large.

## Component spec — `SearchableOverlayList`

The full spec is canonical in
[`searchable-overlay-list.md`](../ui/patterns/searchable-overlay-list.md):
the `searchPlacement` mode and ownership boundary, the API surface,
the two rendered shapes and their ARIA, the filter / keyboard /
lifecycle model, the consumer mapping, and the implementation notes.

In brief, what this session settled: one component, one structural
mode (`searchPlacement: 'as-trigger' | 'in-overlay'`). The substrate
owns per-tier Popover/Sheet dispatch, the search input, the
virtualized list, keyboard navigation, and the ARIA shape; consumers
own the trigger (in `in-overlay`), the filter predicate, the
`sections` data, row rendering, the footer, and the commit shape.
`searchPlacement` combined with the viewport tier yields two rendered
shapes — a combobox with a listbox popup (`as-trigger`,
desktop/tablet) and a dialog wrapping a combobox (every other
quadrant) — differing in only three deterministic switches: the outer
overlay role, the focus trap, and the trigger identity. The substrate
has no "create" concept and never filters; both stay consumer-side.

## Adversarial pass

The load-bearing thesis — _the divergence reduces to one structural
mode plus additive slots_ — was attacked and holds: selection-vs-command
semantics, idempotent re-select, and trigger richness are each
consumer-side or absorbed by the mode split. Three local findings
were folded into the canonical spec:

1. **`Row<T>` intersection was unsound.** An earlier draft used
   `Row<T> = { id; disabled? } & T`. Picker breaks it — two provider
   instances can carry the same `modelId`, so the natural identity is
   not globally unique, and a `T` with its own `id` field would
   silently merge. Fixed: nested `data: T`.
2. **`as-trigger` open behavior.** A uniform "query resets to `''`
   on open" rule is wrong for a combobox — the field must open
   showing its committed value, editable. Fixed: open behavior keyed
   off `searchPlacement` (reinforces the spine, no new prop).
3. **`autofocusSearch` value misnamed.** Actions autofocuses on
   tablet too; `'desktop-only'` lied. Renamed `'except-phone'`.

Verified clean: translation (zero substrate strings), cross-platform,
undo/backup (substrate is pure UI, no persisted state). Pre-existing
concern noted, not worsened: Picker's footer `Under:` dropdown
opening a Select-on-Sheet inside the substrate's Sheet — already
asserted resolved in the Picker doc; the substrate's content-agnostic
`renderFooter` neither worsens nor fixes it.

## Integration plan

**New file.**

- `docs/ui/patterns/searchable-overlay-list.md` — the canonical
  pattern doc carrying the component spec.

**Edited canonical docs.**

- `docs/ui/patterns/README.md` — add `searchable-overlay-list.md` to
  the Files index; re-point the `provider-model-picker` and
  `actions-menu` line descriptions from "Autocomplete substrate" to
  `SearchableOverlayList`.
- `docs/ui/patterns/forms.md` — `Autocomplete-with-create` section:
  collapse dropdown-surface / per-tier / virtualization prose to
  citations of the substrate; mark it a `'as-trigger'` consumer;
  keep the `## Autocomplete-with-create primitive` heading stable
  (inbound anchors). Update the `<ResponsiveOverlay>` note —
  resolved by the substrate.
- `docs/ui/patterns/provider-model-picker.md` — re-point "the
  Autocomplete substrate" to `SearchableOverlayList`; mark
  `'in-overlay'`; collapse per-tier-dispatch / search-bar prose to
  citations; note `escClearsQueryFirst: true`, `initialScrollRowId`,
  controlled `open`.
- `docs/ui/patterns/actions-menu.md` — re-point the "Open surface"
  section to `SearchableOverlayList`; mark `'in-overlay'`,
  `autofocusSearch: 'except-phone'`, `sheetSize`; collapse the
  combobox/listbox machinery in "Keyboard & ARIA" to a citation
  (keep Actions-specific zone `role="group"` + `aria-label`);
  **remove** the "Open questions → Generic substrate component" note.
- `docs/ui/patterns/overlays.md` — add `SearchableOverlayList` to the
  Used-by list; update the Popover "defer until a real consumer
  needs it" note to name the substrate as that consumer.
- `docs/ui/patterns/calendar-picker.md` — drop the incorrect
  "Composes Autocomplete substrate" phrase (calendar-picker rides
  `Select`, per its own resolution note). Minor correction, same
  term-confusion this design clears.
- `docs/ui/component-inventory.md` — add `SearchableOverlayList` to
  **Primitives — build-ready**; add an `Autocomplete` row to
  **Primitives — needs revision** (contract evolved: refactor
  `autocomplete.tsx` to compose `SearchableOverlayList` in
  `as-trigger` mode); re-point the `ProviderModelPicker` and
  `ActionsMenu` row notes to `SearchableOverlayList`.
- `docs/followups.md` — remove the lone UX entry (resolved).

**Renames swept.** "Autocomplete substrate" / the doc-concept "the
substrate" → `SearchableOverlayList` across the canonical docs above.
Explorations are frozen historical records — not touched.

**Patterns adopted on a new surface.** `searchable-overlay-list.md`
cites `overlays.md` (Popover + Sheet) → `overlays.md` Used-by gains
`SearchableOverlayList`. The three consumer docs newly cite
`searchable-overlay-list.md` → its own Used-by lists all three.

**Followups resolved.** The `followups.md` UX entry.
**Followups introduced.** None in `followups.md`. The `Autocomplete`
refactor is tracked via the inventory `needs-revision` row — the
established mechanism (as for `Sheet` / `Popover`), not a followup.

**Intentional repeated prose.** None. The substrate doc owns
canonical per-tier dispatch and the Shape-1/Shape-2 ARIA; consumer
docs cite, not restate. The Actions doc's "Keyboard & ARIA" section
in particular is cut to a citation, not duplicated.

**No wireframe.** `patterns/` docs are markdown-only; the substrate
has no standalone visual — its surfaces are the consumers'.
