# Slice 1.1 — Code conventions

## Metadata

- **Milestone:** [Milestone 1 — Spine](../milestone.md)
- **Depends on:** none (first slice)
- **Blocks:** 1.2, 1.3, 1.4, 1.5, 1.6, 1.7 — every later slice
  authors `lib/*` modules under this slice's eslint rule.

## Goal

Land the canonical project conventions before any `lib/` module,
Storybook compound, or feature slice exists so the first writers
set the pattern rather than getting retrofitted into it later.
Three artefacts ship together: the `eslint-plugin-boundaries` rule
at `error` severity enforcing the `lib/*` public-API discipline,
the canonical `docs/code-conventions.md` human-facing doc covering
the full v1 convention set (module structure, state placement,
action layer, component taxonomy, i18n, testing, forms, pnpm),
and the matching `.claude/rules/code.md` citation block that
references it from agent-facing context. No `lib/*` modules are
introduced; the first module ships in Slice 1.2.

## Background

V1 introduced this convention at warn-level near the end of that
codebase and never finished the migration. V2 adopts it from day 1
to avoid the retrofit cost. Each subdirectory of `lib/` is a
module: internal files import each other freely via relative
paths; external code must import through the module's `index.ts`.
Tests inside a module are allowed deep imports; tests outside use
the public API only. Types are part of the public API — deep type
imports are banned the same as value imports.

The v1 working config (at
`/home/failerko/_LLM/Aventura/Aventura/eslint.config.js`, outside
this repo) is the shape baseline: same plugin
(`eslint-plugin-boundaries`), same element-by-folder model, same
disallow rule. Raised to `'error'` severity and applied to `lib/*`
instead of `src/lib/services/*`.

## Required reading

