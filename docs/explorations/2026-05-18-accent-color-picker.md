# 2026-05-18 — Accent color picker

Resolves the previously-parked `Accent color picker UI` followup
(removed from `followups.md` in the same commit). Two surfaces
consume an accent color picker — App Settings → Appearance ·
Accent override and Story Settings → About · Accent color — and
the production primitive was unpinned. Both wireframes
rendered an ad-hoc 7-swatch row with a `+ custom` chip; the design
pass pins palette source, custom-input UI, fallback/reset semantics,
and the per-consumer wrapper logic.

## Outcome

A single `ColorPicker` primitive in `components/ui/` with a pattern
spec at `docs/ui/patterns/color-picker.md`. Both consumers wrap it
with their own gating, fallback, persistence, and (App Settings
only) a derivation contrast warning. The shared curated palette
lives as a constant in `docs/ui/foundations/color.md` under a new
`## Curated accent palette` section.

Three key shape decisions:

1. **One primitive, consumer wires fallback.** Picker takes
   `swatches`, `value`, `onChange`, `fallbackColor`,
   `fallbackLabel`, `allowCustom`, and an optional
   `customWarning` render-prop. It knows nothing about derivation,
   visibility gating, or persistence — those are consumer
   concerns. Maximum reuse, minimum coupling.
2. **Fixed curated palette** (not theme-derived). Seven mode-agnostic
   hues exported from `foundations/color.md`. Custom hex covers
   precision needs via the `+ custom` affordance.
3. **Apply / Cancel for custom input, NOT live.** Avoids a
   theme-re-derive flicker in App Settings; consistent semantics
   across both consumers.

## Primitive API

```ts
type ColorValue = string // hex, e.g. '#3b82f6'

type ColorPickerProps = {
  swatches: ColorValue[] // curated palette, order = render order
  value: ColorValue | null // null = fallback state
  onChange: (next: ColorValue | null) => void

  fallbackColor: ColorValue // shown in the (none) swatch
  fallbackLabel: string // tooltip on (none) swatch

  allowCustom?: boolean // default false
  customWarning?: (hex: ColorValue) => ReactNode | null
  disabled?: boolean
  className?: string
  testID?: string
}
```

Fully controlled — no internal state. Consumer reads/writes
persistence directly.

## Composition

Single horizontal row, `flex-wrap` at narrow widths. Order:

1. **`(none)` swatch** — always rendered first. Same size as a
   curated swatch (~28 px circle at Regular density;
   density-resolved). Fill = `fallbackColor`. Distinguishing
   marker: `border-dashed` (instead of solid). Tooltip =
   `fallbackLabel` (e.g., `Use theme accent`).
2. **Curated swatches** — the `swatches[]` array, rendered as
   filled circles with `--border` outline at rest.
3. **`+ custom` chip** (when `allowCustom`) — swatch-sized circle
   with `+` glyph. When the current value is a custom hex (not in
   `swatches[]`), the chip fills with that hex and shows the
   selected-state ring.

**Selected state.** Thicker `--border-strong` outline (visual
treatment may add a checkmark glyph at component-authoring time;
contract is "unambiguously selected"). The `(none)` and `+ custom`
swatches use the same selected treatment.

**Value-equality precedence rule.** If `value` matches one of the
curated swatches verbatim, that curated swatch shows selected and
the `+ custom` chip stays at `+`, regardless of which path the user
took to set the value. No provenance state. The user can re-open
`+ custom` and re-pick freely; commit re-evaluates against the
palette.

**Swatch tooltips.** Slot names (`red`, `orange`, etc.) double as
`aria-label` and hover tooltips on the curated swatches. Standard
across all consumers — supports color-blind users for whom hue
alone is not a discriminator.

**Keyboard.** Each swatch is a focusable button; left/right arrow
keys move focus within the row (roving tabindex). Enter / Space
selects. `+ custom` opens the overlay; focus returns to `+ custom`
on overlay close.

