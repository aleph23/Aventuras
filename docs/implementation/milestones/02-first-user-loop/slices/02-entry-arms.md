# Slice 2.2 — Entry-arm completion: delete, content-update, opening invariants, rollback action

## Metadata

- **Milestone:** [Milestone 2 — First user loop](../milestone.md)
- **Depends on:** none (M1.5 dispatch registry + the existing
  `story_entries` create / metadata-update arms)
- **Blocks:** [Slice 2.5](./05-reader.md) (edit / delete actions
  and the rollback-confirm modal consume these arms)

## Goal

Complete the `story_entries` Tier-1 surface: the **delete arm**
(full-row `undo_payload` capture), the **content-update
side-channel** (deliberately delta-exempt), the **opening-entry
position invariants** the generic CRUD doesn't encode, and the
**rollback-to-entry action** (suffix selection, bucket counts for
the confirm modal, execution via reverse-replay).

## Background

M1 / M1.5 landed `story_entries` with the full kind enum and two
arms only — create and metadata-update. M2's reader needs the
rest: deleting an entry is a rollback (the entry plus everything
after it), editing an entry's text is the one narrative field
deliberately exempted from the delta log, and `kind='opening'`
rows carry action-layer invariants (always position 1, never
deletable). The M1.5 gate's C4 note pins the delete-handler
contract this slice implements: full-row `undo_payload` so
reverse-replay can rebuild both the SQLite re-insert and the
store create-patch. In M2 the rollback sweep can be the naive
positional suffix — no `periodic_classifier` deltas exist yet —
but the predicate should be written in the survival-anchor shape
so M3.3 / M3.9 refine rather than rewrite.

## Required reading

- [`data-model.md → Entry mutability & rollback`](../../../../data-model.md#entry-mutability--rollback)
  — the content side-channel, delete semantics, `op=delete`
  full-row payload, the CTRL-Z algorithm this slice's primitives
  feed.
- [`data-model.md → Survival anchor`](../../../../data-model.md#survival-anchor)
  — the predicate shape; in M2 `entry_id IS NULL` holds for all
  foreground deltas so the naive sweep is equivalent.
- [`data-model.md → Opening entry`](../../../../data-model.md#opening-entry)
  — position invariant, block-delete, rollback floor.
- [`data-model.md → Entry metadata shape`](../../../../data-model.md#entry-metadata-shape)
  — what the existing metadata-update arm covers (context; not
  modified here).
- [M1.5 gate slice → Implementation notes](../../01b-data-foundation/slices/01-gate.md#implementation-notes)
  — the C4 delete-handler contract and the registration surface
  these arms extend.

## Scope: in

- **Delete arm** for `story_entries`, registered through the
  M1.5 dispatch API in the entry domain's own module: full-row
  `undo_payload`, reverse-replay re-insert, store create-patch on
  reversal.
- **Content-update mutator** — direct row update of
  `story_entries.content`, **no delta written**; rejected for
  in-flight-gated states the same as any narrative write.
- **Opening invariants at the action layer:** reject any write
  that would create or move an `opening` entry to a position
  other than 1 of its branch; reject `op=delete` on
  `kind='opening'`; rollback can target entry 1 but never below.
- **Rollback-to-entry action:** given a target entry, select the
  reversal set (`log_position ≥ N` suffix, written in the
  survival-anchor predicate shape), compute the three modal
  bucket counts per
  [`rollback-confirm.md → Counts`](../../../../ui/screens/reader-composer/rollback-confirm/rollback-confirm.md#counts),
  and execute the reversal through the existing reverse-replay
  primitive in one transaction. Hard-deletes the swept entries.
- **Kind coverage:** fixtures exercising the M2-loop kinds —
  `opening`, `user_action`, `ai_reply` — plus a `system` stub
  row (created / deleted like any entry; its UI vocabulary lands
  with the error-surface consumers).

## Scope: out

- The rollback-confirm **modal UI** — [Slice 2.5](./05-reader.md)
  (this slice provides counts + execution; 2.5 provides consent).
- CTRL-Z undo / redo stack — [Slice 2.5](./05-reader.md)
  (composes this slice's arms with the 1.5a reverse-replay).
- The survival-anchor refinement and `processedThrough` clamp —
  M3.3 / M3.9.
- Multi-chapter deep-rollback surface — M5.5 (M2 stories have a
  single open chapter; the modal's chapter-reopened bucket is
  structurally 0).
- Piggyback metadata writes on `ai_reply` — M3.2.

## Acceptance criteria

- Delete arm: deleting an entry captures the full row; reverse-
  replay restores the row byte-identical (including `metadata`)
  and the store patch reappears it — covered by vitest.
- Content-update: editing content mutates the row and **zero**
  rows land in `deltas` — asserted by test; rollback past the
  edited entry still hard-deletes it.
- Opening invariants: creating an opening at position ≠ 1,
  moving it, or deleting it are each rejected with a typed
  action-layer error; rollback targeting entry 1 leaves exactly
  the opening.
- Rollback action: against a fixture branch (an opening, three
  turns, interleaved entity deltas), rolling back to turn 2
  returns bucket counts matching hand-computed values and leaves
  both the log and the rows in the pre-turn-2 state;
  `log_position` stays monotonic-with-gaps.
- Existing 1.5a / 1.5.x entry tests stay green (no behavior
  change on create / metadata-update).

## Tests

- Vitest on the arm round-trips (create → delete → reverse),
  the side-channel non-delta assertion, each opening-invariant
  rejection, and the rollback bucket counts + execution fixture.
- No Storybook surface (action-layer slice).

## Open questions

- Whether the rollback count query needs an index beyond the
  existing `(branch_id, log_position)` unique — measure on the
  fixture; the modal's open-questions note flags deep-rollback
  scan cost as a v1 non-issue.

## Implementation notes

_Populated at finish: notable deviations from the plan and resolved developer decisions._
