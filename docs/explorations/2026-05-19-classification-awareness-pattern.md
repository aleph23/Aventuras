# 2026-05-19 — Classification awareness pattern

Resolves the `Classification awareness pattern` followup. The
collapsed Browse rail strip — explicitly featureless per the prior
`reader-composer.md → Collapsed state` spec — gains a cell-based
information vocabulary that doubles as the classifier-awareness
surface. The phone `[☰ Browse]` chip gains a matching aggregate
tint. Surfaces that the followup speculatively listed (top-bar
pill, peek drawer chrome, World / Plot aggregates) drop out of
scope after grounding.

## Outcome

The collapsed strip stops being a pure click target. It becomes a
compact persistent dashboard showing per-kind in-scene counts where
that concept applies, and quick-access glyphs where it doesn't,
with classifier-activity composing as a per-cell background tint
that mirrors the existing row-tint decay window. The phone chip
gets the aggregate version of the same signal. The canonical
row-tint rule expands to spell out that scene-presence transitions
count as classifier-authored changes — the existing rule's
ambiguity was load-bearing and surfaced during this design.

## Scope decisions (locked in dialogue)

**Source — classifier-authored only.** Manual user edits do not
fire any tint, at row or cell level. Inherits the existing
[`entity.md` row-tint scope](../ui/patterns/entity.md#recently-classified-row-accent).
A broader "unseen since last look" vocabulary was considered and
explicitly rejected — adds per-user state for marginal gain over
the turn-window mirror.

**Decay — mirror row tint exactly.** Fresh (full-strength
`--recently-classified-bg`) for the turn of write; fading (50%
strength) for the following turn; gone after. No user-acknowledge
clearing. Strip signal will be lit a large fraction of the time
in practice — design treats it as ambient state, not a
notification badge.

**Surfaces in scope — collapsed strip + phone chip only.**

Surfaces dropped after scope-check:

- **Top-bar status pill.** Reserved for World-screen collision
  warnings; not a generic awareness surface.
- **Expanded rail rows.** Existing per-row `entity.md` accent
  already covers this.
- **World / Plot list panes.** Same existing per-row accent.
- **Peek drawer chrome.** Peek is row-scoped; no aggregate
  needed.

## Desktop and tablet — collapsed strip

The collapsed strip widens to ~28-32px (final pixel value still
deferred to the visual identity pass, but the mobile foundations
docs already reference 28px — the prior `reader-composer.md`
`~16-24px` figure was stale relative to
[`mobile/README.md`](../ui/foundations/mobile/README.md) and
[`mobile/collapse.md`](../ui/foundations/mobile/collapse.md)).

### Vertical anatomy, top to bottom

1. **Affordance chevron.** A small inward-pointing `‹` at
   top-center, always rendered at full opacity (independent of the
   strip's muted hover-baseline). Mirrors the `›` collapse trigger
   in the expanded rail's header. This is the explicit
   "expandable" affordance — separate from any awareness signal —
   addressing the prior strip's "doesn't read as expandable"
   weakness that the user flagged during this session.
2. **Group A — counted cells.** Characters, Items. Each cell:
   kind glyph + count of that kind's rows in the latest entry's
   `metadata.sceneEntities`. Count `0` renders with muted text;
   count `> 9` displays `9+` to keep cell width stable.
3. **Group separator.** A small vertical gap (~4-6px). Visual
   identity may promote to an explicit hairline if real-world
   rendering shows the gap reads as accidental. The separator's
   role is to telegraph "different unit below" — counted vs
   quick-access.
4. **Group B — quick-access cells.** Location, Factions. Each
   cell: kind glyph only, no count. Location is binary
   (`currentLocationId` is a 0-or-1 singleton); factions are not
   scene-tagged per
   [`data-model.md → Scene presence is kind-aware`](../data-model.md#entry-metadata-shape).
   Showing counts on these would be either noise or undefined.
5. **Empty clickable region** filling the remaining strip height.

### Cell states and tint composition

Every cell, both groups, carries the per-kind classifier tint.
Three states:

- **Untinted** — no row of this kind has classifier-authored
  activity in the 2-turn window.
- **Fresh-tinted** — at least one row of this kind is in the
  fresh window. Cell background fills
  `--recently-classified-bg` at full strength.
- **Fading-tinted** — all rows of this kind in the window are in
  the fading half. Cell background fills the same slot at 50%.

The aggregation rule per cell: tint strength equals the highest
strength of any row of that kind currently in the window. A new
classifier write re-anchors the cell to fresh; ages naturally to
fading as time progresses; untints when all contributors leave
the window.

Glyph and count contrast stay full-strength on tinted cells —
legibility over the tint is the constraint, not visual hierarchy.

### Click semantics

Three distinct hit zones:

- **Affordance chevron** — expand rail, preserve current
  category. Tooltip `Expand rail`.
- **Cell** (glyph + optional count) — expand rail **and**
  switch its category to that kind. Tooltip
  `<Kind> in scene: <count>` for Group A; `<Kind>` for
  Group B.
- **Empty region** — expand rail, preserve current category.

Cell-click category-switch is a meaningful enrichment over
today's "click anywhere, expand-as-was" semantic — the strip
becomes a quick-jump. Hover decoration brightens per zone
independently. Existing `Cmd/Ctrl+\` keyboard shortcut continues
to toggle expand/collapse without lazy strip-internal focus
traversal.

### Touch (tablet)

Tablet inherits the strip verbatim. Cells become tap targets;
tooltips surface via long-press per the existing
[touch.md → Tap-to-tooltip on inert chrome text](../ui/foundations/mobile/touch.md#tap-to-tooltip-on-inert-chrome-text)
pattern (adapted — cells are not strictly inert chrome, but the
long-press disclosure mechanism transfers cleanly). Cell sizes
fall under the 44px iOS hit-target recommendation; a tap-miss
lands on the chevron or empty region (also expand affordances),
so the worst case is "expand without category-switch" — no
destructive cost.

## Phone — Browse chip

The reader chip strip's `[☰ Browse]` chip (per
[`reader-composer.md → Mobile expression`](../ui/screens/reader-composer/reader-composer.md#mobile-expression))
gains a background-tint behavior. Single aggregate signal across
**all seven** rail-surfaceable categories (characters,
locations, items, factions, lore, threads, happenings): chip
tints with `--recently-classified-bg` when any row in any
category has fresh-or-fading classifier activity. Same two-state
decay.

No per-kind disambiguation on phone — the chip is too small, and
per-kind discovery surfaces inside the rail-as-Sheet via the
existing row tint once the user taps in. The asymmetry with the
desktop strip is intentional: desktop has the real estate for
richer info, phone doesn't, and giving phone a single aggregate
matches the chip's "open Browse for details" affordance.

The chip's tap behavior and the rail-as-Sheet flow are unchanged.
Tint is purely informational; no tooltip or long-press disclosure
is added.

Tablet does not get this rule — tablet renders the desktop strip
via the existing viewport-forced-collapse threshold.

## Canonical row-tint rule — α-expansion

The existing
[`entity.md → Recently-classified row accent`](../ui/patterns/entity.md#recently-classified-row-accent)
language ("rows whose source data the classifier wrote") was
ambiguous about scene-presence transitions. Scene presence lives
on the entry's metadata (`metadata.sceneEntities` for
characters / items, `metadata.currentLocationId` for the location
singleton) — not on the entity row's stored state JSON. Under a
strict reading, a character leaving a scene would not fire the
row tint, because their state JSON didn't change.

This design's surfaces depend on transitions firing the tint
(otherwise location change and faction-only activity have no
strip-level signal). Rather than carving a strip-only exception,
the canonical rule expands to spell out the honest interpretation:

> The recently-classified row accent fires on any classifier-
> authored change concerning the entity — writes to the entity's
> stored state, scene-presence transitions, and any future
> classifier-authored signal touching the entity. Manual user
> edits continue to not fire the tint.

The expansion is cross-cutting — World list rows now tint when a
character's only change this turn is "left the kitchen," etc.
That's correct behavior on those surfaces too, not just the
strip. Plot is unaffected (threads / happenings have no
scene-tagging concept).

While editing the rule, the adjacent
"classifier" vs "classifier (or any agent)" phrasing
inconsistency (lines 96 and 332-336 in the current `entity.md`)
gets reconciled to a single phrasing.

## Aggregation reads current rows

Cell tint state derives from the rail's current row set, not
from a separate write-history log. If the classifier creates an
entity and the user deletes it within the window, the cell
un-tints immediately when the row leaves the set — no phantom
tint with nothing tinted underneath when the user expands. This
follows naturally from "any row of kind X currently fresh /
fading"; documenting it explicitly so the cell tint isn't
mis-implemented as a write-stream subscription.

Counts read from the same current state — `metadata.sceneEntities`
of the latest entry on the current branch, filtered by entity kind.

## Anti-scope

Explicit out-of-design:

- Top-bar status pill stays collision-only.
- World / Plot panels and the expanded rail get no new aggregate
  treatment — existing per-row tint suffices on those surfaces.
- No animation or pulse on tint transitions — pure CSS color slot,
  no motion budget consumed.
- No per-user "seen since last look" state at any surface.
- No new color tokens — same `--recently-classified-bg` slot the
  row tint already uses.

## Doc-integration impact

- **`reader-composer.md → Browse rail — collapse / expand →
Collapsed state`** rewritten. The "no functional content" /
  "pure click target plus silhouette" claim becomes false. Adds
  the vertical anatomy, cell vocabulary, click-zone semantics, and
  classifier-tint composition. Removes the explicit followup
  pointer.
- **`reader-composer.md → Mobile expression →
Browse rail not visible in-place on phone`** picks up the chip
  background-tint bullet. Existing tap-behavior prose unchanged.
- **`entity.md → Recently-classified row accent`** picks up the
  α-expansion clause. While there, "classifier" vs
  "classifier (or any agent)" phrasing reconciled. Optional
  cross-link added pointing at the strip-aggregate vocabulary in
  `reader-composer.md`.
- **`followups.md → Classification awareness pattern`** removed.
- **`reader-composer.html` wireframe** updated to render the new
  collapsed-strip vocabulary: chevron, four cells (chars, items,
  location, factions), group separator, tint states. Phone chip-tint variant exposed
  too if the wireframe surfaces phone state.
- **`mobile/collapse.md`** has a passage calling the strip
  "vestigial desktop chrome" on phone (lines 65-68). That framing
  becomes less true post-this-design — the desktop strip now
  carries real information. Reconciled to "the strip surfaces a
  compact dashboard on desktop / tablet; phone routes via the
  chip" or similar.
- **`mobile/README.md`** line 148's "28-px edge strip" reference
  becomes consistent with the canonical figure once
  `reader-composer.md` aligns. No edit needed there; verify
  during drift pass.

## Followups generated

None. This design resolves the `Classification awareness pattern`
followup and the doc-consistency reconciliations in `entity.md`
land inside the same integration commit. The visual identity
pass continues to own final pixel values for strip width, cell
internal layout, separator promotion to hairline, and chevron
sizing — its scope, not a new followup.
