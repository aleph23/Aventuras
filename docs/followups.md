# Follow-ups

Top-level ledger of **active** outstanding items — design questions
or work the current milestone (v1) needs answered, or that block
other v1 work. Resolved items are **removed** (not crossed out); the
commit that resolves an item carries the resolution narrative.

Items confirmed for a future milestone or parked indefinitely
pending signal live in [`parked.md`](./parked.md). Movement between
the two files is normal as scope clarifies; see
[`conventions.md → Followups vs parked`](./conventions.md#followups-vs-parked)
for the placement rule.

## Data-model

- **Background-work log positions need a reservation scheme to fix
  reversal over-reversal — design before dev.** Positional reversal
  (rollback, regenerate, swipe-switch, and CTRL-Z of a turn — see
  [`data-model.md → Entry mutability & rollback`](./data-model.md#entry-mutability--rollback))
  reverses every delta at or above a boundary `log_position`, which
  assumes log-position order matches semantic order. The **periodic
  classifier breaks that**: lagging behind the head, it commits
  happenings about _old, surviving_ turns at _new_ tail positions, so a
  reversal of a later turn sweeps valid facts about turns that aren't
  being undone. The in-flight race and the
  already-committed-about-this-turn sweep are already handled — prose
  reversals cancel the in-flight classifier via the
  `waitForClassifier('cancel')` barrier (see
  [`generation-pipeline.md → Prose reversals and the classifier barrier`](./generation-pipeline.md#prose-reversals-and-the-classifier-barrier))
  — so this _over-reversal_ direction is the residual. To resolve:
  - **Reservation scheme.** Background work claims a `log_position`
    slot up front (near the turn it describes) so its writes sort by
    semantic position, not commit time. Closes both the over-reversal
    and the aggressive-cadence dangling case — an action-scoped CTRL-Z
    of a turn whose periodic-classifier deltas committed above it
    (those carry a separate `action_id`, so action-scoped undo can't
    reach them).
  - **v1 stopgap to decide.** Until the scheme lands, over-reversed
    facts are recovered only if the classifier re-derives them, which
    requires its last-processed watermark to be reversal-aware (rolled
    back with the suffix). If the watermark is operational state a
    positional sweep doesn't touch, the loss is permanent. Pin whether
    v1 wants the reversal-aware watermark or accepts the loss.
  - Touches
    [`data-model.md → Entry mutability & rollback`](./data-model.md#entry-mutability--rollback)
    and the classifier's progress tracking in
    [`classifier.md → Persistence`](./memory/classifier.md#persistence).

## UX

- **Smoke trigger + synthetic-story scaffolding is debug-only.**
  [Slice 1.7c](./implementation/milestones/01-spine/slices/07c-smoke.md)
  shipped a `__DEV__`-gated "Run smoke" button in the reader-composer,
  the `components/reader/smoke/` module (the `'smoke'` pipeline, its
  phase, and `runSmoke`'s synthetic story/branch bootstrap), and the
  `registerStubProvider()` dev seam in `lib/ai`. All of it is
  scaffolding flagged `TODO(spine)`; remove the module, the reader-route
  trigger, and the `lib/ai` seam when real story-creation and
  provider-settings UI land.