**Disabled.** `pointerEvents: 'none'` on the row (per the rn-primitives
disabled gap), `opacity-50` visual. All swatches inert.

## Curated palette

Lives in [`foundations/color.md`](../ui/foundations/color.md) as a
new `## Curated accent palette` section, placed after
`## Accent-derivation algorithm` and before `## Recently-classified
slot`. Section commits:

**Count: 7 swatches.** Matches existing wireframe; covers the
color wheel without forcing fine distinctions on the user.

**Mode-agnostic.** Single set of hex values used by both light and
dark themes. The derivation algorithm already absorbs mode-aware
adjustments (`accent-hover` darkens on light themes, lightens on
dark; `selectionBg` mixes at 0.20 / 0.30 by mode). The base
accent value is mode-agnostic by design.

**Selection criteria** (committed in the doc; values pickable at
authoring within these bounds):

1. `accentFg × accent ≥ 4.5:1` after the WCAG 0.5 auto-flip in
   `deriveAccent` — every swatch produces a button that reads.
2. `--accent × --bg-base ≥ 3:1` against every theme's canvas
   (light + dark) — swatch perceivable as a control surface on
   every theme.
3. `selectionBg × bgBase ≥ 3:1` after derivation under both mode
   ratios — selection visible on every theme.
4. Hues distributed across the wheel.

**Recommended starting palette:**

| Slot     | Hex       | Notes                    |
| -------- | --------- | ------------------------ |
| `red`    | `#dc2626` | matches audit sample set |
| `orange` | `#ea580c` |                          |
| `green`  | `#16a34a` | matches audit sample set |
| `teal`   | `#0d9488` |                          |
| `blue`   | `#2563eb` | matches audit sample set |
| `indigo` | `#4f46e5` |                          |
| `pink`   | `#db2777` |                          |

Tailwind 600-level baseline. Three values align with the existing
audit-utility sample set so derivation coverage naturally extends.

**Yellow / amber omission.** Pure yellows fail criterion 1
(`accentFg × accent` lands sub-4.5:1 under auto-flip). Amber-600
would pass but sits visually adjacent to orange-600; dropping it
keeps the row visually distinct.

**Audit-utility consequence.** The `## Theme audit utility`
section's "derivation sweep" check, currently iterating over a
fixed sample set, extends to iterate over every value in the
curated palette plus a pastel-variant sweep (pastels stay to cover
the custom-hex range). Same fail/warn semantics.

## Custom-input UI

Triggered by the `+ custom` chip. Hosts a cross-platform RN color
picker library inside an overlay.

**Overlay surface.**

- **Desktop / tablet (≥640 px container).** Popover anchored to
  the `+ custom` chip, ~280 px wide. Per
  [`patterns/overlays.md`](../ui/patterns/overlays.md) Popover
  contract.