- [`.claude/rules/code.md` → Import wildcards](../../../../../.claude/rules/code.md#import-wildcards)
  — existing pattern for eslint rules that enforce code
  discipline; this slice extends the same style with the
  boundaries plugin.
- [`.claude/rules/code.md` → Commenting discipline](../../../../../.claude/rules/code.md#commenting-discipline)
  — first canonical convention; this slice's `docs/code-conventions.md`
  cites rather than duplicates it.
- [`docs/conventions.md` → Cross-references](../../../../conventions.md#cross-references)
  — anchor-link convention for any new docs added in this slice.
- [`docs/implementation/lessons-learned/`](../../../lessons-learned/README.md)
  — implementation pitfalls already collected; the canonical doc
  points readers here for runtime-pattern gotchas.

## Scope: in

- Add `eslint-plugin-boundaries` to dev dependencies; install
  with `pnpm`.
- Extend `eslint.config.js`:
  - Register the `boundaries` plugin.
  - Declare element type `lib-module` with pattern `lib/*` and
    mode `folder`.
  - Add `boundaries/dependencies` rule at `'error'` severity
    with a disallow rule: `to: ['lib-module']`,
    `disallow: { to: { internalPath: '!index.ts' } }`, message
    explaining the public-API discipline.
- Create `docs/code-conventions.md` covering:
  - **Module structure** — `lib/*` public-API rule, internal vs
    external imports, test deep-import policy, types as part of
    the public API.
  - **State placement** — three-tier rule (component-local
    `useState` (React) for component-local state, cross-component
    ephemeral via `lib/stores/ui/`, domain-class Zustand stores
    exposing mutators only — no direct `setState` access from
    outside the store / action layer).
  - **Action layer** — single layer spans pipeline and UI
    writes; domain-organized (`lib/actions/<domain>/`); mediates
    Zustand and SQLite transactionally.
  - **Component folder taxonomy** — primitives → `components/ui/`;
    domain-agnostic compounds → `components/compounds/`;
    single-domain compounds → `components/<domain>/`; shells →
    `components/shells/`. Cites
    [`docs/ui/components.md → Directory layout`](../../../../ui/components.md#directory-layout).
  - **i18n discipline** — no raw user-facing strings in code; all
    chrome routes through `t()`. Convention-only this slice;
    eslint enforcement gates on `i18next` install in Slice 1.7
    (per
    [`milestone.md → Narrative`](../milestone.md#narrative--overview)).
  - **Testing discipline** — unit tests required on logic:
    `lib/*` modules, pure functions, reducers, state machines,
    classifier output parsers. UI smoke / Storybook / manual
    covers component behaviour. No coverage thresholds (they
    rot).
  - **Forms** — input clusters with a submit button use
    `react-hook-form`. Inline controlled inputs (single input
    without submit — rename, search, toggle row) stay
    component-local. Convention-only this slice; `react-hook-form`
    installs in Slice 2.3.
  - **pnpm + patches** — `pnpm` is the only supported package
    manager, enforced by `engines.pnpm` + `engine-strict=true` +
    `only-allow` preinstall guard. Patches live under
    [`patches/`](../../../../../patches/) and are referenced via
    `pnpm-lock.yaml` `patchedDependencies`.
  - **Commenting + import discipline** — citations to
    [`.claude/rules/code.md → Commenting discipline`](../../../../../.claude/rules/code.md#commenting-discipline)
    and
    [`.claude/rules/code.md → Import wildcards`](../../../../../.claude/rules/code.md#import-wildcards).
    Not duplicated; canonical home stays in `code.md` since the
    rules are agent-facing-first.
  - **Lessons-learned pointer** — link to
    [`docs/implementation/lessons-learned/`](../../../lessons-learned/README.md)
    with read-before-touching guidance.
- Extend `.claude/rules/code.md` with citing sections for every
  topic introduced in `docs/code-conventions.md` above
  (Module structure, State placement, Action layer, Component
  folder taxonomy, i18n, Testing, Forms, pnpm + patches,
  Lessons-learned). Each section is short and points to the
  canonical anchor — code.md owns Commenting + Import wildcards
  end-to-end and cites code-conventions.md for everything else.
- Update `docs/README.md` to add `code-conventions.md` to the
  `## What's here` index.
- Update `CLAUDE.md` `## Authoritative reading` to list
  `docs/code-conventions.md`.
- Update the `aventuras-*` dev skills that touch code
  (`aventuras-test-driven-development`,
  `aventuras-systematic-debugging`,
  `aventuras-receiving-code-review`,
  `aventuras-requesting-code-review`,
  `aventuras-verification-before-completion`,
  `aventuras-finishing-a-development-branch`) to cite
  `docs/code-conventions.md` in their preflight.

## Scope: out

- No `lib/*` modules. The first module (`lib/db/`) ships in Slice
  1.2.
- No other boundaries element declarations (`component`, `hook`,
  `electron`). Only `lib-module` is declared in this slice;
  future slices extend the config when cross-domain coupling
  becomes a concern.
- No `console.*` lint ban — lands with the logger in Slice 1.3.
- No setter-from-domain-store lint ban — lands with the action
  layer / domain stores in Slice 1.5 or 1.6 once domain stores
  exist.
- No selective-re-export shape enforcement on `index.ts` files;
  convention-only, not mechanically enforced this slice.
- No eslint rule for raw user-facing strings — gates on
  `i18next` install in Slice 1.7.
- No eslint rule for `react-hook-form` usage on submit clusters
  — `react-hook-form` doesn't install until Slice 2.3; rule
  remains a code-review-only check.
- Lessons-learned migration, CLAUDE.md non-Claude-agent pointer
  block, and pnpm enforcement (`only-allow` + `engine-strict`)
  landed as scaffolding before this slice opens — not part of
  the slice's deliverable surface, but referenced by the
  canonical doc.

## Acceptance criteria

- `eslint-plugin-boundaries` listed in `package.json`
  devDependencies and locked in `pnpm-lock.yaml`.
- `eslint.config.js` registers the plugin and includes the
  `boundaries/dependencies` rule at `'error'` severity targeting
  the `lib-module` element type.
- `docs/code-conventions.md` exists, covers Module structure,
  State placement, Action layer, Component folder taxonomy, i18n,
  Testing, Forms, pnpm + patches, Commenting / import (cites
  `code.md`), and Lessons-learned, and is listed in
  `docs/README.md` + `CLAUDE.md` `## Authoritative reading`.
- `.claude/rules/code.md` extended with citing sections for every
  topic introduced in the canonical doc; Commenting + Import
  wildcards remain end-to-end in `code.md`.
- All `aventuras-*` dev skills listed under Scope: in cite
  `docs/code-conventions.md` in their preflight.
- `pnpm lint` passes on the empty `lib/` (no violations because
  no modules exist yet).
- `pnpm lint:docs` passes — remark validates anchor links across
  the new and updated docs.

## Tests

No code tests in this slice. The boundaries rule has nothing to
enforce against until a `lib/*` module exists; testing the plugin
itself (rather than project code) is upstream-tested and not
worth duplicating. Slice 1.2 (Drizzle, first real `lib/*`
module) is the first validation that the rule fires correctly
when external code attempts to deep-import `lib/db/`'s internals.

## Open questions

- **Synthetic fixture for rule verification.** Should this slice
  include a throwaway `lib/_smoke/` module plus a test that
  external code deep-importing it fails lint, then have Slice
  1.2 remove it? Leaning no — synthetic fixtures rot fast and
  Slice 1.2's first real module closes the gap quickly.
- **Element-type scope.** Pattern `lib/*` with mode `folder`
  treats only top-level subdirectories of `lib/` as modules;
  nested sub-modules (`lib/foo/bar/`) are internal to their
  parent. Confirm this matches intent during authoring; the
  alternative (`lib/**` flat) would treat every level as its own
  module boundary, probably too granular.
- **Whether `components/<domain>/` should also be a boundaries
  element.** Out of scope for this slice. Flag for a possible
  future slice if cross-domain component imports become a
  concern.
