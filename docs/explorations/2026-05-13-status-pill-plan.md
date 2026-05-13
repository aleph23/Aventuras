# StatusPill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `Tag` with four new tones + a leading slot, then ship `GenerationStatusPill` per [design](./2026-05-13-status-pill-design.md) (commit `954d215`).

**Architecture:** Tag is the visual primitive — same `rounded-full border` body, additive tone variants and an optional `leading` slot. `GenerationStatusPill` is a thin compound: priority resolution (active > error > hidden), tier-aware render via `useTier()`, owns the click-to-cancel `Popover` for the active variant. No reducer, no pure module, no vitest — pure render plus a single `useState` for popover open.

**Tech Stack:** React 19, RN 0.83, Expo SDK 55, RN Web, NativeWind 4, Tailwind 3, Storybook (react-native-web-vite). Existing primitives consumed: `Tag` (extended), `Spinner` (smallest size `sm`), `Popover`, `Button`, `Text`. Tier hook: `hooks/use-tier.ts`. Theme tokens: `bg-{success,warning,danger,accent}` + `text-{success-fg,warning-fg,danger-fg,accent-fg}` (verified in `tailwind.config.js`).

---

## File map

```
components/ui/
  tag.tsx                                      MODIFY (Task 1)
  tag.stories.tsx                              MODIFY (Task 1)

components/compounds/
  generation-status-pill.tsx                   NEW    (Task 2)
  generation-status-pill.stories.tsx           NEW    (Task 3)

docs/ui/component-inventory.md                 MODIFY (Task 3 — shipped row + drop needs-design)
docs/followups.md                              MODIFY (Task 3 — new GenerationStatusPill section)
```

## Task order rationale

1. **Tag primitive first** — visual change that's reviewable in Storybook independently. The compound needs the new tones + leading slot to exist before it can consume them. Tag stories extension lands in the same commit so the visual deltas are testable immediately.
2. **GenerationStatusPill view second** — the compound consumes Tag, owns priority logic + tier-aware render + popover. Lands without stories (not "shipped" yet by inventory standard).
3. **Stories + inventory + followups** — same commit per `feedback_inventory_double_entry` memory rule. Promotes `StatusPill` from needs-design and adds `GenerationStatusPill` to Compounds — shipped.

Three tasks, three commits. Significantly smaller than collision-resolve because there's no pure module / reducer surface.

---

## Task 1: Tag primitive extension

**Files:**

- Modify: `components/ui/tag.tsx`
- Modify: `components/ui/tag.stories.tsx`

### Step 1.1 — Add the new tones + leading slot to `tag.tsx`

Open `components/ui/tag.tsx`. Replace the `TagProps` type definition (lines 8-33):

```ts
type TagProps = {
  /**
   * Visual tone:
   * - `default` — outline + muted text (neutral, default).
   * - `soft` — `bg-region` tint (inline entity references, tag chips).
   * - `success` — filled `bg-success` + `text-success-fg` (staged entity, Resolved thread).
   * - `warning` — filled `bg-warning` + `text-warning-fg` (retired entity, Pending thread, error-pill variant).
   * - `danger` — filled `bg-danger` + `text-danger-fg` (Failed thread).
   * - `accent` — filled `bg-accent` + `text-accent-fg` (gen pill active phase).
   */
  tone?: 'default' | 'soft' | 'success' | 'warning' | 'danger' | 'accent'
  /**
   * Replaces the solid border with a dashed border. Used for
   * add-affordance buttons ("+ tag", "+ relationship").
   * Mutually-exclusive with `removable` in practice (add vs. remove
   * are different use cases).
   */
  dashed?: boolean
  /**
   * When true, renders an inline × button after the label that calls
   * `onRemove` when pressed. The × is its own touch target (44px
   * floor on phone).
   */
  removable?: boolean
  onRemove?: () => void
  /** Optional press handler on the tag body itself (clickable label). */
  onPress?: () => void
  disabled?: boolean
  className?: string
  /**
   * Optional element rendered before the label, separated by the
   * existing `gap-1`. Used by GenerationStatusPill to inject a
   * Spinner during active phases; available to any future consumer
   * needing a small leading indicator.
   */
  leading?: React.ReactNode
  children?: React.ReactNode
}
```

