# Slice 1.5.2 — Entities (World)

## Metadata

- **Milestone:** [Milestone 1.5 — Data foundation](../milestone.md)
- **Depends on:** [Gate](./01-gate.md) — the `entities` table DDL +
  `EntityState` TS type, the dispatch registration API, the base store
  factory, and the store-mirror contract.
- **Blocks:** nothing in M1.5 (parallel with the other domain slices).
  Consumed downstream by the World panel (M4) and the classifier (M3).

## Goal

Make `entities` a live, reversible domain: the working-set store, the
Tier-1 create / update / delete arms registered through the gate's
dispatch API, and the four per-kind `state` Zod shapes registered for
delta encoding. The largest domain slice — entities carries the four
typed `state` variants.

## Background

`entities` is the unified actor table (character / location / item /
faction) with a `kind` discriminator and a typed-JSON `state` column
per [`data-model.md → World-state storage`](../../../../data-model.md#world-state-storage).
`description` is the user-authoritative prose "who"; `state` is the
typed, classifier-mutable layer. This slice ships only the data layer —
generic CRUD + the store. The classifier writes (M3) and the World
panel reads (M4) come later; their authorship matrix and per-field
cadence are out of scope here.

The gate types `entities.state` as the `EntityState` discriminated
union; this slice owns its **runtime Zod** and registers it for delta
encoding (per
[milestone C3](../milestone.md#c3--json-shape-ownership-split)). The
`state` Zod must preserve the
[encoder's hard invariants](../../../../data-model.md#entry-mutability--rollback)
(record value-types non-nullable; no `z.optional()` over
`z.nullable()`) — both already hold for the specced shapes
(`stackables: Record<string, number>` has a non-nullable value type;
`voice?`, `distinguishing?` are optional, not optional-over-nullable).

## Required reading

- [`data-model.md → World-state storage`](../../../../data-model.md#world-state-storage)
  — table rationale, description-vs-state boundary.
- [`data-model.md → CharacterState shape`](../../../../data-model.md#characterstate-shape),
  [`LocationState`](../../../../data-model.md#locationstate-shape),
  [`ItemState`](../../../../data-model.md#itemstate-shape),
  [`FactionState`](../../../../data-model.md#factionstate-shape)
  — the four `state` variants.
- [`data-model.md → Soft caps + compaction discipline`](../../../../data-model.md#soft-caps--compaction-discipline)
  — the **Zod degradation bounds** (the `.max()` ceilings) this slice
  encodes; note these are crash-bounds, NOT the prompt soft caps
  (schema does not `.max()` to prompt-cap counts).
- [`data-model.md → Entry mutability & rollback`](../../../../data-model.md#entry-mutability--rollback)
  — the `op=update` nested-partial encoding and the hard invariants.

## Scope: in

- **`entities` runtime Zod** registered via the gate API: the
  `EntityState` discriminated union over `kind` (Character / Location /
  Item / Faction) with the degradation bounds — `voice.max(2000)`;
  `traits` / `drives` / `agenda` arrays `.max(50)`;
  `distinguishing.max(20)`; each `visual.*` sub-field `.max(500)`;
  `condition` / `standing` `.max(500)`; `stackables` keys non-empty
  `.max(40)`, values non-negative integers. Entity-ref fields
  (`current_location_id`, `equipped_items`, `inventory`, `faction_id`,
  `parent_location_id`, `at_location_id`) typed as id strings.
- **`entities` working-set store** via the base factory: current
  branch's entity rows keyed by id, read selectors (by id, by kind,
  by branch), the internal patch surface the store-mirror calls. No
  speculative public mutators.
- **Tier-1 CRUD arms** registered through dispatch: create (op=create,
  undo=null), update (op=update, nested-partial undo over narrative
  fields + `state`), delete (op=delete, full-row undo). Narrative
  fields delta-log; the operational compute-lifecycle columns
  (`embedding_stale`, `name_collision_flag`) are written outside the
  delta path (no consumer in this slice — set by retrieval / classifier
  later).
- **Tests** per [milestone C4](../milestone.md#c4--domain-slice-template).

## Scope: out

- **`LocationState.parent_location_id` cycle-guard** — the action-layer
  pre-commit parent-chain walk (depth-cap 100) is M4 orchestration per
  [`data-model.md → LocationState`](../../../../data-model.md#locationstate-shape).
  This slice's update arm writes `parent_location_id` without the walk.
- **Classifier reconcile / authorship policy** — who writes which field
  when, UPSERT-from-prose, `lastSeenAt` maintenance (M3).
- **Embedding / `embedding_stale` lifecycle** and the
  `name_collision_flag` collision-review driver (M3 / retrieval).
- **World panel reads** and entity-state search via `json_extract`
  (M4).
- **`stackables` transfer semantics** (the paired decrement/increment
  under one `action_id`) — that is a classifier/UI orchestration; the
  arm here writes whatever `state` it's given.

## Acceptance criteria

- The `EntityState` Zod parses each kind's specced shape, applies the
  degradation bounds, and round-trips through the dispatch encoder.
- create / update / delete arms write the row + delta and patch the
  store on commit; reverse-replay reverses both row and store patch.
- An `op=update` touching a nested `state` sub-path (e.g.
  `state.visual.attire`, adding a `stackables` key, nulling
  `current_location_id`) produces a correct nested-partial
  `undo_payload` and reverse-replay restores the prior value (covers
  the three `null`-sentinel cases).
- A write to a non-held branch no-ops against the store.
- `pnpm lint`, `pnpm typecheck`, `pnpm lint:docs`, vitest pass.

## Tests

- **Per-kind Zod.** Parse a representative Character / Location / Item /
  Faction `state`; assert defaults + a degradation-bound rejection.
- **CRUD roundtrip.** Insert + query each op; assert inferred types.
- **Undo encoding.** `op=update` nested-partial for: scalar change
  (`name`), nested-object change (`state.visual.attire`), nullable-leaf
  `non-null → null` (`current_location_id`), record add/remove
  (`stackables` key) — encode then reverse-replay restores pre-state.
- **Store patch.** Create / update / delete patch the held-branch
  store; non-held branch no-ops; reverse-replay reverses the patch.

## Open questions

- **Store granularity** — one `entities` store keyed by id with
  `by-kind` selectors, vs per-kind stores. Lean: one store, kind is a
  selector axis (matches the single table). Confirm at authoring.
- **Operational-column write surface** — `embedding_stale` /
  `name_collision_flag` need a non-delta write path eventually; this
  slice can omit it (no consumer) or stub a minimal operational setter.
  Decide at authoring; not a blocker.

## Implementation notes

_Populated at finish: notable deviations from the plan and resolved developer decisions._
