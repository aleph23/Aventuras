# 2026-05-07 — DeltaLogRow compound

Design pass for the history-tab row. Renders one entry from the
`deltas` table — used by World history, Plot history, and the
future global delta-log surface. Resolves the
[`component-inventory.md → Compounds — needs design`](../ui/component-inventory.md#compounds--needs-design)
row; closes out the v1 needs-design queue (Importer remains
deferred until more import groundwork lands).

## Outcome

DeltaLogRow is a thin host-driven compound. The host queries the
deltas table, resolves target identity (querying target tables
for display names), and renders the diff prose; the compound
takes pre-formatted display strings opaque and lays them out
with op-keyed visual treatment. Pattern matches the host-side
formatting contract EntryCard's `worldTimeLabel` and StoryCard's
`chapterLabel` already use.

## Why host-side resolution (not compound-side)

The fundamental fork was: does the compound resolve `target_id`
to a display name (per `target_table`) and humanize the
`undo_payload` diff, or does the host pre-compute these and
hand them in opaque?

**Compound-side** would need a registry of per-`target_table`
resolvers (11 target tables — see the `deltas` schema in
[data-model.md → Diagram](../data-model.md#diagram)) and a
per-table diff humanizer that knows what `state.traits[2]`
means vs `description` vs `tags[]`. Big internal API surface;
couples a UI compound to every domain shape.

**Host-side** matches the project's existing pattern of
pre-formatted strings. Per-screen History tabs naturally know
their target tables — World History tab filters to entities
and lore; Plot History tab filters to threads and happenings;
the future global surface knows it's cross-cutting. Per-target
rendering lives where the target lives.

DeltaLogRow stays thin; the compound API surfaces only the
display contract.

## Compound API

```ts
type DeltaLogRowProps = {
  delta: {
    id: string
    op: 'create' | 'update' | 'delete'
    source: 'ai_classifier' | 'user_edit' | 'lore_agent' | 'memory_compaction' | 'chapter_close'
    targetTable: string // for the host's resolution call; compound uses it as a fallback label only
    targetDisplayName: string // pre-resolved by host
    fieldPath: string | null // op=update: "state.traits[2]"; op=create/delete: null
    summary: string // pre-rendered diff prose, host-formatted
    entryId: string | null // null for non-entry-triggered (chapter close, direct user edit)
    createdAtRelative: string // pre-formatted "2h ago" / "12 Apr 14:33"
    actionId: string // included for future grouping cue; v1 renders flat
  }
  onPress?: () => void // host wires navigation (open target, jump to entry, etc.)
  className?: string
}
```

**Pre-formatted strings policy** mirrors EntryCard's
`worldTimeLabel` and StoryCard's `chapterLabel`. The compound
stays domain-agnostic; host-side rendering keeps domain
knowledge co-located with the surface.

## Visual shape

```
┌──────────────────────────────────────────────────┐
│ [● update]  Kael · state.traits                   │   ← op badge + target + field path
│ Added "former soldier"; was ["brave", "loyal"]    │   ← summary (2-line ellipsis)
│ classifier · entry #47 · 2h ago                   │   ← meta: source · entry · time
└──────────────────────────────────────────────────┘
```

### Op badge

Left-anchored, ~10-12 px dot or short pill. Color-keyed:

| op       | Color slot                      |
| -------- | ------------------------------- |
| `create` | `text-success-fg bg-success-bg` |
| `update` | `text-accent-fg bg-accent-bg`   |
| `delete` | `text-danger-fg bg-danger-bg`   |

The op label renders inside the badge (e.g., `update`) at
`text-xs font-medium` for at-a-glance scan.

### Target line

`<targetDisplayName>` in `font-medium`, with `·` separator
and `<fieldPath>` muted when present. Target table is encoded
into the host's `targetDisplayName` (e.g., "Kael" already
implies entity; "Iron Pact" already implies thread) — no
separate "entity" / "thread" tag. If the host needs the
table-typed prefix (cross-table global view), it can compose
the displayName accordingly (e.g., "Entity · Kael" or
"Thread · Iron Pact").

Long target names truncate inline with ellipsis (~30 chars).
Field path is technical; truncated similarly if long.

### Summary

The host's pre-rendered diff prose. 2-line ellipsis bound. The
host owns rendering — for an entity update, this is a
human-friendly translation of the `undo_payload` JSON. For
create/delete, this can be a one-liner (`Created`, `Deleted`).

### Meta line

- **Source label** — compound owns the enum → label mapping
  (small, bounded):
  - `ai_classifier` → `classifier`
  - `user_edit` → `user`
  - `lore_agent` → `lore agent`
  - `memory_compaction` → `memory compaction`
  - `chapter_close` → `chapter close`
- **Entry link** — `entry #<n>` when `entryId` non-null;
  omitted when null (for chapter-close, direct user edits).
  Implementation note: host can supply a pre-formatted "entry
  #47" via the entry's position; compound doesn't compute the
  number itself.
- **Time** — `createdAtRelative` opaque.

Middle-dot separators (`·`) between meta segments. Muted
foreground (`text-fg-muted text-xs`).

## Click behavior

`onPress?: () => void` — host wires:

- Entity / lore / thread / happening targets → open in respective
  detail pane.
- `entryId` set → option to navigate to the entry in reader.
- The compound just emits the press; routing is host concern.

When `onPress` is undefined, the row is non-interactive (no
hover, no press affordance). Useful for read-only displays.

## What this design defers

- **Action grouping (`action_id`).** v1 renders one row per
  delta; visually clustering deltas that share an `action_id`
  (e.g., chapter-close producing many state mutations) is a
  future affordance. Could be a disclosure-row that expands to
  show the grouped deltas, or a small badge linking to a
  filtered view.
- **Inline diff expansion.** v1 truncates summary to 2 lines.
  Full-detail expansion (showing the raw `undo_payload` JSON
  via the [JSONViewer pattern](../ui/patterns/data.md#raw-json-viewer--shared-modal-pattern))
  is a future enhancement, probably triggered by a "details"
  action on the row.
- **Bulk rollback affordances** (rollback to this point,
  rollback this entire action). History is read-only in v1;
  rollback lives in the reader's per-entry path.

## Adversarial summary

**Load-bearing assumption:** host-side resolution is the right
division. If wrong, compound balloons into a target-aware
component with an internal registry. Risk low — per-screen
History tabs already filter by target table; resolution
naturally co-locates.

**Edge cases verified:**

- `fieldPath: null` for create/delete — target line drops the
  field-path segment.
- `entryId: null` — meta line skips the entry link.
- Long target name — truncates with ellipsis.
- Action grouping — flat in v1; data is present for future use.
- Hard-deleted target — host passes `(deleted entity)`
  placeholder. Compound doesn't need special handling.

**Verified:**

- `deltas` table shape (data-model.md:194).
- World History tab properties (world.md:323).
- Plot History tab references World's spec (plot.md:316).
- Source enum values (data-model.md:200).

**Assumed:**

- 2-line summary truncation as the v1 lean. Wireframes don't
  pin a specific number; 2 is a reasonable default for log
  scannability.