Replace the function signature (line 35-44):

```tsx
export function Tag({
  tone = 'default',
  dashed,
  removable,
  onRemove,
  onPress,
  disabled,
  className,
  leading,
  children,
}: TagProps) {
```

Replace the `baseClass` block (lines 46-65) so the tone arm covers all six variants. The new tones are filled (saturated background + matching foreground), mirroring the `delta-log-row.tsx:53-55` convention:

```tsx
const interactive = onPress != null
const isFilled = tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'accent'
const baseClass = cn(
  // `group` hooks the Pressable so the label can hover-lift via
  // group-hover through TextClassContext (direct hover: doesn't
  // cascade to inherited text colors).
  'group flex-row items-center gap-1 rounded-full border px-row-x-xs py-row-y-xs',
  // Tone — border + background. `default` / `soft` keep the existing
  // neutral border; the four new tones use their semantic border to
  // strengthen the signal at small sizes.
  tone === 'default' && 'border-border-strong bg-bg-base',
  tone === 'soft' && 'border-border-strong bg-bg-region',
  tone === 'success' && 'border-success bg-success',
  tone === 'warning' && 'border-warning bg-warning',
  tone === 'danger' && 'border-danger bg-danger',
  tone === 'accent' && 'border-accent bg-accent',
  dashed && 'border-dashed',
  // State-layer tints work only over neutral bgs; filled bgs need
  // opacity-based feedback. Per `feedback_state_layer_vs_filled`
  // memory: `bg-tint-*` tints don't read on saturated surfaces.
  interactive && (isFilled ? 'active:opacity-90' : 'active:bg-tint-press'),
  Platform.select({
    web: cn(
      interactive && 'cursor-pointer outline-none transition-colors',
      interactive && (isFilled ? 'hover:opacity-90' : 'hover:bg-tint-hover'),
      interactive && 'focus-visible:ring-2 focus-visible:ring-focus-ring',
      disabled && 'cursor-not-allowed pointer-events-none',
    ),
  }),
  disabled && 'opacity-50',
  className,
)
```

The `isFilled` branch handles the filled-surface hover convention: state-layer tints (`bg-tint-press` / `bg-tint-hover`) only work over neutral backgrounds; on saturated bgs they read as muddy noise. The four new tones use `opacity-90` for press/hover instead — matches the project's destructive-button + selected-chip patterns and the `feedback_state_layer_vs_filled` memory.

Replace the `labelClass` block (lines 67-70) so text color matches the tone:

```tsx
const labelClass = cn(
  'text-xs',
  // Tone-keyed text color. The two neutral tones keep `text-fg-muted`;
  // each filled tone uses its semantic foreground for guaranteed
  // contrast on the saturated background (matches the convention in
  // `components/compounds/delta-log-row.tsx:53-55`).
  (tone === 'default' || tone === 'soft') && 'text-fg-muted',
  tone === 'success' && 'text-success-fg',
  tone === 'warning' && 'text-warning-fg',
  tone === 'danger' && 'text-danger-fg',
  tone === 'accent' && 'text-accent-fg',
  interactive &&
    (tone === 'default' || tone === 'soft') &&
    Platform.select({ web: 'transition-colors group-hover:text-fg-primary' }),
)
```

The `group-hover:text-fg-primary` lift only applies on the neutral tones — on filled tones the foreground is already the saturated text color, no lift behavior.

Replace the `inner` JSX (around lines 112-117) to include the leading slot:

```tsx
const inner = (
  <>
    {leading}
    {label}
    {removeButton}
  </>
)
```

The leading element renders before the label inside the same flex-row (gap-1 already in `baseClass`). It sits inside the `TextClassContext.Provider` (via the wrapping label / inner structure) so any text inside the leading element inherits the tone-keyed color.

