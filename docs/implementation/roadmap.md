# Roadmap

Planned milestone arc for Aventuras v2 from Milestone 2 through the
v1 ship gate. **This is provisional.** Per
[`conventions.md → When milestones change`](./conventions.md#when-milestones-change),
the _goal_ of a milestone is stable once a `milestone.md` is
authored — but a roadmap entry is the **pre-author** state: each
entry is a working hypothesis about what that milestone will be,
not a commitment to its goal. Roadmap entries can be edited,
re-sequenced, split, or merged freely until they're promoted to a
defined `milestone.md`.

## How to read this doc

- **Defined milestones** with full `milestone.md` files live under
  [`milestones/`](./milestones/README.md). M1 (Spine) is the only
  defined milestone today.
- **Planned milestones** below are roadmap entries: a one-paragraph
  goal sketch, a likely slice list (titles only, no contracts), and
  notes on what gates the milestone and what's intentionally out of
  scope.
- When a milestone is ready to author, its roadmap entry is
  **promoted**: a `milestones/NN-name/milestone.md` is written, and
  the roadmap entry shrinks to a one-line pointer at the section
  header.

## Sequencing thesis

After M1 (Spine), the largest open question is **whether the base
systems (real-provider integration, memory pipeline, retrieval,
chapter-close, branches) work as their specs describe** when wired
against real story data. Validation, not tuning — prompt + ranker
tuning belongs in a polish era after every base system is online,
and the rich tuning surfaces (memory probe in particular) ship
alongside diagnostics in M7 rather than mid-build. The roadmap is
therefore ordered to build the smallest feasible end-to-end story
loop first (M2), then layer the memory pipeline against real story
data for correctness (M3–M5), then branches (M6), then
settings + diagnostics + onboarding + the rich memory-probe surface
(M7), then translation + vault parent shell (M8), then the ship
gate (M9).

Three consequences worth naming up front:

- **M2 ships a deliberately degraded experience.** No memory, no
  awareness graph, no chapter close — just "send recent entries as
  context." Stories made in M2 are short-and-incoherent by design.
  The point is to validate the loop, not the storytelling.
- **Large UI screens ship incrementally across milestones.** The
  wizard, reader-composer, world panel, plot panel, app settings,
  story settings, and memory probe each span 2–4 milestones rather
  than landing in one shot. See
  [Surfaces that ship incrementally](#surfaces-that-ship-incrementally)
  for the per-screen breakdown.
- **Each milestone applies the visual identity foundations to its
  own surfaces as it ships them** — no batched "VI audit" milestone
  at the end. Foundations are shipped (per
  [`ui/foundations/sessions.md`](../ui/foundations/sessions.md));
  the per-surface work is small enough to fit inside each
  milestone's UI slices.
- **Each milestone ships Storybook stories alongside the compounds
  it introduces.** Same convention as VI application — story
  authorship lives in the slice that adds the compound, not a
  batched end-of-v1 pass. M9.1 is a CI gate that catches gaps,
  not the place stories are written.

## Multi-contributor model

Roadmap assumes 2–3 contributors working on **one milestone at a
time** (per
[Project · Implementation vocabulary](./conventions.md#hierarchy)).
Cross-milestone parallelism is not used. Each milestone is sized to
have at least two parallel slice paths after an initial
gate-and-schema slice — same shape as M1.

---

## Planned milestones

### M2 — First user loop

**Goal.** Smallest end-to-end story loop with a real provider.
User completes the wizard's minimum-viable path, writes entries in
the reader, gets responses from a real LLM, saves the story, sees
it on the story list. No memory pipeline, no awareness, no
chapter management — each turn sends the last N entries verbatim
as context.

**Why now.** Validates the full request path (UI → action layer →
pipeline framework → real provider → entry write → diagnostics)
end-to-end with a human-perceptible outcome, replacing M1's
fault-injection stub. Produces the first real-story data the
memory pipeline (M3) needs to tune against.

**Likely slices.**

- M2.1 — Provider abstraction filled in; provider config types;
  **OAI-compat as the first provider** (most universal, covers
  the contributor test cases). Other providers add incrementally
  in M7 alongside the providers settings tab.
- M2.2 — Entry data layer: `story_entries` + the entry kinds the
  M2 loop exercises (`opening`, `user_action`, `ai_reply`); `system`
  stub. CRUD actions through the action layer. Full enum per
  [`data-model.md`](../data-model.md).
- M2.3 — Story creation, minimum-viable wizard: step 1
  (definition + model + pack picks), step 2 (calendar — bundled
  calendars only), step 5 (opening generation via real provider),
  wizard auto-save + draft persistence. Steps 3 (lore) and 4
  (cast) deferred to M3 alongside the data layers they manipulate;
  refine / regenerate on opening deferred to M3.
- M2.4 — Story list as a real surface: list real stories, navigate
  to reader, basic store.
- M2.5 — Reader-composer minimum: entry list rendering, composer
  below, trigger generation, basic edit / delete entry actions.
  Calendar renderer for in-world time chrome lands here (see
  [Subsystems → Calendar](#subsystems-that-ship-incrementally)).
  Deferred to later milestones: refine / regenerate (M3), peek
  drawer + awareness chips (M4), chapter management (M5), branch
  picker (M6).
- M2.6 — End-to-end wiring: user action → translation
  short-circuit → pipeline → provider → entry write → UI refresh.
  Pack-template / Liquid engine lands here (minimal runtime +
  macro resolver + variable binding) since the pipeline call
  needs a rendered prompt.

**Parallel paths after M2.1 + M2.2.** {M2.3, M2.4} || {M2.5}, then
M2.6 wires.

**Gates.** Nothing; M1 spine is the only prereq.

**Scope: out.** Memory pipeline, entity tracking, branches,
chapters, translation, story settings depth, app settings depth,
multiple providers, vault.

---

### M3 — Memory floor

**Goal.** The memory pipeline is online: piggyback writes scene
metadata + structured tool calls during main generation; periodic
classifier reconciles entities + lore + happenings + awareness in
the background; retrieval surfaces relevant context into each
turn's prompt. Stories made in M3 are coherent across a session.

**Why now.** Real story data exists from M2; this milestone is
where classifier prompt engineering and retrieval ranking get
their first contact with real inputs. Lands before the rich UX
because UX needs the data layer (entities, awareness, happenings)
to render against.

**Likely slices.**

- M3.1 — Embedder integration + the hard onboarding gate (story
  creation requires embedder per
  [`memory/model-management.md`](../memory/model-management.md));
  embedder configuration in app settings.
- M3.2 — Piggyback layer: inline structured tool calls during
  main generation; scene metadata writes;
  entities + lore + happenings stub creation.
- M3.3 — Periodic classifier: background pipeline; entity
  reconciliation; awareness graph; happenings extraction.
  Classifier writes `metadata.worldTime` to each new entry —
  first non-zero values flow through the calendar renderer
  shipped in M2.5.
- M3.4 — Retrieval: embedding queries; ranker; budgets;
  context-bundle assembly into the per-turn prompt. Memory pack
  templates extend the Liquid engine to inject retrieved bundles.
- M3.5 — Minimal developer-only retrieval probe: log / inspect
  retrieval scores during impl. User-facing probe surface
  deferred to M7.
- M3.6 — Wizard step 3 (lore editor) + step 4 (full bespoke cast
  editor — all 4 per-kind editors with `▼ Visual` / `▼ More
options` disclosures, status / lead / staged logic,
  pick-from-cast pickers): pre-author opening's lore + entities
  at story creation; opening generation consumes seeded context.
  Refine / regenerate affordances on opening land here. The
  wizard editor is bespoke (its own tier shape, excludes
  classifier-managed fields per the authorship contract); not a
  precursor to the world panel.
- M3.7 — Next-turn suggestions: pipeline emission (sibling
  `<suggestions>` block alongside narrative in piggyback mode
  and/or alongside `<state>` in classifier mode per
  [`reader-composer.md → Next-turn suggestions`](../ui/screens/reader-composer/reader-composer.md#next-turn-suggestions)),
  reader-composer suggestions panel between AI replies and the
  next composer input, `suggestionsEnabled` story setting toggle.
  Suggestion agent profile slot in app-settings extends M7.1.

**Parallel paths.** {M3.1, M3.2} are sequential against entry
schema; M3.3 runs in parallel with M3.4 once classifier writes
populate retrievable rows; M3.6 runs in parallel with M3.3 / M3.4
after M3.2 lands the lore + entity stub writes; M3.7 gates on
M3.2 + M3.3 (its emission rides one or both modes).

**Gates.** M2 (entries + real provider needed before classifier
has anything to classify).

**Scope: out.** Chapter-close, rich world panel, rich plot panel,
multi-axis salience, pinning policy refinements, rich
user-facing memory probe (M7).

---

### M4 — World + Plot read surfaces

**Goal.** Users can browse and edit the entity graph the memory
pipeline produces. World panel renders entities by kind with
overview + state tabs; Plot panel renders happenings with
awareness; story settings exposes the controls users need now
that real data exists (model overrides, basic per-story config).

**Why now.** M3 produces entity / lore / happening / awareness
rows; without surfaces to browse + edit them, the memory pipeline
is invisible. This milestone is read-heavy with light edit; full
chapter-management is M5.

**Likely slices.**

- M4.1 — World panel shell + per-kind tabs (characters /
  locations / items / factions / etc.) + entity list rows.
- M4.2 — Entity detail surface: overview tab, state tab, per-kind
  fields per
  [`docs/ui/screens/world/world.md`](../ui/screens/world/world.md).
- M4.3 — Plot panel shell + threads tab + happenings tab; happenings
  list with awareness tab on detail per
  [`docs/ui/screens/plot/plot.md`](../ui/screens/plot/plot.md).
  Threads data may be sparse until M5's chapter-close populates it
  reliably; the surface ships in M4.
- M4.4 — Story settings real (basic): model overrides + basic
  per-story config — the settings depth users need with real data
  flowing. Deep settings tabs land in M7.

**Parallel paths.** {M4.1, M4.2} || {M4.3} || {M4.4}.

**Gates.** M3 (no entities without classifier; no awareness
without classifier; no retrieval scores without retrieval).

**Scope: out.** Bulk operations (parked); character-side awareness
tab (parked); image generation; chapter-close UX (M5).

**Note.** Entity / happening / thread history tabs render against
raw delta-log queries in M4 — functional but uncached. Diff-cache
acceleration lands in [M6.4](#m6--branches--diff-cache).

---

### M5 — Chapters + chapter-close

**Goal.** Chapter timeline ships as a real surface; chapter-close
pipeline runs at chapter boundaries doing the
[`memory/chapter-close.md`](../memory/chapter-close.md) phase
sequence (3a–3e). Threads management lands. Reader gains chapter
management affordances (insert break, view chapter context, etc.).

**Why now.** Chapter-close is the second-largest piece of memory-
pipeline complexity after the per-turn classifier. It's a boundary
event, so it can be developed and tested independently of per-turn
flow. The threads model and chapter-timeline UI are natural
companions.

**Likely slices.**

- M5.1 — Chapter data layer: chapter rows, chapter-membership on
  entries, chapter boundaries.
- M5.2 — Chapter-close pipeline: phases 3a–3e, agent invocations,
  delta writes. Chapter-close consolidates `threads` rows that
  M3's classifier wrote sparsely; surface (plot panel threads
  tab) already exists from M4.3.
- M5.3 — Chapter timeline screen per
  [`docs/ui/screens/chapter-timeline/chapter-timeline.md`](../ui/screens/chapter-timeline/chapter-timeline.md).
- M5.4 — Reader chapter affordances: insert break, navigate by
  chapter, chapter context badge.

**Parallel paths.** {M5.1, M5.2} are sequential against schema;
{M5.3} || {M5.4} once data layer exists.

**Gates.** M4 (chapter-close compacts entities + lore the world
panel renders; surfaces would be invisible without M4).

**Scope: out.** Cross-chapter semantic dedup (parked); lore-mgmt
cross-arc callback detection (parked).

---

### M6 — Branches + diff cache

**Goal.** Branches work: fork creates a new branch with a
branch-copy of the relevant data per the
[branch-copy manifest](../data-model.md#branch-model). Reader has
a branch picker. The diff cache (Zustand + React Query off-label
per
[Project · State placement](./conventions.md))
populates so branch comparisons are fast.

**Why now.** Branches touch every domain table (delta-log
filtering, branch-copy semantics, FK rewriting) so they need the
data layer mostly built. Diff cache is bespoke compute caching;
building it after the rest of the substrate stabilizes avoids
churn.

**Likely slices.**

- M6.1 — Branch schema + branch-copy at fork time + FK rewriting.
- M6.2 — Delta-log branch filtering (reads scope to current
  branch's lineage).
- M6.3 — Reader branch picker + branch creation flow.
- M6.4 — Diff cache: query layer, eviction, deps on branch +
  entry events.
- M6.5 — Multi-story branching: story list shows branch count,
  navigation handles the branch-aware URL shape.

**Parallel paths.** {M6.1, M6.2} sequential; {M6.3, M6.4, M6.5}
parallel once branch reads work.

**Gates.** M5 (chapter-close writes that branches must respect
need to exist first).

**Scope: out.** Per-branch definition override (parked);
sophisticated merge / cherry-pick (out of v1).

---

### M7 — App settings + diagnostics + onboarding

**Goal.** The app's chrome is complete. App settings exposes
provider management, embedder management, theme picker, density
toggle, data tab (backup / export / restore). Diagnostics screen
ships. Onboarding flow runs on first launch and walks the user
through provider + embedder configuration.

**Why now.** Settings depth is most useful once features are
built (settings without features to configure are noise);
diagnostics is most useful once there's real generation traffic
to inspect; onboarding gates first-launch so it has to ship before
v1 — but it can ship near the end because it's a thin facade over
the underlying configuration surfaces.

**Likely slices.**

- M7.1 — App settings deep: providers tab (extends M2.1's
  OAI-compat-only with multi-provider config), embedder tab,
  models tab, appearance tab, data tab.
- M7.2 — Story settings deep: pack tab, definition tab, models
  tab, awareness tab, calendar tab.
- M7.3 — Diagnostics screen per
  [`docs/ui/screens/diagnostics/diagnostics.md`](../ui/screens/diagnostics/diagnostics.md).
- M7.4 — Onboarding flow per
  [`docs/ui/screens/onboarding/onboarding.md`](../ui/screens/onboarding/onboarding.md).
- M7.5 — Memory probe (rich, user-facing) per
  [`docs/ui/screens/memory-probe/memory-probe.md`](../ui/screens/memory-probe/memory-probe.md).
  Pairs with diagnostics as the transparency / tuning surface
  group.
- M7.6 — App-settings auxiliary surfaces (provider-detection
  override UX, full-backup AlertDialog with key-leak
  acknowledgment).

**Parallel paths.** Internal ordering + parallelism handled at
milestone-authoring time. Sketch: {M7.1, M7.2, M7.3, M7.4, M7.5}
nearly independent; M7.6 finishes once M7.1 is in.

**Gates.** M6 (settings should reflect real branching + multi-
story behavior; diagnostics should inspect real branch-aware
flows).

**Scope: out.** Prompt-pack editor (parked post-v1);
user-authored themes (parked-until-signal); OS dark/light follow
(parked-until-signal).

---

### M8 — Translation + vault parent shell

**Goal.** Translation pipeline runs (per-turn
user-action-translation and display-translation per
[`architecture.md → Translation`](../architecture.md#user-action-translation-pre-narrative)).
Story settings exposes the translation controls. Vault parent
shell ships (calendars already shipped per
[`docs/ui/screens/vault/calendars/calendars.md`](../ui/screens/vault/calendars/calendars.md));
vault navigation surfaces from the story list.

**Why now.** Translation is critical-path for multilingual users
but additive for English-only users — fits well as a late v1
milestone. Vault parent shell is a small wrapping job around the
already-shipped calendar editor.

**Likely slices.**

- M8.1 — Translation pipeline: user-action-translation phase,
  display-translation lookup, `translations` table.
- M8.2 — Translation UI: language picker in story settings,
  graceful degradation contract per
  [`architecture.md`](../architecture.md).
- M8.3 — Vault parent shell: vault home navigation, vault entry
  point from story list, vault chrome.
- M8.4 — Translation-aware retrieval / classifier-on-translation
  edge cases per
  [`memory/edge-cases.md`](../memory/edge-cases.md).

**Parallel paths.** {M8.1, M8.2} sequential; {M8.3} || {M8.4}.

**Gates.** M7 (settings surfaces translation toggles).

**Scope: out.** Outage-mode fallback (parked); translation-miss
persistence table (parked); user-controllable narrative language
(parked); translation wizard (parked); vault import/export at
vault level (parked).

---

### M9 — Storybook + per-surface visual polish + ship gate

**Goal.** Every shipped UI compound has a Storybook story; every
shipped screen has had its per-surface visual identity audit
(replace remaining "deferred to visual identity" notes with final
glyphs / spacing / accents). Full backup + export round-trips
work. v1 ships.

**Why now.** Storybook feature components were gated on visual
identity foundations landing; that gate is met as of 2026-05-01
per
[`ui/foundations/sessions.md`](../ui/foundations/sessions.md).
The per-surface VI audit can only happen once the surface exists.
Backup + export round-trip is the highest-value ship-blocker that
isn't a per-feature concern.

**Likely slices.**

- M9.1 — Storybook story-coverage CI gate (asserts every
  compound has a story). Stories themselves ship per-compound
  inside the milestone that introduces each compound; this slice
  catches gaps + lands the gate.
- M9.2 — Per-surface visual identity audit: each screen reviewed
  against shipped foundations (`ui/foundations/`); final glyph
  picks, spacing finalization, accent application, monochrome
  wireframe holes filled.
- M9.3 — Backup pipeline: `VACUUM INTO` snapshot + failsafe JSON
  dump; restore.
- M9.4 — Export: per-story `.avts` envelope; import; cross-version
  resilience.
- M9.5 — Cross-platform parity smoke (Linux desktop + Android),
  performance budget audit, accessibility audit
  ([`accessibility skill`](./conventions.md) checks).
- M9.6 — v1 ship: changelog, release notes, distribution
  packaging.

**Parallel paths.** {M9.1, M9.2} || {M9.3, M9.4} || {M9.5}; M9.6
gates on all.

**Gates.** M8 (every user-facing surface must exist before the
visual audit, and translation must round-trip cleanly through
backup / export).

**Scope: out.** Image generation, prompt-pack editor, FTS5
upgrade, asset gallery, all post-v1 confirmed work — those are
explicit post-v1 milestones not in this roadmap.

---

## Cross-milestone notes

### Surfaces that ship incrementally

Large UI screens land across multiple milestones rather than
shipping all at once. Each milestone implements only the slice of
the screen its goal requires; later milestones extend.

- **Wizard** ([wizard.md](../ui/screens/wizard/wizard.md)).
  - **M2.3** — Step 1 (definition + model + pack picks); step 2
    (calendar picker against bundled-only registry); step 5
    (opening generation); auto-save + draft persistence.
  - **M3.6** — Step 3 (lore editor) + step 4 (full bespoke cast
    editor — all 4 per-kind editors with disclosures, status /
    lead / staged logic, pick-from-cast pickers); refine /
    regenerate on opening.
  - **M7.1 / M7.2** — Pack selection across multi-provider config;
    provider-plurality in model picker; full settings reflection.
  - **M8.3** — Step 2 picker gains vault-imported calendars once
    the registry merges `vault_calendars` rows. Picker code
    unchanged; this is a registry-side extension, not a wizard
    slice.
- **Reader-composer**
  ([reader-composer.md](../ui/screens/reader-composer/reader-composer.md)).
  - **M2.5** — Entry list, composer, trigger generation, basic
    edit / delete entry actions.
  - **M3** — Refine / regenerate affordances on entries (consume
    memory context); next-turn suggestions panel between AI
    replies and the composer (per M3.7).
  - **M4** — Peek drawer + awareness chips on entries.
  - **M5** — Chapter management affordances (insert break,
    navigate by chapter, chapter context badge).
  - **M6** — Branch picker + branch creation flow.
- **World panel** ([world.md](../ui/screens/world/world.md)).
  - **M4.1 / M4.2** — Full v1 scope (shell, per-kind tabs, entity
    detail overview + state tabs).
- **Plot panel** ([plot.md](../ui/screens/plot/plot.md)).
  - **M4.3** — Plot panel shell + threads tab + happenings tab +
    happening awareness tab. Threads data sparse until M5.2
    chapter-close populates it reliably.
- **App settings**
  ([app-settings.md](../ui/screens/app-settings/app-settings.md)).
  - **M7.1 / M7.6** — Full v1 scope. (M2.1 ships OAI-compat-only
    config as part of provider abstraction, no dedicated settings
    surface yet.)
- **Story settings**
  ([story-settings.md](../ui/screens/story-settings/story-settings.md)).
  - **M4.4** — Basic surface (model overrides, basic per-story
    config).
  - **M7.2** — Deep tabs (pack, definition, models, awareness,
    calendar, translation).
- **Memory probe**
  ([memory-probe.md](../ui/screens/memory-probe/memory-probe.md)).
  - **M3.5** — Minimal developer-only inspector (logs / impl
    debug).
  - **M7.5** — Rich user-facing probe surface.

When a milestone is promoted to a full `milestone.md`, that doc
owns the precise slice-of-screen contract; this table is
indicative only.

### Subsystems that ship incrementally

Some subsystems thread through multiple milestones — partial
runtimes land early to support the first consumer, then extend as
later consumers arrive. Tracking them here keeps slice
descriptions scannable while making the cross-cutting wiring
explicit.

- **Calendar system**
  ([`calendar-systems/spec.md`](../calendar-systems/spec.md),
  [`patterns/calendar-picker.md`](../ui/patterns/calendar-picker.md)).
  - **M2.3** — Calendar registry (built-ins from code only;
    no `vault_calendars` merging yet); calendar-picker primitive;
    bundled calendar definitions in code.
  - **M2.5** — Renderer (`worldTime + worldTimeOrigin → tier-tuple
→ Liquid render`) for reader chrome. Exercised meaningfully
    only after M3.3 begins writing non-zero `worldTime` values.
  - **M3.3** — Classifier writes `metadata.worldTime` on each new
    entry; first non-zero worldTime values flow through the
    renderer.
  - **M3.6** — Wizard's calendar-summary preview samples the
    renderer to show how dates will format.
  - **M5.3** — Chapter timeline time column consumes the renderer.
  - **M7.1** — App settings calendar tab (`default_calendar_id`
    picker into the registry).
  - **M7.2** — Story settings calendar tab deep: picker + summary
    - era-flips list + swap-warning UX; `branch_era_flips` table
      lands here.
  - **M8.3** — `vault_calendars` schema + CRUD + vault calendar
    editor; registry init extends to merge bundled +
    `vault_calendars` rows.
- **Pack-template / Liquid engine**
  ([`architecture.md → Prompt templates`](../architecture.md#prompt-templates-and-authoring)).
  - **M2.6** — First pipeline call renders a pack template
    (bundled pack only) into the provider call; minimal Liquid
    runtime + macro resolver + variable binding.
  - **M3.4** — Memory templates extend the engine to inject
    retrieved bundles (entities / lore / happenings) into
    rendered context.
  - **M5.2** — Chapter-close templates render against
    chapter-scoped context.
  - **M7.2** — Pack tab in story settings edits live packs
    (runtime validation surface partial — full pack-format editor
    parked post-v1 per
    [`parked.md`](../parked.md#prompt-pack-editor-desktop-spec--mobile-retrofit)).
- **Observability sinks beyond the logger**
  ([`observability.md`](../observability.md)).
  - **M1.3 / M1.5** — `logger`, `httpCallSink`, `turnCaptureSink`
    land as scaffolds and accept their first emissions during the
    stub-LLM smoke.
  - **M2.6** — Real provider HTTP traffic flows through
    `httpCallSink`; real per-turn captures populate via
    `turnCaptureSink`.
  - **M3 / M5** — Per-pipeline-kind turn-capture shape extends
    for memory + chapter-close pipelines (classifier / retrieval
    / chapter-close phases each contribute capture content).
  - **M7.3** — Diagnostics screen consumes `logEntries`,
    `httpCallSink` history, run timeline.
  - **M7.5** — Memory probe consumes `turnCaptureSink`
    retrieval-score content for per-turn inspection.

When a milestone is promoted to a full `milestone.md`, that doc
owns the precise per-slice extension; this table is indicative
only.

### Milestones that may merge or split

- **M3 + M4 might merge** if memory-pipeline implementation reveals
  that the world / plot surfaces are needed mid-correctness-check
  (e.g., human inspection of classifier output is faster than log
  reads). Defer the decision until M3 is authored.
- **M9 might split** if Storybook + per-surface audit + backup +
  ship gate are too much for one milestone. Natural split: M9a
  (Storybook + VI audit) → M9b (backup + ship).

### What this roadmap does not commit to

- Specific slice contracts (interfaces, types, behavioral
  boundaries) — those land in each milestone's authored
  `milestone.md`.
- Slice ordering inside a milestone beyond the gate-then-parallel
  shape sketched here.
- Definition-of-done specifics per milestone — those are also
  milestone-level decisions.
- Calendar / timeline commitments — sequencing only.

### What's intentionally out of v1

Everything in
[`parked.md → Post-v1 confirmed`](../parked.md#post-v1-confirmed)
and
[`parked.md → Parked until signal`](../parked.md#parked-until-signal)
is out of v1 by default. If a roadmap milestone needs an item
currently parked, that item moves to
[`followups.md`](../followups.md) and the milestone's authored
`milestone.md` reflects the inclusion.
