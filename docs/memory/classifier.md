# Periodic classifier contract

A background agent that runs on a configurable cadence (see
[`cadence.md → classifierCadence`](./cadence.md#user-tunable-knobs))
and reads the recent prose window not yet covered by piggyback's
per-turn writes. Its job is populating the structured graph that
retrieval queries against.

## What the classifier writes

- **Happenings** — `happenings`, `happening_involvements`,
  `happening_awareness`. New rows for events extracted from the prose
  window, with `decay_resistance` set per awareness row from the
  model's per-character severity judgment at extraction time.
- **Status transitions** — `entities.status` flips:
  - `staged → active` when prose mentions a staged entity in scene
    (the slow path; see
    [Staged-entity promotion](./edge-cases.md#staged-entity-promotion)).
  - `active → retired` on hard finality signals only (death, exile,
    faction-disbanded). Conservative bias.
- **First-introduction descriptions** — when the classifier extracts
  a genuinely new character (no name match against existing
  entities), it authors the initial `description` from prose. After
  first introduction, the classifier never amends `description` (the
  authorship contract in
  [`data-model.md → World-state storage`](../data-model.md#world-state-storage)
  remains intact).

## Embedding compute boundary

The classifier emits rows and embeds them in the same transaction —
new happenings, first-introduction entity descriptions, and any
other write touching an embedded field go through the eager-sync-
on-write contract specified in
[`retrieval.md → Compute lifecycle`](./retrieval.md#compute-lifecycle).
The classifier itself runs as a background agent (see
[Background-task framing](#background-task-framing) below), so the
inline embed cost stays off the user-facing critical path.

If the embedder is unavailable at write time (local model still
initializing, provider mode network down), the metadata write
succeeds, the row is marked `embedding_stale = 1`, and a worker
drains the flagged set when the embedder is healthy again. Same
path as any other embedded-field write — no classifier-specific
deferral mechanism.

The classifier does not modify already-embedded fields on existing
rows. Status flips touch `entities.status` only, which isn't
embedded. If a future extension lets the classifier modify an
embedded field, it goes through the same eager-sync contract — no
special path required.

The transient embedding computed in the disambiguation flow below
(extracted description for the similarity check) is a decision-time
computation, not a persisted embedding write — outside this
boundary.

## Disambiguation on new-character mentions

For every "new character" candidate the classifier extracts, code-side
reconciliation runs before the create / promote decision. Flow:

1. **Name lookup** against the entity index (active, staged, retired).
   O(1) hash check. The classifier itself doesn't need to know about
   every character; the index does.
2. **No name match** → genuinely novel character. Create fresh entity.
3. **Name match found** → embedding similarity between the
   classifier-extracted description and the existing entity's
   description. Existing entity's embedding is cached (see
   [`retrieval.md → Embedding infrastructure`](./retrieval.md#embedding-infrastructure));
   the extracted description embeds once.
   - **High similarity** (`sim ≥ τ_high`) → promote staged → active OR
     treat as already-known active mention. Update entity if the
     extracted description adds information.
   - **Low similarity** (`sim < τ_low`) → create new entity with
     `name_collision_flag = true` for World-panel review.
   - **Ambiguous** (`τ_low ≤ sim < τ_high`) → conservative create-new
     with the flag, defer to user.

Thresholds (`τ_high`, `τ_low`) are tunable. Defaults TBD empirically
once real story data exists; sensible starting ranges (e.g. 0.75 /
0.50 cosine) until tuning lands.

## Background-task framing

The periodic classifier runs as a background agent, not a synchronous
pipeline phase:

| Field            | Value                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `gateBehavior`   | `'no-gate'`                                                                                                          |
| `conflictPolicy` | `'concurrent-allowed'`                                                                                               |
| `affordance`     | `'pill-only'` (or `'invisible'` — UI surface design TBD)                                                             |
| `writeSet`       | happenings, happening_involvements, happening_awareness, entity status flips, first-introduction entity descriptions |

The single-writer invariant in
[`architecture.md → Generation transactions and edit gating`](../architecture.md#generation-transactions-and-edit-gating)
relaxes to **single-writer-per-write-set** in v1. Piggyback's
write-set and the classifier's write-set are disjoint at the
row-and-field granularity (see
[`cadence.md → Concurrency`](./cadence.md#concurrency)).

If the user starts a new turn while the classifier is mid-run, both
proceed. The classifier holds its own `action_id` for its writes; the
user-turn pipeline holds its own. Reverse-replay on rollback peels
them off independently.

`'abort-self'` was rejected as wasteful — it discards in-flight
classifier work that doesn't conflict with the new turn's writes
anyway.