### Step 1.2 — Typecheck + format

Run: `pnpm exec tsc --noEmit && pnpm exec prettier --write components/ui/tag.tsx`
Expected: no errors.

### Step 1.3 — Add new stories to `tag.stories.tsx`

Open `components/ui/tag.stories.tsx`. Add an import for `Spinner` near the top (after existing imports) and add a `themes` import if not present. The existing imports look approximately like:

```tsx
import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { View } from 'react-native'

import { Tag } from '@/components/ui/tag'
```

Add:

```tsx
import { Spinner } from '@/components/ui/spinner'
import { themes } from '@/lib/themes/registry'
```

At the end of the file (after the existing exported stories), append:

```tsx
export const ToneSuccess: Story = {
  render: () => <Tag tone="success">staged</Tag>,
}

export const ToneWarning: Story = {
  render: () => <Tag tone="warning">retired</Tag>,
}

export const ToneDanger: Story = {
  render: () => <Tag tone="danger">Failed</Tag>,
}

export const ToneAccent: Story = {
  render: () => <Tag tone="accent">reasoning…</Tag>,
}

export const WithLeading: Story = {
  render: () => (
    <Tag tone="accent" leading={<Spinner size="sm" />}>
      reasoning…
    </Tag>
  ),
}

export const TonesInThemeMatrix: Story = {
  render: () => (
    <View className="gap-4">
      {themes.map((t) => (
        <View
          key={t.id}
          // @ts-expect-error — dataSet is RN-Web only.
          dataSet={{ theme: t.id }}
          className="flex-row flex-wrap items-center gap-2 rounded-md bg-bg-base p-4"
          style={{ width: 360 }}
        >
          <Tag tone="default">default</Tag>
          <Tag tone="soft">soft</Tag>
          <Tag tone="success">success</Tag>
          <Tag tone="warning">warning</Tag>
          <Tag tone="danger">danger</Tag>
          <Tag tone="accent" leading={<Spinner size="sm" />}>
            accent
          </Tag>
        </View>
      ))}
    </View>
  ),
}
```

If `Story` isn't already typed in the file, copy whatever alias the existing stories use (likely `type Story = StoryObj<typeof Tag>`). Existing stories stay untouched.

### Step 1.4 — Format + verify

Run: `pnpm exec prettier --write components/ui/tag.stories.tsx`
Run: `pnpm exec tsc --noEmit`
Expected: no errors.

### Step 1.5 — Visual verify in Storybook

Start Storybook in a separate terminal if not already running: `pnpm storybook`

Navigate to `UI/Tag` (or the existing tag stories path). Confirm:

- The four new tone stories render filled pill bodies with their semantic background colors and matching foreground text.
- `WithLeading` renders the spinner before the label, separated by the `gap-1` spacing.
- `TonesInThemeMatrix` shows all six tones side-by-side across all four themes; saturation reads correctly on each theme.
- Existing tag stories (default, soft, dashed, removable, interactive, etc.) render unchanged.

### Step 1.6 — Commit

```bash
git add components/ui/tag.tsx components/ui/tag.stories.tsx
git commit -m "feat(ui): Tag — add success/warning/danger/accent tones + leading slot

Extends the tag primitive's tone palette beyond default/soft to
cover the four semantic status tones (filled bg + matching fg per
delta-log-row.tsx:53-55 convention). Adds an optional leading slot
rendered before the label inside the same flex-row + gap-1 — used
by GenerationStatusPill to inject a Spinner during active phases.

Existing default/soft callsites untouched. Six stories added under
existing Tag matrix for visual coverage."
```

If pre-commit hooks fail, fix the underlying issue and create a NEW commit (do not amend).

---

## Task 2: GenerationStatusPill view

**Files:**

- Create: `components/compounds/generation-status-pill.tsx`

### Step 2.1 — Create the compound file

Create `components/compounds/generation-status-pill.tsx`:

