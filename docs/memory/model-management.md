# Embedding model management

Curated catalog, onboarding, on-disk layout, download flow, license
attestation, removal, init-failure handling, and staleness UI for
the embedding model the retrieval pipeline depends on. Companion to
[`retrieval.md`](./retrieval.md), which covers what retrieval does
with the model once it's installed.

---

## What this doc owns

- The model-side contract — catalog shape, file bundle, on-disk
  layout, where embedder config lives in Settings.
- The user-facing lifecycle — first-launch, swap, removal, license
  attestation, error states.

What it explicitly does not own:

- The retrieval algorithm or per-query KNN flow — see
  [`retrieval.md`](./retrieval.md).
- Wire-level wireframes for the App Settings and Story Settings
  Memory tabs — those land at the per-screen design pass; this doc
  defines the contract those screens have to satisfy.
- Cluster 2 (execution-provider selection per device, provider-mode
  fallback semantics) — that lands as a separate design pass; see
  [`followups.md → v1-blocking`](./followups.md#v1-blocking).

---

## Curated catalog

A bundled JSON file, shipped with each app release, lists the
embedding models we've vetted for inclusion in the picker. v1 ships
with several entries spanning the size / performance trade-offs;
the user picks one (or imports a custom file, or skips and uses a
provider's embedder). The catalog is metadata only — no model files
are bundled with the app.

Per-entry shape:

```json
{
  "version": "2026-05-08",
  "models": [
    {
      "id": "Xenova/all-MiniLM-L6-v2-q8",
      "displayName": "MiniLM-L6 (lightweight)",
      "shortDescription": "Small, fast, English-focused. Default for mobile.",
      "size_bytes": 25000000,
      "dim": 384,
      "huggingfaceRevision": "<pinned commit hash>",
      "expectedSha256": {
        "model.onnx": "...",
        "tokenizer.json": "...",
        "tokenizer_config.json": "..."
      },
      "tags": ["mobile", "lightweight", "english", "default"]
    }
  ]
}
```

- **`id`** — canonical HuggingFace id; doubles as the storage folder
  name (sanitized) and the row's `model_id` value in vec0.
- **`huggingfaceRevision`** — a pinned commit hash. The model card
  and files are fetched at this revision. Defends against post-
  curation edits to the model card or weights.
- **`expectedSha256`** — known hashes for the three required files.
  Verified after download completion.
- **`tags`** — UI filtering hints (mobile, desktop, lightweight,
  heavy, multilingual, etc.). One entry may carry the `default` tag
  for the recommended pick.

Catalog updates ship in app releases. Remote-fetch with bundled-
fallback is a possible later extension; v1 keeps it bundled-only.

---

## Onboarding

A new screen joins the first-launch flow after provider
configuration. Hard-gated: story creation is blocked until the user
either configures an embedder (curated download, custom import, or
provider embedder) or explicitly skips into Settings. There is no
silent retrieval fallback in v1.

Layout sketch:

```
┌─────────────────────────────────────────────┐
│ Memory                                      │
│                                             │
│ Aventuras uses an embedding model to find   │
│ relevant memories during retrieval. Pick    │
│ one to download now, or configure later in  │
│ Settings.                                   │
│                                             │
│ ┌─ Curated models ──────────────────────┐   │
│ │ ○ MiniLM-L6 (lightweight)   25 MB     │   │
│ │ ○ BGE-base-en (mid)        120 MB     │   │
│ │ ○ ...                                 │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Advanced setup → Settings · Memory          │
│ (use a provider's embedder or import a      │
│ custom model file)                          │
│                                             │
│ [ Skip ]                          [ Next ]  │
└─────────────────────────────────────────────┘
```

Actions:

- **Pick a curated model + Next** — proceeds to the
  [Download flow](#download-flow) (license dialog, download,
  verification, attestation).
- **Advanced setup** — routes to Settings · Memory, where the user
  can pick a provider embedder or run a
  [custom file import](#custom-file-import). Returns to onboarding
  on completion.
- **Skip** — onboarding completes with the embedder unconfigured.
  Story creation is blocked until the user returns to Settings.
  This isn't a "fallback mode," just a deferred decision.

Onboarding shape mirrors the existing provider-configuration step
(see
[`onboarding.md → What gets seeded silently`](../ui/screens/onboarding/onboarding.md#what-gets-seeded-silently)
for the parallel pattern). Provider config and embedder config are
the two configuration gates v1 imposes on first-launch.

---

## Storage layout

Each installed model lives in a self-contained folder inside an
app-private embedders directory. Folder name is the model's
canonical `id` with `/` replaced by `--` to be filesystem-safe.

```
<embedders-root>/
  xenova--all-minilm-l6-v2-q8/
    model.onnx
    tokenizer.json
    tokenizer_config.json
    meta.json
    LICENSE.txt          # frozen at agreement time (curated path only)
    .attestation         # acceptance timestamp + license SHA256 + source URL + revision
  baai--bge-base-en-v1.5/
    ...
```

Per-platform `<embedders-root>`:

| Platform | Path                                                 |
| -------- | ---------------------------------------------------- |
| Android  | `<internal>/files/embedders/`                        |
| iOS      | `<documents>/embedders/`                             |
| Linux    | `~/.local/share/Aventuras/embedders/`                |
| macOS    | `~/Library/Application Support/Aventuras/embedders/` |
| Windows  | `%APPDATA%\Aventuras\embedders\`                     |

The folder is self-contained — removal is a recursive delete, and
copying a folder to a new device transports the agreed-to license
along with the model. Custom imports follow the same shape (without
a `LICENSE.txt`).

---

## Download flow

For curated catalog entries:

1. User picks a model in onboarding or in Settings · Memory.
2. App fetches the model card from HuggingFace at the catalog
   entry's pinned `huggingfaceRevision`. If the fetch fails
   (network, HF unreachable), block with `Couldn't reach the model
source. Check your connection and try again.` No cached-license
   substitution — we explicitly want the live one at this revision.
3. **License dialog** renders: model name, total size, license
   title, scrollable license text, source URL, revision hash.
4. **Decline** — no download, no state change. User stays on the
   previous selection. Pre-download state.
5. **Accept** — download begins with progress bar, resumable on
   network blip. Each of the three required files is fetched and
   SHA256-verified against the catalog entry's expected hashes.
6. **Cancel mid-download** — distinct from Decline. The download
   stops, partial files are deleted, and no license-acceptance is
   recorded. License acceptance is contingent on completion (see
   [License attestation](#license-attestation)).
7. **All three files verified** — `LICENSE.txt` is written from the
   dialog text, `.attestation` is written with timestamp + license
   SHA256 + source URL + revision. The model is now usable.

Failure modes during the run:

- **SHA256 mismatch** on any file — abort the download, delete
  partial files, surface `Verification failed. The downloaded file
doesn't match the expected hash. Try again later.` Don't
  auto-retry; the mismatch may indicate corruption or a rotated
  upstream that the catalog hasn't caught up to.
- **Network drop** — pause the download with a Resume affordance.
  Standard download UX.
- **Disk-full** mid-download — abort and surface a clear error;
  delete partials.

### Custom file import

Settings · Memory exposes "Import custom model" for users with a
local model file outside the curated catalog. The user provides
three files from the filesystem (`model.onnx`, `tokenizer.json`,
`tokenizer_config.json`). Flow:

1. App validates the bundle: all three files parse, a smoke-test
   embed runs and returns a vector of the expected dimensionality.
2. Confirmation dialog: `By using this model, you assert that you
have a license to do so. The file SHA256 hashes are recorded for
your reference. [Cancel / Import]`.
3. On Import: files copied into
   `<embedders-root>/<sanitized-id>/`, `.attestation` records
   user-attested license + import timestamp + computed SHA256s. No
   `LICENSE.txt` is written (none was fetched).

User-supplied id format follows the HF convention
(`<namespace>/<model>`); the app rejects ids that would collide
with an existing folder name.

---

## License attestation

Two paths produce different attestation records:

| Path             | License source                     | Attestation contents                                                                |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| Curated download | Live HuggingFace fetch at revision | timestamp, license SHA256, source URL, revision hash, license text in `LICENSE.txt` |
| Custom import    | User's assertion                   | timestamp, file SHA256s, no license text                                            |

Acceptance is **per model file**, not per-app-version or per-story.
Removing and re-downloading a model triggers fresh license fetch
and re-acceptance — every download is its own agreement. This is
the rationale behind preferring live model-card fetch: it defends
against authors editing model cards post-curation.

If a future app release pins a newer `huggingfaceRevision` for an
existing catalog entry, the user's installed model still works —
its `.attestation` records the older revision. Users who pick that
catalog entry afresh download under the new revision and agree to
its license.

Acceptance is contingent on download completion. Cancelling mid-
download discards the not-yet-finalized acceptance — partial
installs don't count as agreement.

---

## Removal

Settings · Memory · Models list shows installed models. A per-model
overflow menu offers `Remove`. The dialog branches on whether any
story currently has the model selected:

- **Not selected by any story** — confirmation only. `Remove
[model]? This deletes the model file. [Cancel / Remove]`.
- **Selected by N stories** — warn-and-confirm, listing affected
  stories:

  > Stories _Title A_, _Title B_, _Title C_ use this embedding
  > model. After removal, those stories will be unable to generate
  > new embeddings until you swap them to a different embedder.
  > Existing retrieval still works for already-embedded rows.
  >
  > `[ Cancel ]` `[ Remove ]`

The removal dialog deliberately does **not** offer an inline
re-index. Re-indexing requires picking a replacement embedder
first, which is a per-story decision living in Story Settings ·
Memory — not the global model list. After Remove, affected stories
start producing `embedding_stale = 1` rows on subsequent embedded-
field writes, and the recovery path runs through:

1. User opens an affected story; the
   [top-bar status pill](#top-bar-status-pill--discovery-surface-in-the-affected-story)
   surfaces the staleness.
2. Tap routes to Story Settings · Memory, where the
   [resolution panel](#settings--memory-tab--resolution-surface)
   names the missing model and offers `Switch embedder`.
3. Picking a new embedder fires the
   [`Model swap UX`](./retrieval.md#model-swap-ux) dialog, where
   `Re-index this story` does the actual rebuild.

Removal is a recursive delete of the model's folder (including
`LICENSE.txt` and `.attestation`). The user has to drive recovery
explicitly per story; we don't auto-migrate or auto-reassign.

---

## Init-failure handling

The local embedder may fail to initialize for reasons beyond
removal: a corrupt model file, a missing native library, an
op-coverage gap on the chosen execution provider (the PoC found
`xnnpack` crashes on embed under our model), incompatible quant.
Init-failure surfaces as:

- **Error toast** at app launch (or on the first attempted use).
- **Persistent banner in Settings · Memory** describing the failure
  mode and offering retry / switch model / switch backend
  affordances.
- **Story creation in local mode is blocked** while the embedder is
  in the failed state. Stories created prior to the failure
  continue to read from vec0 for already-embedded rows; new writes
  produce `embedding_stale = 1` per the lifecycle contract in
  [`retrieval.md → Compute lifecycle`](./retrieval.md#compute-lifecycle).

EP selection per device (CPU, NNAPI, fallback orderings) and
provider-mode fallback semantics on init failure are owned by the
cluster 2 design pass; see
[`followups.md → v1-blocking`](./followups.md#v1-blocking).

---

## Staleness UI

The `embedding_stale` flag (per
[`retrieval.md → Compute lifecycle`](./retrieval.md#compute-lifecycle))
is surfaced in two places, layered for discovery and resolution:

### Settings · Memory tab — resolution surface

A panel per affected story:

> **Story name**
> 12 rows pending re-embed under MiniLM-L6.
> Reason: model removed / embedder offline / init failure / etc.
> `[ Switch embedder ]`

Lists every story with a non-zero stale-row count alongside the
blocking reason. The action is `Switch embedder`, which routes to
the embedder picker for that story; picking a different model
triggers the
[Model swap UX](./retrieval.md#model-swap-ux) dialog where
`Re-index this story` runs the rebuild.

If the blocking reason is recoverable on its own (provider network
blip, embedder mid-init), the user may not need to take action —
the worker drains pending rows automatically once the embedder
becomes available again. The panel still shows the state so the
user knows why retrieval is degraded; the action is offered for
the cases where the user wants to actively switch rather than wait.

### Top-bar status pill — discovery surface in the affected story

When the user is reading a story whose `embedding_stale` row count
is non-zero, an error-state pill appears in the top bar (same
visual language as other error pills — not a new vocabulary).
Tapping routes to the Memory settings panel for that story.

Two surfaces total: **where you fix it** (Settings panel) and
**where you discover it** (top-bar pill in the affected story).
Story list deliberately does not carry a per-row badge — too much
clutter for an indicator that's only relevant when the user is
actively in that story.

---

## Embedder config — where it lives in Settings

Embedder configuration is **not** routed through the Profiles tab.
Profiles are LLM-agent-shaped (temperature, max output, thinking
slider, structured output) — embedders share none of those
parameters. Forcing them into the profile shape would create UI
noise and a misleading conceptual link between two unrelated
concerns.

Two surfaces:

**App Settings · Memory tab** — app-level defaults that seed new
stories' settings:

- Embedder backend default (`local | provider`).
- Local model picker (catalog list + Import custom + Remove).
- Provider embedder picker (provider dropdown grouped by configured
  providers; model dropdown filtered to embedding-capable models on
  the chosen provider). Required when backend is `provider`.
- Per-type retrieval budgets (see
  [`retrieval.md → Per-type retrieval budgets`](./retrieval.md#per-type-retrieval-budgets)
  — already in scope).
- "Re-index this story now" affordances surface here too when a
  story has staleness or a model-swap pending.

**Story Settings · Memory tab** — per-story override of the
app-level defaults. Same fields, locked once the story has any
embedded content (i.e. once any vec0 rows exist for that story's
branches), unless the user explicitly triggers the model-swap
re-index path.

---

## Open items

- **Per-story embedding provider id.** The current schema has
  `stories.settings.embedding_model_id` and `embeddingBackend` but
  no `embedding_provider_id`. When `embeddingBackend = 'provider'`
  the system needs to resolve which provider's embedding endpoint
  to call — the user may run a different provider for embeddings
  than for narrative. Tracked in
  [`followups.md → v1-blocking`](./followups.md#v1-blocking).
- **Cluster 2 design pass.** Execution-provider selection per
  device (CPU, NNAPI, fallback orderings on init failure) and
  provider-mode fallback semantics. Lands as additions to this doc
  once the design pass concludes.
- **Catalog remote update path.** v1 ships catalog updates in app
  releases. If the curation cadence ever needs to outpace app
  releases, a remote-fetched catalog with bundled fallback is the
  natural extension.
- **Encryption at rest for the model file and license text.** Not
  v1 — same posture as provider API keys (see
  [`followups.md → v1-blocking`](./followups.md#v1-blocking) for
  the broader encryption-at-rest follow-up if one exists).
