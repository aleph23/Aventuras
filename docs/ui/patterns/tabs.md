# Tabs pattern

Horizontal segmented navigation between sibling sections of the
same surface. Used for entity / lore / plot detail-pane navigation
(Overview / Identity / Connections / Settings / Assets / etc.) —
not for mode toggles.

Sister patterns: [`forms.md → Select primitive`](./forms.md#select-primitive)
(when tabs collapse to a Select dropdown / segment on narrow tiers,
or when a surface picks between modes rather than navigating
sibling sections).

Used by:

- [Entity detail panes](./entity.md#tab-architecture) — World panel
  - Plot panel + Browse rail entity peek.
- [Plot panel](../screens/plot/plot.md) — happenings + threads
  detail panes.
- [World panel](../screens/world/world.md#tabs--per-kind-composition).
- [Diagnostics Hub](../screens/diagnostics/diagnostics.md#tab-strip)
  — five tabs (Memory probe, Per-turn inspector, Call log, Logs,
  Delta log).
- [App Settings → Story Defaults → Suggestion categories](../screens/app-settings/app-settings.md#suggestion-categories)
  — Adventure / Creative per-mode tabs.
- Anywhere else a surface needs sibling-section navigation.

## Scope

The Tabs primitive renders the **Tab strip case only**. Cross-tier
overflow / scroll / wrap is handled by substituting the Select
primitive at narrow widths — see
[Tab-strip overflow rule](#tab-strip-overflow-rule) below for the
per-tier dispatch.

## Tab-strip overflow rule

Tab navigation can take three render forms across tiers:

1. **Tab strip** — the desktop primitive (this doc). Used on desktop
   at every count, and on tablet when count ≤ 3.
2. **Select segment** — bordered horizontal button group. Used on
   phone when count ≤ 2 per the Select primitive's auto-derivation
   cascade ([forms.md → Select primitive](./forms.md#select-primitive)).
3. **Select dropdown** — collapsed picker chip. Used on phone when
   count ≥ 3, and on tablet when count > 3.

**Per-tier dispatch:**

| Tier    | Count ≤ 2      | Count = 3       | Count > 3       |
| ------- | -------------- | --------------- | --------------- |
| Desktop | Tab strip      | Tab strip       | Tab strip       |
| Tablet  | Tab strip      | Tab strip       | Select dropdown |
| Phone   | Select segment | Select dropdown | Select dropdown |

**Per-kind verification** (count column reflects the largest kinds
in the app):

| Kind                  | Tabs | Desktop   | Tablet          | Phone           |
| --------------------- | ---- | --------- | --------------- | --------------- |
| Threads               | 2    | Tab strip | Tab strip       | Select segment  |
| Lore                  | 3    | Tab strip | Tab strip       | Select dropdown |
| Happenings            | 4    | Tab strip | Select dropdown | Select dropdown |
| Location/Item/Faction | 7    | Tab strip | Select dropdown | Select dropdown |
| Character             | 8    | Tab strip | Select dropdown | Select dropdown |

**Threshold of 3 on tablet** comes from wireframe review at iPad
portrait (768 px outer → ~430 px detail pane). The 4-tab happenings
pane with involvement / awareness count chips wrapped vertically at
that width, so the threshold tightened from an initial draft of 5
to 3. The 3 cutoff falls between lore (3, fits) and happenings (4,
doesn't), so no kind sits on the boundary.

**Threshold of 2 on phone** is the Select primitive's existing
mobile-cardinality cutoff, applied unchanged.

**Surface primitives for the Select branches:**

- **Select segment** — flat inline rendering at every tier; same
  shape as Plot's `[Threads | Happenings]` segment toggle and the
  wizard's narration-mode segment.
- **Select dropdown on tablet** — anchored Popover (no
  edge-clipping risk at tablet widths).
- **Select dropdown on phone** — Sheet (short) per
  [`layout.md → Surface bindings`](../foundations/mobile/layout.md#surface-bindings--existing-app-surfaces).
  Aligns with Actions menu, model picker, and calendar picker —
  small chrome popovers route to Sheet on phone for the same
  native-pattern reason.

**Tier-aware substitution, not a new primitive.** Tab strip and
Select stay distinct primitives. The detail-pane component picks
which to render based on tier × tab count. Same shape as the
Reader rail's tier-aware swap (in-place expand on desktop → Sheet
on phone — same data, different primitive).

**Consumer's decision is binary.** Either render Tab strip (desktop
always; tablet when count ≤ 3), or hand the tab list to the Select
primitive and let its cascade pick segment vs dropdown. No new
logic inside Select; no new primitive.

## Style — underline

Tabs render with a **bottom-border underline** on the active tab,
not a pill background. Underline conveys "navigation between parts
of the same thing"; pill conveys "toggle between modes." This app
uses the Select primitive's segment branch for mode toggles, so
tabs stay underline-shaped for sibling-section navigation.

Visual contract:

- **Active** — `border-bottom: 2px` in `--fg-primary`, label
  `--fg-primary` weight `font-medium`.
- **Inactive** — `border-bottom: 2px transparent`, label
  `--fg-muted`.
- **Hover (web)** — label `--fg-primary` (matches active without
  the underline). `transition-colors` per existing motion tokens.
- **Disabled** — `opacity-50`, no hover response.
- **Focus-visible (web)** — ring per the project's `--focus-ring`
  slot.

The strip itself sits over a `border-b border-border` line so the
active-tab underline lands flush against a continuous baseline.

Sentence-case label text. Wireframes show uppercase + letter-spacing
but that's wireframe decoration, not load-bearing.

## Counts

Optional per-tab `count?: number` prop on `TabsTrigger`. Renders as
muted-small text after the label (4px gap). When absent, label
renders alone.

```tsx
<TabsTrigger value="connections" count={3}>Connections</TabsTrigger>
<TabsTrigger value="overview">Overview</TabsTrigger>
```

The primitive renders the number as-is — consumers format `99+`
themselves if they want clamping. Disabled-state `opacity-50`
applies uniformly to label + count.

**Cross-primitive parity.** When tab navigation substitutes to the
Select dropdown branch on narrow tiers, option labels in the open
Select sheet should preserve the same counts so the user sees
consistent information across primitives. Wire counts through to
the Select option list when building the substitution.

## API

Four parts, scaffolded from the rn-reusables baseline at
[`components/ui/tabs.tsx`](../../../components/ui/tabs.tsx):

- `Tabs` — root, `value` / `onValueChange`-controlled.
- `TabsList` — strip container. Reshape: drop the baseline's
  pill container; replace with a flex row + `border-b
border-border`.
- `TabsTrigger` — individual tab. Reshape: drop pill background;
  add the underline state contract above; add `count` prop.
- `TabsContent` — body container, renders only when matching tab
  is active. Leave as baseline.

`@rn-primitives/tabs` handles the radix-on-web / native dispatch
underneath; no additional substrate needed.

## Storybook

`Primitives/Tabs` with stories: basic 3-tab strip, with-counts (4
tabs, mixed presence), disabled tab, ThemeMatrix per-theme contrast,
KindKitchenSink (8-tab character detail-pane simulation to verify
strip handles realistic counts at desktop tier).