```tsx
import * as React from 'react'
import { View } from 'react-native'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { Tag } from '@/components/ui/tag'
import { Text } from '@/components/ui/text'
import { useTier } from '@/hooks/use-tier'

type GenerationPhase = 'reasoning' | 'generating-narrative' | 'classifying' | 'closing-chapter'

type ErrorState = { code: 'embedder-offline'; pendingRows: number } | { code: 'classifier-offline' }

type GenerationStatusPillProps = {
  activePhase?: GenerationPhase
  error?: ErrorState
  onCancel: () => void
  onErrorTap: (code: ErrorState['code']) => void
}

const PHASE_COPY: Record<GenerationPhase, string> = {
  reasoning: 'reasoning…',
  'generating-narrative': 'generating narrative…',
  classifying: 'classifying…',
  'closing-chapter': 'closing chapter…',
}

function errorCopy(error: ErrorState): string {
  switch (error.code) {
    case 'embedder-offline':
      return `Embedder offline — ${error.pendingRows} rows pending`
    case 'classifier-offline':
      return 'Classifier offline — retrieval coverage thinning'
  }
}

function cancelCopy(phase: GenerationPhase): string {
  return phase === 'closing-chapter' ? 'Cancel chapter close' : 'Cancel generation'
}

export function GenerationStatusPill({
  activePhase,
  error,
  onCancel,
  onErrorTap,
}: GenerationStatusPillProps) {
  const tier = useTier()
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  // Priority: active generation > error state > hidden.
  if (activePhase != null) {
    const isPhone = tier === 'phone'
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Tag
            tone="accent"
            leading={<Spinner size="sm" />}
            onPress={() => setPopoverOpen((o) => !o)}
          >
            {isPhone ? null : PHASE_COPY[activePhase]}
          </Tag>
        </PopoverTrigger>
        <PopoverContent>
          <View className="gap-1">
            <Button
              variant="secondary"
              onPress={() => {
                onCancel()
                setPopoverOpen(false)
              }}
            >
              <Text>{cancelCopy(activePhase)}</Text>
            </Button>
          </View>
        </PopoverContent>
      </Popover>
    )
  }

  if (error != null) {
    return (
      <Tag tone="warning" onPress={() => onErrorTap(error.code)}>
        {errorCopy(error)}
      </Tag>
    )
  }

  return null
}

export type { GenerationStatusPillProps, GenerationPhase, ErrorState }
```

Behavior notes baked into the code:

- **Priority resolution** sits at the top of the body — `activePhase` non-null wins, then `error`, else `null` (idle-hide).
- **Phone icon-only** is determined by `tier === 'phone'`; only the active variant collapses to icon-only. Error variant keeps its text because the copy IS the action prompt and is short enough.
- **Popover** is only mounted in the active variant. Tapping the pill toggles popover open; tapping the Cancel button fires `onCancel()` then closes the popover. Outside-tap / Esc dismiss the popover without firing `onCancel()` — this is the default `Popover` primitive behavior.
- **Cancel copy** swaps to `Cancel chapter close` when phase is `closing-chapter`.
- **Tag's `onPress`** makes the entire pill a press target; combined with `<PopoverTrigger asChild>` it becomes the trigger element. The press handler also toggles the local state so consumers don't need to track open state externally.

If `Popover` / `PopoverTrigger` / `PopoverContent` is not how the existing `components/ui/popover.tsx` exports its API, adapt the import + usage to match. The existing primitive is at `components/ui/popover.tsx` — read it before assuming the API. The check pattern to verify: `grep -nE "^export" components/ui/popover.tsx`.

### Step 2.2 — Verify Popover API matches

Before committing, run:

```bash
grep -nE "^export" components/ui/popover.tsx
```

Expected exports include `Popover`, `PopoverTrigger`, `PopoverContent` (or similar — rn-primitives wrapping convention). If the names differ, adapt the imports + JSX in `generation-status-pill.tsx` accordingly. Don't invent unknown component names.

### Step 2.3 — Typecheck + format

Run: `pnpm exec tsc --noEmit && pnpm exec prettier --write components/compounds/generation-status-pill.tsx`
Expected: no errors.

