# Importer compound — design pass

Session record, 2026-05-26. Resolves the
`Importer compound — design pass` followup (removed from
[`followups.md`](../followups.md) by the same commit). Canonical
spec lands at
[`ui/patterns/import-dialog.md`](../ui/patterns/import-dialog.md);
this file is the frozen reasoning trail.

## Problem

[`patterns/data.md → Import counterparts`](../ui/patterns/data.md#import-counterparts--file-based--vault)
established the cross-cutting contract — every export affordance
has a file-based import counterpart, JSON validates against zod,
no partial saves. [`data-model.md → Aventuras file format`](../data-model.md#aventuras-file-format-avts)
pinned the `.avts` envelope (`format`, `formatVersion`, payload
sub-key) and the per-UI-gated import surface rule. But the actual
import _UI_ was sketched-only:

- Vault calendars had a textarea-shaped paste box in
  [`calendars.md`](../ui/screens/vault/calendars/calendars.md).
- World/Plot per-row import deferred to "patterns/data.md"
  without specifying the flow.
- Story-list `[Import story…]` was described as "file picker
  opens" with no body.
- [`component-inventory.md`](../ui/component-inventory.md) listed
  the `Importer` compound under _Compounds — needs design_ with
  the note: "Action surfaces per host differ enough that the
  wrapper shape needs a design pass before scaffolding."

[`roadmap.md → M4`](../implementation/roadmap.md#m4--world--plot-read-surfaces)
puts entity per-row import in the first slice; the followup
explicitly blocked scaffolding. This pass produces the canonical
spec and unblocks M4, M8.3, and M9.4.

## Decisions and rationale

Resolved by clarifying questions, in order:

### Trigger shape: two variants, host-wired

Story-list's `[Import story…]` is a flat button; World/Plot and
Vault calendars use `+ New X ▾` / `+ Add X ▾` menus via the shipped
`ImporterMenu`. The roadmap promises a shared compound. The
question was whether the compound _renders_ the trigger
(trigger-aware component) or _connects via_ the trigger (pure-view
dialog + host-wired trigger).

**Pure-view dialog + host-wired trigger chosen.** Matches the
project's established precedent for dialog compounds
(`CollisionResolveDialog`, `EmbedderDownloadDialog` — both pure
View, both driven by host code). Per-host menu options
(`Blank`, `Clone built-in`, `From Vault…`, `From scratch`) stay in
host territory, where their copy already lives. The compound's
Storybook stories are trivially constructable with bare zod
schemas + a no-op `onValidated`.

### Two sources: file + clipboard buttons, no textarea

The Vault calendars sketch had a paste textarea alongside a file
picker. Decision: collapse to **two buttons** — `[📁 Choose .avts
file…]` and `[📋 Import from clipboard]` — no textarea. Removes
the file-vs-paste mutual-exclusivity question entirely; each
button is a single source that triggers the same pipeline.

### Vault picker carved out

`From Vault…` is a disabled placeholder until the Vault parent
shell lands (M8.3). It stays a per-host menu option, _not_ a
Dialog state. The Vault-source design is a future pass; this
compound has no `vaultPicker` slot.

### Host owns commit; compound emits validated payload

The compound's job ends at "here's a parsed, zod-validated
payload." Host owns the action-layer write, routing, toasts, and
collision-handling. Mirrors `EmbedderDownloadDialog`'s
pure-View + driver pattern. The decisive reason: each host's
success behavior is genuinely different (Vault calendars assigns a
fresh UUID; story-list routes to the reader; per-row creates a row
and selects it), and pulling those into the compound would push
domain knowledge into a domain-agnostic primitive.

### Dialog at every tier; Sheet question parked

The vault-calendars sketch implied a centered modal at every
tier; user picked **Dialog** outright. The broader question — does
the project drop Sheet in favor of Dialog/Modal generally, and
should native dialogs migrate to native form-sheet `Modal` per
[`ui-native-modals.md`](../../.agents/skills/vercel-react-native-skills/rules/ui-native-modals.md)
— is parked as a v1 followup. This design follows the existing
`@rn-primitives/dialog`-backed `Dialog` primitive.

### Legacy `.avt` carved out

The compound is `.avts`-only. Legacy `.avt` migration import
keeps its
[parked entry](../parked.md#legacy-avt-migration-import) and gets
its own design pass when migration UX lands.

### Hybrid error display: meta-error banner vs payload-validation summary

Two categorically different failure modes. **Meta-errors** (wrong
`format`, incompatible major version, malformed envelope) surface
as a categorical banner: `⚠ This is a different kind of Aventuras
file.` / `⚠ This file is from a newer version. Update Aventuras
to import.` No expand, no field list — picking the wrong file
isn't a fixable diagnostic, it's a wrong-file signal.
**Payload errors** (zod-validation failures on the kind's schema)
surface as a single-line summary `⚠ Invalid format — N issues.
[Show details ▾]` with a collapsed field-level list. The
hand-authoring use case gets actionable feedback; the
wrong-file-picker use case gets a clear redirect.

The meta-check is hand-rolled over the envelope header, not zod.
That's deliberate: a unified envelope-zod schema would surface
meta-failures _as_ field-list entries, breaking the categorical
distinction.

### AVTS format enum extended for per-row imports

`data-model.md` enumerated only `aventuras-story` and
`aventuras-calendar` in v1. Per-row imports need their own
format names. Chosen: **coarse, kind-discriminated.** Adds:

- `aventuras-entity` — payload includes a `kind` field
  (`character | location | item | faction`); schema is a zod
  discriminated union.
- `aventuras-lore` — separate from entities per the existing
  world data model.
- `aventuras-thread`, `aventuras-happening` — Plot per-row.

Four new format values. Matches the entities-as-one-table
data-model decision; cross-kind portability flows through one
envelope kind. The tradeoff vs per-kind formats (seven values) is
that kind-mismatch (location JSON into character slot) surfaces
as a payload-error rather than a meta-error. The adversarial
pass resolved this by requiring hosts to pass a
**kind-narrowed schema** — see Adversarial finding #1.

## Approaches considered

Three component shapes were weighed:

- **A — Trigger-aware compound.** One component renders trigger
  - Dialog: `<Importer trigger="menu" extraOptions={…} … />`.
    Shortest host wiring. **Rejected:** per-host menus differ
    enough (`Blank` / `Clone built-in` / `From Vault…` / `From
scratch` are all per-host copy) that a slot-style
    `extraOptions` config grows ugly. Diverges from
    `CollisionResolveDialog` precedent.
- **B — Pure-view `ImportDialog` + host-wired trigger.**
  Compound = Dialog + flow + state. Host wires `<ImporterMenu>`
  or `<Button>` themselves. **Chosen.** Matches precedent;
  separation of concerns is sharp.
- **C — `useImporter()` hook returning `{ open, dialog }`.**
  Hook + dialog ReactNode. **Rejected:** the project's pattern
  files are all component-shaped; adding a hook-first compound
  is a small departure that obscures the dialog mount.

## Design

Canonical spec lives at
[`ui/patterns/import-dialog.md`](../ui/patterns/import-dialog.md).
Headlines:

### Component anatomy

```tsx
type ImportDialogProps<TPayload> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  format: `aventuras-${string}` // expected `format` field
  supportedMajor: number // compatibility
  payloadKey: string // envelope sub-key, e.g. 'calendar', 'story'
  schema: ZodSchema<TPayload> // validates the payload sub-object
  title: string // e.g. 'Import calendar', 'Import story'
  onValidated: (payload: TPayload) => void // fires on success; Dialog closes itself after
}
```

Lives at `components/compounds/import-dialog.tsx` per the
[directory layout rule](../ui/components.md#directory-layout)
(domain-agnostic, multi-domain).

### Dialog body — five states

```
idle           → two parallel input buttons, no error
reading        → spinner on active source, both buttons disabled
meta-error     → wrong-format / wrong-major banner, both buttons re-enabled below
payload-error  → "Invalid format — N issues. [Show details]" + collapsed field-list
(success)      → host's onValidated fires; Dialog closes immediately
```

Idle layout:

```
┌── Import calendar ─────────────────────────┐
│   [ 📁  Choose .avts file…              ]   │
│   [ 📋  Import from clipboard           ]   │
│                                             │
│   .avts and .json files supported.          │
│                                             │
│                              [ Cancel ]     │
└─────────────────────────────────────────────┘
```

Web file picker via a visually-hidden `<input type="file"
accept=".avts,.json">` clicked programmatically. Native via
`expo-document-picker.getDocumentAsync({ type: [
'application/json', 'application/octet-stream' ] })` plus
`expo-file-system.readAsStringAsync`. Clipboard via web's
`navigator.clipboard.readText()` or native's
`expo-clipboard.getStringAsync()`. Both action buttons are
feature-detected on mount; clipboard button disables with
`disabledReason="Clipboard access not available."` on web
environments lacking the API.

### Validation pipeline

Three stages:

1. **Read.** Async source → string. Failures here are transient
   meta-errors (`⚠ Could not read file.` / `⚠ Clipboard is
empty.` / `⚠ Clipboard access denied.`).
2. **Parse + meta-check.** `JSON.parse` + hand-rolled envelope
   inspection. Categorical meta-error variants:
   - Not JSON / not an object
   - `format` missing / not `aventuras-*` →
     `⚠ This isn’t an Aventuras file.`
   - `format` mismatch →
     `⚠ This is a different kind of Aventuras file
(got <X>, expected <Y>).`
   - `formatVersion` missing or shape-invalid (must match
     `/^(\d+)\.(\d+)$/`; `"1"`, `"1.0.0"`, `"v1.0"` all fail) →
     `⚠ This file is missing version information.`
   - `formatVersion.major < supportedMajor` → older
   - `formatVersion.major > supportedMajor` → newer
   - `parsed[payloadKey]` missing →
     `⚠ This file is missing its <payloadKey> data.`

   `format` field is **case-sensitive exact match.**

3. **Payload zod validate.** `schema.safeParse(parsed[payloadKey])`.
   Success → `onValidated(data)` + close. Failure → payload-error
   state, flattened issues `<path-joined> — <message>` (numeric
   indices wrapped in `[]`).

### Error UI behaviors

- Meta-error: banner + buttons re-enabled. No `[Show details]`.
- Payload-error collapsed: summary line + buttons re-enabled.
- Payload-error expanded:
  - **Desktop / tablet:** details list is `max-height: 200px`
    with internal scroll.
  - **Phone:** details list expands inline; whole Dialog body
    becomes scrollable (single scroll surface, no nested
    scroll).
- Path-truncation: paths > 40 chars middle-elided; messages > 80
  chars tail-elided.
- Pluralization: `1 issue.` / `N issues.`
- Retry: clicking either input button re-runs the full pipeline
  from Stage 1; prior error is replaced, not stacked.

### Per-host integration

- **World per-row.** `EntityListPane`'s kind-selector `[+]`
  action opens `ImporterMenu` (host-wired) with `Blank` / `From
JSON file…` (opens `ImportDialog` with `format='aventuras-entity'`
  - kind-narrowed schema) / `From Vault…` (disabled). Lore
    follows with `format='aventuras-lore'`.
- **Plot per-row.** Same shape per kind:
  `format='aventuras-thread'` and `format='aventuras-happening'`.
- **Vault calendars.** `+ Add calendar ▾ → From JSON file…`
  opens `ImportDialog` with `format='aventuras-calendar'`,
  `schema=CalendarSystemSchema`. Vault-side ID handling (fresh
  UUID per the existing spec) lives in the action layer.
- **Story-list.** Flat `[Import story…]` Button opens
  `ImportDialog` with `format='aventuras-story'`.

In every case, `onValidated` is the host's handoff to its action
layer.

### Storybook + accessibility

Story matrix (idle, reading, four meta-error variants, two
payload-error states, phone-tier idle). Forced-state for transient
states via an internal `useImportPipeline` hook with an
`_initialState` test seam (not exported). Accessibility:
`role="alert"` / `accessibilityLiveRegion="assertive"` on error
banners; `aria-busy` / `accessibilityState={{ busy: true }}` on
the active button during read; `aria-expanded` /
`accessibilityState={{ expanded }}` on the details toggle;
hidden file input is `aria-hidden`. Disabled state uses inline
`pointerEvents: 'none'` per the rn-primitives gating memory.

## Adversarial findings

Substantive findings worth folding into the canonical spec; each
listed with the resolution applied.

1. **Kind-narrowing contract for World/Plot per-row hosts.** With
   coarse `aventuras-entity` formats, a `kind: 'location'` JSON
   imported via the Characters kind-selector slot would validate
   clean under the base entity schema and emit a wrong-kind
   payload to the host. **Resolution:** the pattern doc requires
   hosts to pass a kind-narrowed schema per active kind
   (`CharacterImportSchema = EntityImportSchema.refine(e =>
e.kind === 'character', …)`). Mismatched-kind JSONs surface
   as payload-error (`kind — Expected a character.`), which is
   payload-error level rather than meta-error level — slightly
   less categorical than option (b) per-kind formats would give,
   but correct and explicit in the host contract.
2. **`patterns/README.md` index needs a row** for the new
   `import-dialog.md`. Folded into the integration plan.
3. **Native dep gap.** `expo-clipboard` ships with the project;
   `expo-document-picker` and `expo-file-system` do not. Expo
   modules with native code require a dev-client rebuild before
   runtime use — `pnpm add` alone is insufficient. The consuming
   slice (M4 first) needs the rebuild in its prep. Pattern doc
   carries an "Implementation prerequisites" note.
4. **Phone-tier scroll behavior for payload-error expanded.**
   Resolved above (details list expands inline; whole Dialog body
   scrolls).
5. **`formatVersion` parse rule.** Resolved above
   (`/^(\d+)\.(\d+)$/`, exact).
6. **`format` case-sensitivity.** Resolved above (exact match).
7. **Host gating during in-flight generation.** Per
   [`principles.md → Edit restrictions during in-flight
generation`](../ui/principles.md#edit-restrictions-during-in-flight-generation),
   edits to active-story content are gated during generation.
   Per-row imports into the active story should be gated by the
   host (host doesn't mount the trigger). Vault calendars and
   story-list story-import are unaffected (different stories /
   global). Pattern doc carries a per-host note.

Non-design findings (verified, no spec change):

- Inbound anchor refs to `patterns/data.md#import-counterparts*`
  and `world.md#per-row-import` all survive — headings keep their
  text. ✓
- `Dialog` primitive's phone-tier internal-scroll behavior is
  assumed serviceable; implementation-time verification at
  scaffolding. ✓
- Story-export asset-materialization is M9.4 action-layer work,
  not compound work. ✓
- iOS deferred per V1 targets; cross-platform set is web +
  Android + Electron. ✓

## Followups generated

**Resolved by this pass** (removed from
[`followups.md`](../followups.md)):

- `Importer compound — design pass`.

**Added to [`followups.md`](../followups.md)** (active, v1):

- `Native overlay impl vs JS-based overlay` — surfaced by Q4's
  Dialog-over-Sheet decision and the user's open
  `ui-native-modals.md`. Both `Sheet` and `Dialog` currently
  build on `@rn-primitives/dialog` (JS overlay via
  `react-native-screens` `FullWindowOverlay`); the React Native
  rule recommends native `<Modal presentationStyle="formSheet">`
  on native for built-in gestures, accessibility, and
  performance. Worth a focused review of the migration before v1
  ship.

  Originally drafted as a two-axis review that also covered
  Sheet-vs-Dialog/Modal consolidation as a general-use question;
  the consolidation axis was dropped on review — let real-app
  signal decide whether one primitive can retire. The native-vs-JS
  axis stands alone.

**Added to [`parked.md`](../parked.md)**:

- _Post-v1 confirmed → UX_:
  - **Forward-compat field-loss UX advisory** — when a `v1.1`
    file imports into a v1.0 app, zod's `.strip` default silently
    drops unknown fields. We may want a "this file has newer
    features that may not be preserved" advisory.
  - **Pre-import payload preview** — "About to import: Story
    'Foo' (15 entries, 3 branches, 8 entities)" screen before
    commit. Real value for large imports; not in v1.
- _Parked until signal → UX_:
  - **Drag-and-drop file import for `ImportDialog`** — common
    web UX; carve out from v1 unless real demand surfaces.

## Integration plan

Applied in a single focused commit:

- **New:** [`docs/ui/patterns/import-dialog.md`](../ui/patterns/import-dialog.md)
  — canonical spec, full TS contract, anatomy, state machine,
  validation pipeline, error UI, per-host integration, Storybook
  matrix, accessibility checklist, implementation prerequisites
  (native deps + dev-client rebuild note).
- **Edit:** [`docs/ui/patterns/README.md`](../ui/patterns/README.md)
  — add a row to the Files list for `import-dialog.md`.
- **Edit:** [`docs/ui/patterns/data.md`](../ui/patterns/data.md)
  — _Import counterparts_ section replaces the per-row sketch
  prose with a pointer to `import-dialog.md` for the flow; Used-by
  list keeps existing entries (no surface drops the JSON-viewer).
- **Edit:** [`docs/data-model.md`](../data-model.md)
  — _Aventuras file format → Kinds shipped in v1_ table grows
  from 2 rows to 6: adds `aventuras-entity` (with `kind`
  discriminator note), `aventuras-lore`, `aventuras-thread`,
  `aventuras-happening`.
- **Edit:** [`docs/ui/screens/vault/calendars/calendars.md`](../ui/screens/vault/calendars/calendars.md)
  — _From JSON file_ section drops the textarea-shaped modal
  sketch; points at `import-dialog.md`; keeps vault-specific
  bits (fresh-UUID, name-collisions allowed, success route to L2
  detail).
- **Edit:** [`docs/ui/screens/world/world.md`](../ui/screens/world/world.md)
  — _Per-row import_ section adds a brief reference to
  `import-dialog.md` and the kind-narrowed schema contract.
- **Edit:** [`docs/ui/screens/story-list/story-list.md`](../ui/screens/story-list/story-list.md)
  — _Story import_ section names `ImportDialog` as the underlying
  compound with a link to the pattern doc.
- **Edit:** [`docs/ui/component-inventory.md`](../ui/component-inventory.md)
  — drop `Importer` row from _Compounds — needs design_; add
  `ImportDialog` to _Compounds — build-ready_.
- **Edit:** [`docs/followups.md`](../followups.md)
  — remove _Importer compound — design pass_; add
  _Native overlay impl vs JS-based overlay_ under UX.
- **Edit:** [`docs/parked.md`](../parked.md)
  — add the three new parked entries above.

No wireframes change (Vault calendars' wireframe doesn't depict
the import modal; compound's sketches live ASCII-inline in the
pattern doc).
