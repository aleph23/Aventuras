import { Plus } from 'lucide-react-native'
import { type ReactNode } from 'react'
import { View } from 'react-native'

import { Toolbar, type ToolbarSearchProps } from '@/components/compounds/toolbar'
import { IconAction } from '@/components/ui/icon-action'
import { cn } from '@/lib/utils'

/**
 * EntityListPane — master list pane shell for World + Plot.
 *
 * Owns:
 * - **Kind-selector row chrome** — `kindSelector` slot left, `[+]`
 *   icon-action right. Tooltip / a11y label come from `addAction.label`.
 * - **Toolbar composition** — wraps `search` in
 *   [`Toolbar`](../compounds/toolbar.tsx). `filterChips` slot is fed
 *   into `Toolbar.FilterChips`; optional `sortControl` ReactNode goes
 *   into the `Toolbar` children (Toolbar slot-detects by type, so an
 *   arbitrary ReactNode lands as `others` rather than the typed Sort
 *   slot — that's fine because the consumer typically passes a
 *   `Toolbar.Sort` element directly).
 * - **List / EmptyState switch** — `isEmpty` flips the body between
 *   `children` (the consumer-rendered virtualized list) and
 *   `emptyState`.
 * - **Width** — `w-full`; cross-tier collapse is
 *   [`MasterDetailLayout`](./master-detail-layout.tsx)'s territory
 *   (not yet built; see component-inventory.md).
 *
 * Does NOT own:
 * - Row rendering — consumer's virtualization stack
 *   (`@tanstack/react-virtual` on web, `FlatList` on native per the
 *   2026-05-06 Autocomplete pick).
 * - Active-filter → `addAction.label` coupling — consumer derives the
 *   label upstream from the active chip.
 * - Kind enum knowledge — `kindSelector` is a ReactNode so the shell
 *   stays free of characters / threads / etc.
 *
 * Spec: [`docs/explorations/2026-05-14-shells-design.md → EntityListPane`](../../docs/explorations/2026-05-14-shells-design.md#shell-2--entitylistpane).
 */

type EntityListPaneProps = {
  /**
   * Dropdown trigger ("Characters ▾", "Threads ▾"). World uses
   * `Select`; Plot uses `Tabs.Segment` for the 2-way Threads /
   * Happenings toggle. Optional — a future single-kind list could
   * omit it.
   */
  kindSelector?: ReactNode

  /**
   * Right-anchored on the kind-selector row. Visual: minimalist `[+]`
   * icon-action per
   * [icon-actions.md](../../docs/ui/patterns/icon-actions.md)
   * (always-visible-muted + hover-brighten). Tooltip / a11y label
   * come from `addAction.label`.
   */
  addAction: {
    label: string
    onPress: () => void
  }

  /**
   * Search state — forwarded to `Toolbar.Search`. Mirrors the
   * Toolbar primitive's prop shape exactly so the shell is a pure
   * pass-through, not a re-validation layer.
   */
  search: ToolbarSearchProps

  /**
   * Chip strip — consumer renders chips with their own active state.
   * Active chip is what drives `addAction.label` upstream.
   */
  filterChips: ReactNode

  /**
   * Optional sort control (lore list uses this). Position is handled
   * by `Toolbar` — pass a `Toolbar.Sort` element (or any ReactNode;
   * Toolbar tolerates pass-throughs).
   */
  sortControl?: ReactNode

  /**
   * The virtualized list — consumer renders rows. Shell wraps in a
   * scroll container with width pin.
   */
  children: ReactNode

  /**
   * Shown when `isEmpty` is true. Required — every consumer must
   * have a designed empty state. EmptyState slot conventionally
   * includes a labeled CTA (e.g. "+ Add your first character")
   * since the minimalist `[+]` icon-action is too subtle on an
   * empty pane.
   */
  emptyState: ReactNode

  /**
   * Consumer derives. Shell uses this to switch list vs empty
   * rendering.
   */
  isEmpty: boolean

  className?: string
}

export function EntityListPane({
  kindSelector,
  addAction,
  search,
  filterChips,
  sortControl,
  children,
  emptyState,
  isEmpty,
  className,
}: EntityListPaneProps) {
  return (
    <View className={cn('w-full flex-1 flex-col gap-3 bg-bg-base p-3', className)}>
      {/* Kind-selector row — selector left (flex-1), [+] icon-action
          right. Always rendered for layout stability even when
          kindSelector is undefined; the [+] is the load-bearing
          affordance. */}
      <View className="flex-row items-center gap-2">
        <View className="min-w-0 flex-1">{kindSelector}</View>
        <IconAction icon={Plus} label={addAction.label} onPress={addAction.onPress} />
      </View>

      {/* Toolbar — composes search + filter chips + optional sort.
          Toolbar handles the cross-tier overflow rule (single row on
          wide containers, stacked on narrow). */}
      <Toolbar>
        <Toolbar.Search {...search} />
        <Toolbar.FilterChips>{filterChips}</Toolbar.FilterChips>
        {sortControl}
      </Toolbar>

      {/* Body — list or empty state. flex-1 so the inner scroll
          container fills available height; consumer's virtualization
          stack owns the scroll surface. */}
      <View className="min-h-0 flex-1">{isEmpty ? emptyState : children}</View>
    </View>
  )
}

export type { EntityListPaneProps }
