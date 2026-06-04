# Slice 1.5.5 — Chapters & era flips

## Metadata

- **Milestone:** [Milestone 1.5 — Data foundation](../milestone.md)
- **Depends on:** [Gate](./01-gate.md) — `chapters` / `branch_era_flips`
  DDL + JSON types, dispatch API, store factory, store-mirror contract.
- **Blocks:** nothing in M1.5 (parallel). Consumed by chapter-close
  (M5) and the chapter-timeline / era-flip surfaces (M5 / M7).

## Goal

Make `chapters` and `branch_era_flips` live, reversible domains:
working-set stores, Tier-1 CRUD arms through the dispatch API, and
their column Zod.

## Background

Chapters are first-class, per-branch, user-visible ranges that segment
the narrative and trigger chapter-close, per
[`data-model.md → Chapters / memory system`](../../../../data-model.md#chapters--memory-system).
Only **closed** chapters exist as rows (open-region entries have
`chapter_id IS NULL`); the chapter-close pipeline (M5) is what actually
creates them. `branch_era_flips` records per-branch in-world era
changes (`at_worldtime`, `era_name`) per
[`data-model.md → Era flips`](../../../../data-model.md#era-flips). This
slice ships the data layer — the writer (chapter-close) and the
era-flip UX (M7.2) are out of scope; we land the tables, the CRUD, and
the stores so those features build against them.

## Required reading

- [`data-model.md → Chapters / memory system`](../../../../data-model.md#chapters--memory-system)
  — closed-only rows, the per-branch fork-clean property, the
  retrieval-pool role.
- [`data-model.md → Era flips`](../../../../data-model.md#era-flips)
  — `branch_era_flips` shape and `at_worldtime` semantics.
- [`data-model.md → Entry mutability & rollback`](../../../../data-model.md#entry-mutability--rollback)
  — `chapters` rows are delta-logged (chapter-close shares one
  `action_id`); encoding for `keywords` (whole-array).

## Scope: in

- **`chapters`** Zod + store + CRUD arms. Columns: `sequence_number`,
  `title`, `summary`, `theme`, `keywords` (json `string[]`),
  `start_entry_id`, `end_entry_id`, `token_count`, `closed_at`,
  `embedding_stale`, timestamps. Narrative fields delta-log;
  `embedding_stale` operational.
- **`branch_era_flips`** Zod + store + CRUD arms. Columns:
  `at_worldtime` (≥ 0), `era_name`, `created_at`.
- Stores via the base factory (branch-scoped, keyed by id, read
  selectors incl. chapters by `sequence_number`); no speculative
  public mutators.
- **Tests** per [milestone C4](../milestone.md#c4--domain-slice-template).

## Scope: out

- **Chapter-close pipeline** — boundary selection, metadata generation,
  lore-mgmt sub-jobs, the shared-`action_id` batch (M5.2). This slice
  ships the CRUD primitives it writes through.
- **Chapter boundary detection** (token threshold crossing,
  auto-close) and chapter-membership assignment on entries
  (`story_entries.chapter_id` updates) — M5.
- **Chapter-summaries retrieval pool / embedding** (M3).
- **Era-flip UX** — time-chip popover, flip-era modal, calendar-tab
  era list (M7.2); the renderer that consumes `at_worldtime` (M2.5 /
  calendar subsystem).
- **Chapter-timeline screen** (M5.3).

## Acceptance criteria

- `chapters` / `branch_era_flips` Zod parse their specced shapes with
  defaults; `at_worldtime ≥ 0` enforced.
- CRUD arms write row + delta and patch the store; reverse-replay
  reverses both.
- `op=update` on `chapters.keywords` (whole-array) and scalar fields
  (`title`, `summary`, `token_count`) encode + reverse-replay restore.
- Non-held-branch write no-ops against the store.
- `pnpm lint`, `pnpm typecheck`, `pnpm lint:docs`, vitest pass.

## Tests

- **Zod.** Parse representative `chapters` / `branch_era_flips` rows;
  `at_worldtime` negative rejection.
- **CRUD roundtrip** per table.
- **Undo encoding.** `chapters.keywords` whole-array + scalar updates,
  reverse-replay restore.
- **Store patch.** Create / update / delete patch held branch; non-held
  no-op; reverse-replay reverses.

## Open questions

- **`start_entry_id` / `end_entry_id`** reference branch-scoped
  composite-keyed entries; stored as the entry's `id` (resolved within
  branch) per the composite-PK invariant. Confirm they store the entry
  `id`, not a `(branch_id, id)` pair (branch is implied by the chapter's
  own `branch_id`).

## Implementation notes

_Populated at finish: notable deviations from the plan and resolved developer decisions._
