# Milestones

Per-milestone implementation work. Each milestone lives in its own
directory (`NN-name/`) with a `milestone.md` definition and a
`slices/` subdirectory holding per-slice docs. See
[../conventions.md](../conventions.md) for authoring conventions.

## Defined milestones

- [Milestone 1 — Spine](./01-spine/milestone.md). Walking
  skeleton across all architectural layers; ends with one
  stub-LLM pipeline run completing end-to-end.
- [Milestone 1.5 — Data foundation](./01b-data-foundation/milestone.md).
  Full relational schema + typed working-set stores + Tier-1 CRUD
  action arms, landed up front so feature milestones build against a
  complete substrate and parallelize. Inserted between M1 and M2; not
  a renumber (M2–M9 stay provisional roadmap entries).
