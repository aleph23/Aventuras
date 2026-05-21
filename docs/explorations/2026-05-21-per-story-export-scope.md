# Per-story export — table-by-table scope

Status: draft exploration. Resolves the
[`followups.md`](../followups.md) UX item "Per-story export format
scope". Canonical text lands in
[`data-model.md → Backup & export format`](../data-model.md#backup--export-format);
this record keeps the rationale.

## The question

[`data-model.md → Backup & export format`](../data-model.md#backup--export-format)
lists what a per-story `.avts` export includes and what it strips,
but neither list is exhaustive. `probe_captures` is never named, and
the inclusion enumeration omits `character_relationships` and
`branch_era_flips`. Surfaced while resolving
[translation rows in export / import](./2026-05-21-translation-export-import.md).

Rather than patch the omission table by table forever, settle it
once: classify **every** table in the schema, and adopt a rule that
forces every future table to be classified too.

## Decision

Three pieces: a load-bearing rule that fixes the strip/travel split,
an exhaustive 20-table manifest that the schema must keep complete,
and a dependency-carry model for the one cross-table reference a
per-story export can't strip — the calendar.

### The load-bearing rule

The strip / travel split is not ad hoc. It falls out of one
invariant: **every delta-logged table must travel.**
`deltas.target_table` enumerates twelve tables; stripping any of
them while keeping the delta log corrupts reverse-replay (CTRL-Z,
rollback, crash-recovery) — the same argument the translation
session used for `translations`. So the strip set can only be drawn
from **non-delta-logged** tables, and within those only the
**derived** ones — reproducible caches and diagnostics, never story
content. `embeddings` and `probe_captures` are exactly the
non-delta-logged derived tables; both carry explicit "not
delta-logged" schema comments. That is why stripping them is safe
and stripping anything else is not.

The rule rides on one assumption: derived caches are never
delta-logged. True today. If a future table is ever both, the rule
self-conflicts — and the manifest below is what surfaces that,
because every table must appear in it.

### The manifest

Every table in the schema gets a row. A schema addition is
**incomplete until its export disposition is added here** — the
forcing function that kills the "enumeration has holes" recurrence.

| Table                     | Disposition               | Rationale                                                                                                                                                                                      |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stories`                 | Travels (fields stripped) | The story row. `settings.models`, `settings.embedding_provider_id`, `settings.embedding_model_id` omitted (exporter-`app_settings` refs). All other `settings` and all of `definition` travel. |
| `branches`                | Travels                   | All branches. Branch container — not delta-logged, but story content.                                                                                                                          |
| `story_entries`           | Travels                   | All entries, all branches; `metadata` JSON included.                                                                                                                                           |
| `entities`                | Travels                   | `embedding_stale` travels as-is; the post-import re-index is its reconciliation point.                                                                                                         |
| `lore`                    | Travels                   | Delta-logged story content.                                                                                                                                                                    |
| `threads`                 | Travels                   | Delta-logged story content.                                                                                                                                                                    |
| `happenings`              | Travels                   | Delta-logged story content.                                                                                                                                                                    |
| `happening_involvements`  | Travels                   | Delta-logged link table.                                                                                                                                                                       |
| `happening_awareness`     | Travels                   | Delta-logged link table; `retrieval_count` travels.                                                                                                                                            |
| `character_relationships` | Travels                   | Was unnamed in the prose enumeration. Delta-logged story content.                                                                                                                              |
| `chapters`                | Travels                   | Delta-logged story content.                                                                                                                                                                    |
| `branch_era_flips`        | Travels                   | Was unnamed in the prose enumeration. Delta-logged narrative state.                                                                                                                            |
| `translations`            | Travels                   | Resolved by the prior session — paid LLM output, no setup coupling.                                                                                                                            |
| `entry_assets`            | Travels                   | Delta-logged link table.                                                                                                                                                                       |
| `deltas`                  | Travels                   | The delta log itself; every other table's integrity depends on it.                                                                                                                             |
| `assets`                  | Dependency — carried      | Referenced rows only, collected via `entry_assets` **and** `stories.cover_asset_id`. Binary embedded.                                                                                          |
| `vault_calendars`         | Dependency — carried      | The one referenced **custom** calendar row, embedded (see below). Built-ins not carried — resolved by id.                                                                                      |
| `embeddings` (`vec0`)     | Stripped                  | Reproducible from source content; model-space-bound. Not delta-logged.                                                                                                                         |
| `probe_captures`          | Stripped                  | Was unnamed. Diagnostic, not story state; not delta-logged; FIFO-evicted; deep-mode vectors model-bound. Branch-forking already drops them.                                                    |
| `app_settings`            | Does not travel           | Global singleton; sources the strip list, never itself exported.                                                                                                                               |

Twenty tables, all classified.

Two findings the sweep produced beyond the three named tables:

- **Cover-asset reachability.** The old enumeration said
  "entry→asset references." But `stories.cover_asset_id` is a
  *story*→asset reference — a story cover would be dropped on
  export. The asset-collection walk must union `entry_assets` and
  `cover_asset_id`.
- **Dependency references resolve on import.** The calendar fork
  (below) rewrites `stories.definition.calendarSystemId`; asset
  content-hash dedup similarly resolves `entry_assets.asset_id` to
  the importer's existing row. This is **not** story-internal FK
  rewriting — story-internal IDs (`branch_id`, delta `target_id`,
  etc.) still import verbatim. Dependency-table references are a
  distinct, consistent category. The canonical doc must word the
  two categories apart.

### Calendar dependency — embed + content-validated dedup

A story's `definition.calendarSystemId` resolves against the merged
registry — built-ins (in code, on every install) or `vault_calendars`
rows (local to the exporter). Built-ins resolve by id on import.
Custom calendars are the gap: a per-story export of a story on a
custom calendar would import with a dangling `calendarSystemId`, and
`worldTimeOrigin` is a `TierTuple` shaped to that calendar's tiers —
silent corruption, not graceful fallback.

**Export.** If `calendarSystemId` resolves to a `vault_calendars`
row, embed a `calendar` sub-object — `{ id, name, definition }` — in
the `aventuras-story` payload. Same shape as the standalone
`aventuras-calendar` content payload, just nested; no new
serialization. A built-in id embeds nothing.

**Import**, for a custom `calendarSystemId` carrying an embedded
calendar:

1. **No `vault_calendars` row with that `id`** → insert the embedded
   calendar as a new row (`favorite=0`, fresh timestamps). Story
   points at it.
2. **Row exists, `definition` structurally deep-equals the embedded
   `definition`** → true dedup. Story points at the existing row;
   embedded copy discarded. `name` / `favorite` differences are
   ignored — per-user library preferences, not story-affecting
   (worldtime display depends only on `definition`).
3. **Row exists, `definition` differs** → **fork**. Allocate a fresh
   `cal_` id, insert the embedded calendar under it, rewrite
   `stories.definition.calendarSystemId` to the new id. The
   importer's existing same-id row is left untouched — a story
   import must never mutate the importer's library.

Same `id` does not prove same calendar: both sides may have cloned
from a shared `.avts` and one edited it, or the importer imported an
earlier copy of this very story and then edited the calendar.
Case 3 detects that. No stored hash column — `definition` JSON is
small, a canonicalized deep-equal at import time is enough; no
schema change.

**Why fork beats keep-importer's on divergence.** `worldTimeOrigin`
is a `TierTuple` keyed by the exporter's calendar's tier names, and
`branch_era_flips` were authored against it. Point the story at a
divergent calendar and that tuple may not match the tier shape.
The embedded calendar _is_ the one the story was authored against,
so forking keeps `worldTimeOrigin` consistent. Only
`calendarSystemId` is rewritten; `worldTimeOrigin` keys and
`branch_era_flips` are calendar-id-agnostic.

**Imported-calendar naming.** Cases 1 and 3 create a row; the new
row's `name` gets ` (story import)` appended — a one-time,
user-editable default name for Vault transparency, not a durable
type badge (origin chips would need a `vault_calendars` provenance
column and Vault UI — scope creep this session declines). Appended
only if the name does not already end with the suffix, so the
re-export chain cannot accumulate ` (story import) (story import)`.
Case 2 creates no row and keeps the importer's existing name.

**Transparency.** The import dialog (already surfaces re-index cost)
gains a conditional line when a custom calendar is added — worded as
a divergence notice in the fork case. No blocking modal, no 3-way
conflict UI: the only safe outcomes are dedup-identical or
fork-divergent. "Use the story's version" would overwrite the
importer's library; "keep mine" renders the story wrong.

**Deletion guarantee.** Export can always resolve a story's
`calendarSystemId` because a custom calendar in use by a story
cannot be deleted —
[`calendars.md → Delete safety`](../ui/screens/vault/calendars/calendars.md#delete-safety)
blocks deletion at `usage_count > 0`. No unresolvable-reference path
exists at export time.

## Adversarial pass

- **Load-bearing assumption** — "delta-logged ⇒ travels; strip set ⊆
  non-delta-logged derived tables." Verified against
  `deltas.target_table` literally: the twelve enumerated tables are
  exactly the "Travels" set, and both stripped tables carry explicit
  "not delta-logged" comments. The assumption underneath (derived
  caches are never delta-logged) is true today; the manifest is the
  forcing function that surfaces any future violation.
- **Built-in calendar cross-version gap** — §1 resolves built-ins by
  id and embeds nothing, assuming the importer's built-in set ⊇ the
  exporter's. True at v1 (one built-in, `earth-gregorian`). If a
  later minor adds a built-in, a minor-newer `.avts` could reference
  a built-in id an older importer lacks. Resolution: adding a
  built-in calendar is a format-version change, not a silent minor.
  One sentence in the doc, no followup.
- **Calendar deleted under a story** — cannot happen;
  [`calendars.md → Delete safety`](../ui/screens/vault/calendars/calendars.md#delete-safety)
  blocks deletion while `usage_count > 0`. Edge case dissolves.
- **Edge cases — benign.** Empty story: trivial travel. Imported
  `probe_mode_active: true` with zero captures: identical to a story
  that just enabled probe mode. `embedding_stale` flags travel; the
  post-import re-index reconciles them, and until it completes
  imported embeddable rows have no `vec0` vectors so retrieval
  treats them as stale anyway. Failsafe per-story JSON dump inherits
  the export shape — a full-app restore from failsafe JSON strips
  `probe_captures` / `vec0` and dedups shared embedded calendars
  correctly. The envelope's new optional `calendar` field is
  additive (minor bump); pre-feature importers would ignore it, but
  it ships with v1 so practical exposure is nil.
- **No secrets travel** — API keys live in `app_settings.providers`,
  which does not travel; the stripped `settings` fields are model
  references, not keys. Verified.
- **Packs** — `stories.settings.activePackId` / `packVariables`
  reference global pack content. Null at v1 (packs deferred). When
  packs ship they inherit this calendar dependency-carry pattern;
  the doc names that forward so the pattern is already established.

Nothing found that breaks the design.

## Integration

- [`data-model.md → Backup & export format`](../data-model.md#backup--export-format):
  replace the prose inclusion / strip enumeration with the manifest
  table; add the load-bearing rule, the calendar dependency-carry
  model (§1), the cover-asset reachability fix, the
  dependency-reference wording, the built-in-calendar format-version
  sentence, and the packs forward note. No heading rename — the
  `#backup--export-format` anchor is stable.
- [`data-model.md → Aventuras file format`](../data-model.md#aventuras-file-format-avts):
  note the `aventuras-story` payload's optional `calendar`
  sub-object as an additive (minor) field.
- [`followups.md`](../followups.md): remove the resolved UX entry
  "Per-story export format scope".
- No `architecture.md`, `calendar-systems/spec.md`, or per-screen
  doc changes — export format is data-model's surface; the calendar
  deletion guarantee already lives in `calendars.md`. No wireframe
  changes — the import-dialog copy is specified in `data-model.md`
  prose, not a wireframe.
- No new followups.