If TypeScript complains about `<PopoverTrigger asChild>` wrapping `<Tag>` — `Tag` may not forward refs (rn-primitives' `asChild` often requires a forwardRef child). If so, the simplest fix is to wrap `<Tag>` in a `<View>` and put `onPress` on the View via a Pressable, OR drop `asChild` and let `PopoverTrigger` render its own button containing the tag content. Adapt as needed and document the choice in the commit message.

### Step 2.4 — Commit

```bash
git add components/compounds/generation-status-pill.tsx
git commit -m "feat(compounds): GenerationStatusPill view

Priority-resolved status pill compound — active generation phase
beats error state beats hidden. Consumes Tag's new accent/warning
tones + leading slot. Active variant owns the click-to-cancel
Popover; error variant fires onErrorTap callback for the consumer
to route. Phone tier collapses active to icon-only (text doesn't
fit per mobile/touch.md); error variant keeps text on phone.

No stories yet (Task 3)."
```

---

## Task 3: Stories + inventory + followups

**Files:**

- Create: `components/compounds/generation-status-pill.stories.tsx`
- Modify: `docs/ui/component-inventory.md`
- Modify: `docs/followups.md`

### Step 3.1 — Create the stories file

Create `components/compounds/generation-status-pill.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-native-web-vite'
import { View } from 'react-native'

import { Text } from '@/components/ui/text'
import { themes } from '@/lib/themes/registry'

import { GenerationStatusPill, type ErrorState } from './generation-status-pill'

const onCancel = () => {
  // eslint-disable-next-line no-console
  console.log('[story] cancel')
}
const onErrorTap = (code: ErrorState['code']) => {
  // eslint-disable-next-line no-console
  console.log('[story] error tap:', code)
}

const meta: Meta<typeof GenerationStatusPill> = {
  title: 'Compounds/GenerationStatusPill',
  component: GenerationStatusPill,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof GenerationStatusPill>

export const Hidden: Story = {
  render: () => (
    <View className="gap-2">
      <Text variant="muted" size="sm">
        Both activePhase and error are undefined — the pill returns null and renders nothing.
      </Text>
      <View className="rounded-md border border-border bg-bg-sunken px-3 py-2">
        <GenerationStatusPill onCancel={onCancel} onErrorTap={onErrorTap} />
      </View>
    </View>
  ),
}

export const ActiveReasoning: Story = {
  render: () => (
    <GenerationStatusPill activePhase="reasoning" onCancel={onCancel} onErrorTap={onErrorTap} />
  ),
}

export const ActiveGeneratingNarrative: Story = {
  render: () => (
    <GenerationStatusPill
      activePhase="generating-narrative"
      onCancel={onCancel}
      onErrorTap={onErrorTap}
    />
  ),
}

export const ActiveClassifying: Story = {
  render: () => (
    <GenerationStatusPill activePhase="classifying" onCancel={onCancel} onErrorTap={onErrorTap} />
  ),
}

export const ActiveClosingChapter: Story = {
  render: () => (
    <GenerationStatusPill
      activePhase="closing-chapter"
      onCancel={onCancel}
      onErrorTap={onErrorTap}
    />
  ),
}

export const ErrorEmbedder: Story = {
  render: () => (
    <GenerationStatusPill
      error={{ code: 'embedder-offline', pendingRows: 142 }}
      onCancel={onCancel}
      onErrorTap={onErrorTap}
    />
  ),
}

export const ErrorClassifier: Story = {
  render: () => (
    <GenerationStatusPill
      error={{ code: 'classifier-offline' }}
      onCancel={onCancel}
      onErrorTap={onErrorTap}
    />
  ),
}

export const ActivePlusError: Story = {
  render: () => (
    <View className="gap-2">
      <Text variant="muted" size="sm">
        Both inputs set — activePhase wins per the priority rule.
      </Text>
      <GenerationStatusPill
        activePhase="generating-narrative"
        error={{ code: 'embedder-offline', pendingRows: 3 }}
        onCancel={onCancel}
        onErrorTap={onErrorTap}
      />
    </View>
  ),
}

export const PhonePopover: Story = {
  render: () => (
    <View style={{ width: 360 }} className="gap-2 rounded-md bg-bg-base p-4">
      <Text variant="muted" size="sm">
        Fixed 360 px wrapper coerces phone-tier — active variant collapses to icon-only.
      </Text>
      <GenerationStatusPill activePhase="reasoning" onCancel={onCancel} onErrorTap={onErrorTap} />
    </View>
  ),
}

export const ThemeMatrix: Story = {
  render: () => (
    <View className="gap-4">
      {themes.map((t) => (
        <View
          key={t.id}
          // @ts-expect-error — dataSet is RN-Web only.
          dataSet={{ theme: t.id }}
          className="flex-row items-center gap-3 rounded-md bg-bg-base p-4"
          style={{ width: 360 }}
        >
          <Text variant="muted" size="sm" style={{ width: 80 }}>
            {t.name}
          </Text>
          <GenerationStatusPill
            activePhase="generating-narrative"
            onCancel={onCancel}
            onErrorTap={onErrorTap}
          />
        </View>
      ))}
    </View>
  ),
}
```

Story notes:

- `Hidden` wraps the (null-rendering) compound in a bordered region so the absence is visible. The caption explains what should be empty.
- `PhonePopover` uses a 360 px wrapper to push the layout under the phone-tier breakpoint (`PHONE_MAX = 640` in `hooks/use-tier.ts`), but the actual `useTier` reads window dimensions, not parent width. The story's purpose is to document the intent; visual phone verification needs Storybook's viewport addon set to a phone width. Note this in the story caption or rely on the viewport addon.
- `ActivePlusError` is the precedence verification — must visibly show the active variant (accent tone + spinner + "generating narrative…"), NOT the error variant.

### Step 3.2 — Format + typecheck

Run: `pnpm exec tsc --noEmit && pnpm exec prettier --write components/compounds/generation-status-pill.stories.tsx`
Expected: no errors.

### Step 3.3 — Visual verify in Storybook

`pnpm storybook` (separate terminal if not running). Navigate to `Compounds/GenerationStatusPill`.

Confirm each story renders as documented above. Specifically click the active-variant stories to open the popover — confirm:

- Popover anchors to the pill
- Cancel button reads `Cancel generation` for all phases except `closing-chapter`
- Cancel button reads `Cancel chapter close` for `ActiveClosingChapter`
- Clicking Cancel logs to console + closes popover

Confirm `ActivePlusError` shows the active variant only.

### Step 3.4 — Update the component inventory

Modify `docs/ui/component-inventory.md`:

**(a)** Find the `### Compounds — shipped` table. Add a new row alphabetically between `FormRow` and `ImporterMenu`:

```
| GenerationStatusPill   | `components/compounds/` | Top-bar generation status pill (universal in-story chrome per [`principles.md → Universal in-story chrome`](./principles.md#universal-in-story-chrome)). Owns the priority machine (active generation > sticky error > hidden), maps phase + error enums to copy, renders tier-aware (icon-only on phone), and owns the click-to-cancel Popover for the active variant. Error variant taps fire `onErrorTap(code)` for the consumer to route. Spec: [2026-05-13-status-pill-design.md](../explorations/2026-05-13-status-pill-design.md); pipeline orchestrator + memory error observation wiring pending — see [followups](../followups.md). |
```

Run `grep -nE "^\| (FormRow|GenerationStatusPill|ImporterMenu)" docs/ui/component-inventory.md` after the edit to confirm placement.

**(b)** Find the `### Compounds — needs design` table. Locate the `StatusPill` row (description starts with "No canonical component or spec today"). Delete that single table row.

Run `grep -n "StatusPill\|Compounds — needs design" docs/ui/component-inventory.md` to confirm StatusPill no longer appears and only `Importer` remains in needs-design.

### Step 3.5 — Update followups

Modify `docs/followups.md`. Locate the existing `### CollisionResolveDialog` section under `## UX` (added in the collision-resolve ship commit). Insert a new section immediately after it:

```markdown
### GenerationStatusPill

- **Pipeline orchestrator wiring.** Real `activePhase` source from
  the per-turn + chapter-close pipelines per
  [`architecture.md`](./architecture.md). The compound takes
  `activePhase` as a prop; consumers wire it from the orchestrator
  state.
- **Memory error observation.** Surface `embedder-offline` from
  staleness detection per
  [`memory/model-management.md → Staleness UI`](./memory/model-management.md#staleness-ui),
  `classifier-offline` from failed-persistent classifier state per
  [`memory/classifier.md → Pill priority`](./memory/classifier.md#background-task-framing).
  Consumer collapses simultaneous errors to one (embedder > classifier).
- **Top-bar consumer wiring.** Render the pill on Reader, World,
  Plot, Story Settings, Chapter Timeline per
  [`principles.md → Universal in-story chrome`](./ui/principles.md#universal-in-story-chrome).
- **World top-bar `⚠ N need review` pill.** Deferred from
  collision-resolve work; now unblocked since `Tag tone="warning"`
  is available. Sits beside (not inside) the generation pill — its
  own slot on the top bar.
```

Run `grep -nE "^### " docs/followups.md | tail` to confirm the new heading lands correctly.

### Step 3.6 — Lint the docs

```bash
pnpm lint:docs 2>&1 | grep -E "status-pill|component-inventory|followups\.md" | grep -v poc-embedder
```

Expected: no errors specific to your edits. Vendored Python markdown warnings under `scripts/poc-embedder/.venv/` are unrelated.

### Step 3.7 — Commit

```bash
git add components/compounds/generation-status-pill.stories.tsx \
        docs/ui/component-inventory.md \
        docs/followups.md
git commit -m "feat(compounds): ship GenerationStatusPill

10-story matrix covering hidden / 4 active phases / 2 error
variants / precedence / phone tier / ThemeMatrix. Promoted from
needs-design to shipped in component-inventory. Four followups
recorded: pipeline orchestrator wiring, memory error observation,
top-bar consumer wiring per-screen, and the World review-pill
that was deferred from collision-resolve (now unblocked)."
```

If pre-commit hooks fail, fix the underlying issue and create a NEW commit (do not amend).

---

## Self-review checklist

After all three tasks land:

1. **Spec coverage** —
   - Tag tone extension (4 new tones) → Task 1 Step 1.1
   - Tag leading slot → Task 1 Step 1.1
   - Tag stories matrix → Task 1 Step 1.3
   - Compound priority resolution → Task 2 Step 2.1
   - Compound copy mapping → Task 2 Step 2.1
   - Compound active-variant Popover → Task 2 Step 2.1
   - Compound error-variant tap → Task 2 Step 2.1
   - Tier-aware render → Task 2 Step 2.1
   - 10-story matrix → Task 3 Step 3.1
   - Inventory promotion → Task 3 Step 3.4
   - Followups → Task 3 Step 3.5

2. **Type consistency check** —
   - `GenerationPhase` literal matches between view (`reasoning` / `generating-narrative` / `classifying` / `closing-chapter`) and stories
   - `ErrorState` discriminant codes (`embedder-offline` / `classifier-offline`) match across view + stories + followups
   - `onErrorTap(code)` parameter type matches `ErrorState['code']`

3. **Placeholder scan** —
   - No TBD / TODO / "implement later"
   - Every code block is complete (no `...`)
   - Exact file paths everywhere

## Out-of-scope reminders

These items live in the design doc's "Out of scope" section and must NOT be implemented in this plan:

- Real pipeline event subscription
- Real memory error observability
- Story Settings · Memory routing target (caller wires)
- Animation polish on the active-phase spinner
- Banner affordance for chapter-close pipeline
- Top-bar chrome integration on each in-story screen
- vitest module / colocated test file for the compound