- **Phone (<640 px container).** Sheet (Short variant) with
  drag-to-dismiss enabled. Per
  [`foundations/mobile/layout.md → Surface bindings`](../ui/foundations/mobile/layout.md#surface-bindings--existing-app-surfaces).

**Layout inside.**

- Header: `Custom color` title, close icon.
- Body: cross-platform color picker library (hue + saturation/value
  - hex sync) + dedicated hex text field + live preview swatch.
- Warning region: renders the `customWarning(localHex)` output (App
  Settings only — Story Settings omits the prop, region is
  not rendered).
- Footer: right-aligned `[Cancel] [Apply]`.

**Library selection criteria** (deferred to implementation): renders
identically on RN + RN Web; supports controlled `value` API;
exposes hue control, S/V area, and hex sync; fits within ~200 px
height (escalate Sheet to Medium otherwise).

**Apply / Cancel semantics.**

- Library + hex field write to **local popover state**, not to
  `value`.
- **Apply** closes the overlay and calls `onChange(localHex)`.
- **Cancel**, **Esc**, **outside-click**, and **drag-dismiss** all
  close the overlay and discard local state.
- **No "are you sure" guard on discard.** Custom picking is
  preview-y; bail-out is free.

Why not live: App Settings would re-run `deriveAccent` and re-apply
the theme on every keystroke / drag — perceptible flicker. The
library's own internal preview covers the "see it before committing"
need. Symmetric semantics across both consumers.

**Hex field.** Accepts `#RRGGBB` and `#RGB` shorthand. Normalizes
to 6-digit on Apply. Invalid hex: Apply disabled; `--danger` border

- inline message `Enter a hex color, e.g. #3b82f6`.

**Focus / keyboard.** Open: focus lands on hex field. Tab order:
library controls → hex field → Cancel → Apply. Enter inside hex
field = Apply (if valid). Esc = Cancel.

## Per-consumer wiring

### App Settings → Appearance · Accent override

**Render gating.** Wrapper checks
[`activeTheme.accentOverridable`](../ui/foundations/theming.md#accent-override-opt-in).
False → render nothing. True → render `ColorPicker` inside the
standard form row.

**Wrapper guards on theme-loaded state.** If theme registry hasn't
resolved, wrapper renders nothing (or a skeleton) until the active
theme is available; `fallbackColor` is required and non-null.

| Prop            | Value                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| `swatches`      | `CURATED_ACCENT_PALETTE` exported from `foundations/color.md`                 |
| `value`         | `app_settings.appearance.accentOverride` (string \| null)                     |
| `onChange`      | persist; theme engine re-derives at next render                               |
| `fallbackColor` | active theme's authored `--accent` token value                                |
| `fallbackLabel` | `'Use theme accent'`                                                          |
| `allowCustom`   | `true`                                                                        |
| `customWarning` | computes `deriveAccent(hex, mode, bgBase)`; returns warning node if sub-4.5:1 |

**Dormant-but-stored.** When active theme has
`accentOverridable: false`, the picker doesn't render but
`accentOverride` stays in storage. Switching back re-applies. Per
the existing `app-settings.md` spec.

**Caption.** `Tints buttons, focus rings, and selections. Custom
colors derive a full accent set.`

**Warning copy** (rendered by `customWarning` when threshold fails):

> ⚠ This color produces low contrast on accent buttons. Text on
> accent surfaces may be hard to read.

No "blocked" affordance — `foundations/color.md → Known limitations`
already commits warn-but-allow.

### Story Settings → About · Accent color

**Render gating.** Always renders.

| Prop            | Value                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `swatches`      | `CURATED_ACCENT_PALETTE` (same constant)                                                              |
| `value`         | `stories.accent_color` (string \| null) per [`data-model.md`](../data-model.md#story-identity-fields) |
| `onChange`      | persist via the surface's Save bar draft state                                                        |
| `fallbackColor` | mode-derived strip color resolved by [`story-card.md`](../ui/patterns/story-card.md) logic            |
| `fallbackLabel` | `'Use mode-derived strip color'`                                                                      |
| `allowCustom`   | `true`                                                                                                |
| `customWarning` | `undefined` (no derivation runs for story accent; no contrast warning)                                |

**Story-accent consumers** — the surfaces that actually read
`stories.accent_color`:

- Story-card mode-accent strip (`patterns/story-card.md`) — the
  primary visual.
- Future story-scoped chrome surfaces inherit the same lookup.

Picker is consumer-agnostic; wrapper persists, downstream surfaces
resolve at render.

**Caption.** `Color shown on this story's card. Falls back to the
mode-derived strip color when unset.`

## Doc-integration impact

### New file

**`docs/ui/patterns/color-picker.md`** — full primitive spec
(Sections above in pattern-doc shape). Includes:

- Primitive shape + API.
- Composition (row layout, swatch visuals, `+ custom` chip).
- Custom-input overlay (Popover desktop, Sheet narrow, library
  contract, Apply/Cancel, hex validation).
- Keyboard / focus / disabled.
- `Used by` list (App Settings · Appearance → Accent override;
  Story Settings · About → Accent color).
- Cross-pattern citations: `patterns/overlays.md`,
  `foundations/color.md → Curated accent palette`,
  `foundations/color.md → Accent-derivation algorithm`.

### Edits to `docs/ui/foundations/color.md`

1. **New section `## Curated accent palette`** after
   `## Accent-derivation algorithm`. Content per
   [Curated palette](#curated-palette) above.
2. \*\*Edit to `## Theme audit utility → What it checks per theme →
3. Accent-overridable themes only — derivation sweep`.\*\* Extend
   the existing sample-set sentence to iterate over every value
   in the curated palette plus pastel variants.

### Edits to `docs/ui/screens/app-settings/app-settings.md`

- **`## APP · Appearance` accent-override paragraph.** Replace
  the "production UI primitive isn't pinned… see followups"
  framing with a wrapper-summary paragraph pointing at
  `patterns/color-picker.md`. Cover: render gating, props passed,
  dormant-but-stored, caption.
- **Mobile / responsive subsection.** The
  "Accent color swatch row wraps on narrow tiers" bullet drops
  the followup pointer; substance about narrow-tier wrap moves
  to a single sentence noting the picker primitive handles wrap
  internally.

### Edits to `docs/ui/screens/story-settings/story-settings.md`

- **About-tab accent-color row.** Replace the ad-hoc swatch-row
  prose with a wrapper-summary paragraph pointing at
  `patterns/color-picker.md`. Cover: always-rendered, props
  passed, caption.
- **Mobile / responsive subsection.** Update the
  "Accent color swatch row wraps on narrow tiers" bullet the same
  way as app-settings — strip the followup pointer.
- **Screen-specific open questions list.** Remove the
  `Accent color picker` bullet — resolved.

### Edits to `docs/followups.md`

- **Remove the `### Accent color picker UI` entry** under `## UX`.

### Edits to `docs/ui/component-inventory.md`

- **Add `ColorPicker` row** under primitives, status: build-ready.
  Folder: `components/ui/`.

### Edits to `docs/explorations/2026-05-03-phase-2-sketch.md`

- **Re-point the broken anchor.** Line 192 currently references
  `followups.md#accent-color-picker-ui` in forward-looking phase-2
  prose. After the followup removes, the link breaks. Update to
  point at the new `patterns/color-picker.md` with a parenthetical
  note that the design has landed.

### Wireframes

Both wireframes currently show a 7-swatch row with `+ custom`.
Updates:

- **`docs/ui/screens/app-settings/app-settings.html`** — accent-
  override row reflects the spec: `(none)` swatch with dashed
  border at row start (fill = demo theme accent), 7 curated
  swatches, `+ custom` chip. Click on `+ custom` opens a
  non-functional popover stub showing the
  [custom-input layout](#custom-input-ui) (library placeholder
  rect + hex field + preview + warning region + Cancel/Apply).
  Renders only when a faux "accentOverridable" toggle is on.
- **`docs/ui/screens/story-settings/story-settings.html`** — same
  picker shape, no warning region, no conditional render. `(none)`
  swatch fill demonstrates the mode-derived strip color.

Wireframe updates bundle into the same commit as canonical-doc
changes per the design-wireframe bundling rule.

## Followups

**Resolved:** `followups.md → Accent color picker UI` (entire
entry).

**Introduced:** none.

## Out of scope

- **Theme-aware palette.** Fixed for v1; revisit only if a theme
  authoring request surfaces.
- **Native HTML5 `<input type="color">`.** Considered, rejected for
  platform-divergence; cross-platform RN library covers both
  surfaces with one UI.
- **Per-swatch labels in the UI.** Slot names serve as tooltips /
  `aria-label`; no visible text labels on swatches.
- **Per-setting undo / rollback.** Inherits from each consumer's
  existing pattern (App Settings: no per-setting undo; Story
  Settings: Save bar + navigate-away guard per
  `patterns/save-sessions.md`).
- **Schema work.** Both persistence fields
  (`app_settings.appearance.accentOverride`,
  `stories.accent_color`) already exist; no `data-model.md` edits.
