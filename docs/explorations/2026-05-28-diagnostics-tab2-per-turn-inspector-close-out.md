# Diagnostics Hub · Tab 2 (Per-turn inspector) — detail-pass close-out

Session record, 2026-05-28. Resolves the
`Diagnostics hub — per-tab body design pass for tab 2` followup
(removed from [`followups.md`](../followups.md) as part of this
landing — the file's UX section is now empty) — the final tab in
the per-tab-body design series, sibling to
[`2026-05-27-diagnostics-tab4-logs-close-out.md`](./2026-05-27-diagnostics-tab4-logs-close-out.md)
and
[`2026-05-27-diagnostics-tabs-3-5-close-out.md`](./2026-05-27-diagnostics-tabs-3-5-close-out.md).
Canonical spec changes land in
[`ui/screens/diagnostics/diagnostics.md`](../ui/screens/diagnostics/diagnostics.md);
this file is the frozen reasoning trail.

## Problem

[`diagnostics.md`](../ui/screens/diagnostics/diagnostics.md) ships
Tabs 3, 4, and 5 at detail-pass fidelity. Tab 2 (Per-turn inspector)
remains at "what's in this tab" level — body content named in prose
(two-pane with list + detail; detail pane carries phase timeline,
classifier raw JSON, cross-cut HTTP calls + log entries) but
pixel-level interaction, row composition, sub-section layout, and
cross-tab cascades aren't pinned.

Tab 2 deliberately lands last in the series because its detail pane
**embeds** the Tab 3 and Tab 4 row shapes as cross-cut sub-views
(filtered by the selected turn's `actionId`). Designing Tab 2 before
those row shapes were locked would have forced re-revisits.

## Decisions and rationale

### Detail-pane composition — flat sections, row-level accordion only

Four sub-sections inside the detail pane: **Timeline / Classifier
raw output / Calls (N) / Logs (N)**. Considered options were section-
level accordion (multi-open, with Card+Strip nesting per
[`accordion.md → Card vs strip`](../ui/patterns/accordion.md#card-vs-strip--composition))
versus flat section headers with only the row-level accordion inside
Calls/Logs sections. Picked flat.

**Why flat over nested accordions.** The original argument for
section-collapse was "user controls vertical budget." That argument
doesn't hold up section-by-section:

- Timeline gantt is bounded (~80-120px for 5-8 phases).
- Classifier JSON is the only "could be huge" section, and
  [JSONBlock](../ui/patterns/data.md#json-content-block--inline-use)
  already has its own collapse-by-default with an expand action.
- Calls + Logs sections virtualize internally per
  [`lists.md`](../ui/patterns/lists.md).

Adding a section-level accordion would create a redundant control
layer (the user already controls JSONBlock + virtualization
scrollers). Single accordion concept in the pane is simpler.

Canonical at
[`diagnostics.md → Detail-pane composition (Per-turn inspector)`](../ui/screens/diagnostics/diagnostics.md#detail-pane-composition-per-turn-inspector).

### Phase timeline — gantt, fit-to-container

Schema gives `PhaseEvent = { phase, kind: 'enter'|'exit', at,
durationMs? }`. Gantt-style horizontal bars positioned by `at` and
`durationMs` are the only visual that answers "where did the time go
and what was happening when" at a glance. Vertical-list with inline
mini-bar was the runner-up but loses concurrent-phase visibility.

**Why fit-to-container, not fixed-px-per-second.** Tab 2 inspects
one turn at a time; no side-by-side comparison. Fit-to-container
keeps each turn's gantt fully visible without horizontal scroll
(on tablet+); duration labels per bar carry the absolute timing.
Fixed-scale would matter only if comparing two turns — which v1
doesn't do.

**Gantt on phone too** — scrolls horizontally if the turn's
duration produces overflow at narrow widths. Same visual everywhere
beats per-tier reshape. Canonical at
[`diagnostics.md → Phase timeline gantt (Per-turn inspector)`](../ui/screens/diagnostics/diagnostics.md#phase-timeline-gantt-per-turn-inspector).

### Cross-cut row reuse — Hybrid C with `↗ Open in tab` escape hatch

Three options for embedded HTTP / log rows: reuse + inline-expand
verbatim (A), reuse + tap-out only (B), or hybrid inline-expand +
explicit `↗ Open in Calls/Logs →` affordance for tab-out (C).
Picked C.

Inline expand serves the common case ("peek the call body without
losing turn context"); the `↗` icon-action serves the escape ("grep
URL across other turns" needs the source tab's filter chrome).
Negligible cost adding the icon-action vs. forcing one of the two
behaviors universally.

**No local filter chrome inside cross-cut sections.** Volume is
turn-scoped (~5-20 calls, ~10-50 logs); adding Tab 3 / Tab 4-style
Toolbar chrome inside Tab 2 would re-implement the source tabs at
half-fidelity. The `↗` escape hatch covers "I need to filter" by
delegating to the right tab.

**Nested-accordion check.** Detail-pane sections are flat (no
section accordion); inside Calls/Logs sections, the row-level
accordion stays `type="single"` per Tab 3 / Tab 4's spec. Single
accordion level in the pane — independent scope.

Canonical at
[`diagnostics.md → Cross-cut Calls / Logs sections (Per-turn inspector)`](../ui/screens/diagnostics/diagnostics.md#cross-cut-calls--logs-sections-per-turn-inspector).

### List-pane filter — outcome chips only

Considered: outcome chips, free-text actionId/reason search, time
range. Picked outcome chips only for v1.

Buffer caps at ~100 turns; reverse-chrono ordering gives recency
for free. The realistic Tab 2 workflow is "show me failed turns
this session" — outcome filter answers that one question well.
Free-text and time range carry low ROI against a 100-row bounded
list; parked-until-signal.

In-flight turns are visible regardless of outcome filter (no
outcome to match against yet); they join the appropriate filter
bucket on resolve per the standard "filter predicates evaluate live
state" precedent from Tab 3.

### Cross-tab nav — aged-out arrival via escape buttons (option C)

`turnCaptures` caps ~100; `httpCalls` / `logEntries` have their own
caps. Three states are possible on an `actionId=X` arrival:

- Both turn capture AND cross-cut data present → render four-section
  detail pane normally.
- Turn capture present, cross-cut data partially aged out → buffer-
  truth indicator (see adversarial finding #1 below).
- Turn capture aged out, cross-cut data may or may not still exist →
  empty-state with `[Open Call log for this turn]` `[Open Logs for
this turn]` escape buttons.

Considered "degraded inline render" (banner + Calls/Logs sections
only, no timeline/classifier) for the aged-out case but rejected: it
introduces a third detail-pane rendering mode (full / aged-out-empty
/ degraded) for an edge case. The escape buttons keep the inspector's
identity clean (renders 4 sections OR aged-out empty state) and
delegate cross-cut access to the source tabs.

Canonical at
[`diagnostics.md → Cross-tab nav (Per-turn inspector)`](../ui/screens/diagnostics/diagnostics.md#cross-tab-nav-per-turn-inspector).

### Count badge — outcome max severity, story-scoped

`turnCaptures` buffer filtered render-time by `branchId` matching
the story selector (the buffer is keyed by actionId, not story —
filtering at render is the established pattern from the hub-level
open questions). Color by outcome max severity: any `failed` →
danger, else any `aborted` → warn, else (all `completed` /
in-flight only) → neutral.

Decoupled from outcome-chip filter (matches the Tab 3 / Tab 4
ambient-signal rule). Hidden when no story selected.

## Adversarial pass — folded refinements

Five items surfaced during adversarial analysis. All folded into the
spec rather than reopening decisions:

1. **Buffer-truth indication on cross-cut sections.** `httpCalls` and
   `logEntries` evict independently of `turnCaptures`. A live turn
   capture's cross-cut sections can show counts that reflect what's
   currently in those buffers, not what the turn actually emitted.
   Resolution: when `turn.startedAt < buffer[0].at` (cross-cut
   buffer's own oldest entry is newer than the turn), append a
   muted `(some may have aged out)` line below the section header.
   Cheap to detect, only fires when relevant.

2. **Detail-pane context header.** Selected turn may be hidden by
   the list-pane outcome chip filter, leaving the detail pane
   without anchoring context. Phone already shows `Turn tr_a3kf` in
   the top-bar sub-title; desktop adds a thin header strip showing
   `Turn tr_a3kf · failed · 14:01:34 · 8.4s` at the top of the
   detail pane. Redundant when the list-pane row is visible,
   load-bearing when it's filtered out.

3. **In-flight gantt time-axis anchor.** Fit-to-container is
   well-defined for finalized turns (`endedAt − startedAt`);
   in-flight turns need a rule. Resolution: time axis spans
   `[startedAt, now]` recomputed on render (coarser tick — every
   200ms — to avoid sub-pixel jitter). Active phase bar extends to
   `now`.

4. **In-flight turns regardless of outcome filter.** Turns without
   resolved outcome don't match any of the three outcome chips.
   Hiding them is misleading ("I have outcome filter set; this
   turn that just started doesn't appear"). Resolution: in-flight
   turns visible regardless; they join the appropriate filter
   bucket on resolve.

5. **Selected-turn-evicted transient note.** When the selected turn
   evicts from the ~100-cap buffer mid-session, detail pane falls
   back to the "Select a turn from the list" empty state. Without
   acknowledgment, user feels like the UI glitched. Resolution:
   surface a transient muted `Selected turn aged out` note near the
   empty state so the cause is visible.

## What this defers

- **Edit-restrictions during in-flight (force-cancel-turn affordance).**
  The original Tab 2 sketch deferred "edit-restrictions during
  in-flight." Tab 2 in v1 is purely read; the only candidate edit
  affordance is force-cancel-turn (terminate an in-flight turn),
  which isn't a v1 feature. Parked-until-signal.
- **List-pane free-text search + time range.** Outcome chips are
  the only filter dimension v1 ships. Free-text on actionId / reason
  and time range presets parked-until-signal.
- **Inline performance-aggregate tab.** Mean/p95 latency across
  turns, tokens-per-turn trends — already parked at
  [`parked.md → Observability — performance metrics dashboard tab`](../parked.md#observability--performance-metrics-dashboard-tab).
  Tab 2 inspects one turn; aggregates land later if performance
  tuning becomes a focused workflow.
- **Memory probe tab relocation.** Open question carried from the
  hub doc; not load-bearing for v1.

## Integration plan

**Canonical doc edits:**

- [`docs/ui/screens/diagnostics/diagnostics.md`](../ui/screens/diagnostics/diagnostics.md) —
  Tab 2 section grows from sketch to detail-pass fidelity. New
  subsections (each with `(Per-turn inspector)` parenthetical
  suffix to disambiguate from Tab 3 / Tab 4 / Tab 5 slugs): two-pane
  shape, list-pane row + filter, detail-pane composition (flat
  sections), phase timeline gantt, classifier raw output, cross-cut
  Calls / Logs sections, buffer aged-out indication, detail-pane
  context header, in-flight UX, selection mechanic, cross-tab nav,
  count badge, phone tier, empty states, state persistence,
  implementation notes. Also: tab-strip rules table updated to
  include Tab 2's count-badge rule; "Screen-specific open questions"
  Tab 2 count-badge entry removed (resolved); intro prose updated
  to remove "Tab 2 lands in its own detail pass" caveat.

- [`docs/ui/screens/diagnostics/diagnostics.html`](../ui/screens/diagnostics/diagnostics.html) —
  wireframe additions:
  - New `data-active-tab="per-turn"` dimension with the two-pane
    body (list + detail with all four sections).
  - Mode buttons for: default (turn selected), in-flight turn
    selected (gantt active bar pulsing), no-turn-selected (detail
    pane empty), aged-out arrival, buffer-truth indicator.
  - Phone-tier variants: list view, detail view (pushed).
  - Update review bar's mode-list note to acknowledge Tab 2
    coverage.

- [`docs/ui/patterns/chips.md`](../ui/patterns/chips.md) — Used-by
  addition: Tab 2 list-pane outcome filter chips (3 chips: completed
  success-tone / aborted warn-tone / failed danger-tone). First
  consumer with outcome semantics rather than HTTP/log severity.

- [`docs/ui/patterns/data.md`](../ui/patterns/data.md) — Used-by
  addition: Tab 2 classifier raw output section uses JSONBlock
  (collapsed-by-default, expand-action reveal). Cross-cut Calls /
  Logs sections inherit existing Tab 3 / Tab 4 JSONBlock usage —
  no separate Used-by entry for those (they're not new consumers).

- [`docs/followups.md`](../followups.md) — remove the
  "Diagnostics hub — per-tab body design pass for tab 2" entry
  (resolved by this pass). The UX section may become empty (all
  diagnostics per-tab passes closed); section heading stays for
  future entries.

- [`docs/parked.md`](../parked.md) — two new entries:
  - `Diagnostics Per-turn inspector — force-cancel-turn affordance`
    (parked-until-signal). Successor to the original "edit-
    restrictions during in-flight" deferral.
  - `Diagnostics Per-turn inspector — list-pane free-text search +
time range filters` (parked-until-signal).

**No renames in this diff.** New subsections under the existing
`### Tab 2 — Per-turn inspector` heading; no slug breakage. The
existing Tab 2 cross-references from Tabs 3/4/5 (multiple in
`diagnostics.md`, plus the parked-entry from
`Performance metrics dashboard tab`) remain valid because they
point at the section heading (`#tab-2--per-turn-inspector`), not at
sub-sections.

**Intentional repeated prose check.** Tab 2 cites shared substrate
(JSONBlock, accordion, chips, virtualization, cross-tab actionId
substrate) rather than restate. Phase timeline gantt is novel to
this surface; lives inline at the per-screen doc, not promoted to a
pattern (no other v1 consumer expected).

**Followups in/out**:

- Resolved: `Diagnostics hub — per-tab body design pass for tab 2`
  (the sole remaining followup in the UX section after the prior
  two passes).
- Added: two parked-until-signal entries above.
