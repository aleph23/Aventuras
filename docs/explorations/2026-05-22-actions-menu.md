# Actions menu — design pass

Session record, 2026-05-22. Resolves the
`Actions menu broader design pass` followup (removed from
[`followups.md`](../followups.md) by the same commit). Canonical
spec lands at
[`ui/patterns/actions-menu.md`](../ui/patterns/actions-menu.md);
this file is the frozen reasoning trail.

## Problem

The Actions menu (`⚲` / `Cmd-K`) has been a fixture of the chrome
since early design but never got a focused pass.
[`principles.md → Actions`](../ui/principles.md#actions--platform-agnostic-action-directory)
pins the _form_ in ~12 lines — platform-agnostic, desktop overlay
plus mobile bottom sheet, the label "Actions" — but never its
_content_ or _structure_. Concrete entries accreted across
exploration docs (`Open Diagnostics Hub`, `Open World` / `Open
Plot` / …, `Set lead character`, `Flip era…`, `Jump to top` /
`Jump to bottom`) without ever being consolidated: no inventory
pinned, no organizational model, no wireframe. The menu was
genuinely neglected — not a victim of scope creep, just never
designed.

This pass produces the canonical spec and the wireframe.

## What it is — decisions and rationale

### Hybrid two-zone menu

Three framings were weighed:

- **True command palette** — mirrors essentially every action the
  context supports, including screen-local ones; search-first
  because the list is long and dynamic.
- **Curated directory** — a deliberately small, stable set of
  cross-surface and global commands; search is a convenience.
- **Hybrid** — a curated global core _plus_ a screen-specific
  contextual zone.

**Hybrid chosen.** The decisive evidence: every scattered
candidate is a _deliberately redundant universal route_ —
`Flip era…` also lives in the time-chip popover, `Set lead
character` also in Story Settings, `Open World` also via the
Browse rail. The menu's job is to be the one place that reaches
everything, even things with another home. That argues for a
curated core. But the contextual zone is what makes the menu feel
alive per screen, so it earns first-class status rather than being
folded away.

The literal `principles.md` wording — "every action the current
context supports … settings, navigation, filters, tools" — is a
true-command-palette overclaim and gets corrected. Live filters
and sorts in particular are _not_ menu content (see the inclusion
test).

### The inclusion test

What earns a slot, in either zone: an action is menu-eligible iff
it is a **self-contained command** — invokable in one step,
operating on the story or the current screen as a whole, with no
pre-selected target and no dependence on a focused UI element.

Disqualified by construction:

- **Per-item actions** — need a target selected first (`Edit this
entry`, `Delete this entity`). No "this" without a selection.
- **Live view-state controls** — filter chips, sort toggles,
  search. These are display state, not discrete commands.

The test cleanly partitions the two zones: the **curated core** is
the self-contained commands that are _global_ (available
regardless of screen); the **contextual zone** is the
self-contained commands that are _screen-specific_. Curation stays
a per-screen judgment (a screen author lists their commands and
marks which are primary), but it is bounded and testable rather
than a blank page — "not every action makes sense here" becomes a
rule, not a vibe.

### Organizational shape — visible two-zone, with search

Three shapes weighed:

- **Visible two-zone** — an `On this screen` section on top, then
  the global core, lightly grouped. The hybrid model becomes the
  visible structure.
- **Intent groups** — Navigation / Tools / Settings, with
  contextual items folded in invisibly; zones become an
  authoring-only concept.
- **Search-first palette** — search focused, flat list, grouping
  only on browse.

**Visible two-zone chosen, with an always-present search field.**
Intent-groups buries the contextual zone — the deliberate feature
of the hybrid — and mixing global `Open World` with local `Jump to
bottom` under one "Navigation" header is more confusing, not less.
Search-first optimizes for a scale a deliberately curated ~13-entry
menu will not reach. Search stays as a filter affordance on top,
not a reframe.

### Substrate — composes the Autocomplete substrate

The mobile shape (trigger → bottom Sheet with a pinned search and a
filtered, grouped list) already exists. The literal
`Autocomplete-with-create` primitive
([`forms.md`](../ui/patterns/forms.md#autocomplete-with-create-primitive))
is the wrong fit — it is a single-value form control with a
`+ Add new` tail-create row and flat suggestions. But its
**substrate** — per-tier popover/Sheet dispatch, type-to-filter,
virtualization — is exactly right, and
[`provider-model-picker`](../ui/patterns/provider-model-picker.md)
is the precedent: a grouped, rich-row picker that is _not_ an
autocomplete but reuses that substrate, owning its own source and
row layout. The Actions menu becomes the **third substrate
consumer**, the same way.

### Generic-component extraction — deferred

Three consumers (`Autocomplete-with-create`, `provider-model-picker`,
Actions menu) now share the substrate, and "the substrate" is only
a phrase in the docs, not a named component. Rule of three says
extract it. But the extraction re-opens two already-designed
patterns, the generic API is a real interface-design problem (the
three consumers diverge on rows, grouping, footer, create-row, and
commit-a-value vs fire-a-command), and `Autocomplete-with-create`
is an imperfect third consumer (its trigger _is_ its input). The
Actions menu does not need the component to exist — composing "the
substrate" in `provider-model-picker`'s exact language is enough,
and gives the future extraction two consistent consumers to
generalize from. Banked as a followup; see Integration.

## Design

The full spec — anatomy, inventory, surface coverage, behavior,
keyboard, ARIA — is canonical in
[`ui/patterns/actions-menu.md`](../ui/patterns/actions-menu.md). In
brief, what this session settled: a search field pinned on top; an
`ON THIS SCREEN` contextual zone (omitted when the screen has
none); the curated core grouped `GO TO` / `STORY TOOLS` / `APP`,
collapsing to `APP`-only off-story; navigation entries that
self-omit on their own surface. Capability gating hides
inapplicable entries; in-flight gating disables mutating ones. The
surface is a `role="dialog"` combobox/listbox — not a
`role="menu"` — composing the Autocomplete substrate for per-tier
Popover/Sheet dispatch, the way `provider-model-picker` does.

## Adversarial pass

The design held. Findings, all folded into the spec:

- **Load-bearing assumption** — that core and contextual stay
  small enough for a flat two-zone list (worst case in-story ≈ 12
  rendered entries, since one `GO TO` entry always self-omits).
  Verified for all 9 current screens (max contextual = 2); assumed
  for future screens, with curation as the release valve.
- **`Cmd-K` under a blocking overlay** — the one genuine gap the
  four sections missed; resolved by making the trigger inert while
  a modal/Sheet owns the surface.
- **Reactive gating** — in-flight disabled state flips live while
  the menu is open.
- **`Close chapter` availability** — defers to the chapter-close
  feature's own predicate rather than inventing one.
- **"Return to Library" is not always redundant** — when App
  Settings/Diagnostics was reached from in-story, `←` pops to the
  story while the menu entry jumps to Story List; the Section-3
  "duplicates `←`" worst case only holds when reached from Story
  List.
- **No data-model impact** — pure UI composition over existing
  state (route, `leadEntityId`, `eras`, `diagnostics.enabled`,
  pipeline state). No new schema, no persisted menu state.
- **Translation / navigate-away guards / Sheet sizing / Vault
  home out of scope** — noted in the spec.

## Integration

New canonical file: [`ui/patterns/actions-menu.md`](../ui/patterns/actions-menu.md)
plus its colocated `actions-menu.html` wireframe.

Edited canonical files:

- [`ui/principles.md`](../ui/principles.md#actions--platform-agnostic-action-directory)
  — the `Actions` section trimmed to the philosophy plus a pointer
  to the pattern doc; the "every action … filters" overclaim
  corrected. Heading text unchanged (no anchor break).
- [`ui/screens/story-list/story-list.md`](../ui/screens/story-list/story-list.md)
  — the line claiming per-card overflow actions are "also
  reachable via the global Actions menu" corrected: the Story List
  menu carries `New story` / `Import story…`, not per-card
  actions.
- [`ui/patterns/overlays.md`](../ui/patterns/overlays.md#popover--aria-contract)
  — the Popover-ARIA note repointed: the Actions menu is a
  `role="dialog"` combobox/listbox surface, not the future
  `role="menu"` adopter. The `accessibilityRole="menu"` prop stays
  (harmless, available for a hypothetical future menu consumer).
  Used-by / future-consumers prose updated to a real reference.
- [`ui/screens/diagnostics/diagnostics.md`](../ui/screens/diagnostics/diagnostics.md)
  — the `Top-bar Actions menu` section repointed from the
  now-resolved followup to the pattern doc.
- [`ui/patterns/README.md`](../ui/patterns/README.md) — index
  entry added for the new `actions-menu.md` pattern.
- [`ui/component-inventory.md`](../ui/component-inventory.md) — an
  `ActionsMenu` row added under `Compounds — build-ready`
  (alongside `ProviderModelPicker`, the sibling substrate
  consumer).

Followups (both in [`followups.md`](../followups.md), under `UX`):

- **Resolved** — `Actions menu broader design pass` removed.
- **New** — a generic searchable-overlay-list component extraction
  pass. Active rather than parked: the three substrate consumers
  (`Autocomplete-with-create`, `provider-model-picker`, the Actions
  menu) are all v1 build-ready, so the extraction-design belongs
  before consumer #2 or #3 is built — inside v1, not as a post-v1
  refactor of three shipped components.
