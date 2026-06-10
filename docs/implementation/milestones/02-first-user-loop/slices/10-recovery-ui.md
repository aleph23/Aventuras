# Slice 2.10 — Crash-recovery modal + story-settings parse-failure badge

## Metadata

- **Milestone:** [Milestone 2 — First user loop](../milestone.md)
- **Depends on:** [Slice 2.4](./04-story-list.md) for the badge
  half (the story list hosts it) and
  [Slice 2.7](./07-wiring.md) for the badge half's integration
  (2.7's story-open path writes the C1 open-failure state, and
  the kill-mid-turn criterion needs the real per-turn pipeline;
  the badge UI itself develops against a fixture-written state).
  The recovery-modal half is day-one (the
  `pendingRecoveryReport` slot shipped in 1.7a)
- **Blocks:** none

## Goal

The two user-facing recovery surfaces M1 left as slots: the
**crash-recovery modal** (AlertDialog draining
`pendingRecoveryReport` with kind-aware copy naming the affected
story) and the **per-story settings parse-failure badge** on the
story list (`"Couldn't open — settings corrupted"` with
`Open file` and `Reset settings for this story` actions). The
boot ordering, loading-until-render, and the boot-blocking
`app_settings` recovery screen all shipped in 1.7a; only these
two surfaces remain from the canonical recovery contracts.

## Background

Startup recovery reverse-replays orphaned runs and produces a
`RecoveryReport`; when any orphan actually reversed deltas, the
report lands in the `pendingRecoveryReport` UI slot and the first
user-facing surface after boot drains it into a modal.
Zero-reverse orphans and recovery failures stay observability-
only. Separately, the per-story Zod parse of
`stories.definition` / `settings` can fail at story-open; the
affected story must fail to open with a badge on its card while
other stories stay usable — the app-settings half of this
contract (the blocking recovery screen) already exists, and this
slice completes the story-open half. The open path that detects
the failure is [Slice 2.7](./07-wiring.md)'s story-open wiring;
the failure state slot lives in the stories store (C1).

## Required reading

- [`generation-pipeline.md → Recovery modal`](../../../../generation-pipeline.md#recovery-modal)
  — drain semantics, kind-aware copy table, multi-orphan
  concatenation, the zero-reverse silence rule.
- [`generation-pipeline.md → Recovery-failure policy`](../../../../generation-pipeline.md#recovery-failure-policy)
  — what stays observability-only (the modal must not surface
  these).
- [`architecture.md → Settings: strict types, defaults at load`](../../../../architecture.md#settings-strict-types-defaults-at-load)
  — the three parse-failure sites and the per-story recovery
  contract (`Open file` + reset preserving narrative content).
- [`ui/patterns/alert-dialog.md → Rich content via composition`](../../../../ui/patterns/alert-dialog.md#rich-content-via-composition)
  — the primitive both surfaces compose.
- [`data-model.md → Story settings shape`](../../../../data-model.md#story-settings-shape)
  — the `definition` / `settings` shapes whose parsed defaults
  the reset action rewrites.

## Scope: in

- **Recovery modal:** `useEffect` drain of the slot on the first
  user-facing surface; AlertDialog with single `OK`; kind-aware
  copy — `per-turn` is the only kind producible in M2, but the
  copy map carries all three canonical variants so M3 / M5 add
  no UI work; `{storyName}` resolution from the orphan's
  `story_id` with the non-named fallback; multi-orphan
  single-paragraph concatenation.
- **Parse-failure badge:** story card error badge driven by the
  C1 open-failure state; card click while failed re-surfaces the
  failure (no navigation); actions per the canonical contract —
  `Open file` (deep-link the SQLite file in the OS file manager;
  platform-appropriate degradation on Android) and
  `Reset settings for this story` (rewrite `settings` — and
  `definition`? see Open questions — to parsed defaults,
  preserving all delta-replayable narrative content), behind a
  destructive-action confirm.
- i18n strings for all copy; Storybook stories for both surfaces'
  states.

## Scope: out

- The boot-blocking `app_settings` recovery screen — shipped
  (1.7a).
- The story-open detection path itself —
  [Slice 2.7](./07-wiring.md) writes the failure state; this
  slice renders and resolves it.
- Recovery-failure admin affordances (drop-orphan etc.) —
  explicitly not v1 per the canonical policy.

## Acceptance criteria

- Fixture-injected `RecoveryReport` with one reversed `per-turn`
  orphan renders the modal with the per-turn copy and the story
  name; with two orphans, one concatenated paragraph; with only
  zero-reverse orphans, no modal.
- The slot drains exactly once — re-render / re-navigation does
  not re-show the modal.
- A story row with corrupted `settings` JSON (fixture) badges on
  the list, other stories open normally; `Reset` rewrites
  defaults, the story opens, and its entries / entities are
  intact; the confirm gate fires before any write.
- `Open file` launches the OS file manager at the DB path on
  desktop; on Android it takes one of the two concrete fallbacks
  (share-sheet the DB file, or show the path copyable) — picked
  at planning, recorded in Implementation notes — and never
  crashes.
- Kill-mid-turn manual test (with [Slice 2.7](./07-wiring.md)
  merged): next boot shows the modal naming the story.

## Tests

- Vitest: drain-once logic, copy selection per kind, reset
  action's preserve-narrative assertion (entries untouched,
  settings re-parsed to defaults).
- Storybook: modal variants (single / multi / non-named),
  badge + failed-open card states.

## Open questions

- Whether `Reset settings for this story` also resets a
  corrupted `definition` (the canonical contract names the
  story-level reset action generically; definition reset loses
  wizard-authored content — likely a second, scarier confirm or
  out of scope for M2 with `settings`-only reset).
- `Open file` behavior on Android (no desktop-style file
  manager deep-link; options: share-sheet the file, show the
  path, or hide the action on native) — decide at planning.

## Implementation notes

_Populated at finish: notable deviations from the plan and resolved developer decisions._
