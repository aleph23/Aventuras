import * as React from 'react'
import { Platform, Pressable, View } from 'react-native'

import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

type RecentlyClassified = 'fresh' | 'fading'

type ListRowProps = {
  /** Primary text — entity name, thread title, happening summary. */
  label: string
  /**
   * Optional secondary line below the label — short blurb,
   * description, role label. Truncates to two lines when long.
   * Leave undefined to render a single-line row.
   */
  description?: string
  /**
   * Slot before the label — typically `<EntityKindIcon>` for entity
   * rows. Renders inside the row's tap surface so taps on it still
   * fire `onPress`. Surfaces without a kind concept leave this null.
   */
  leading?: React.ReactNode
  /**
   * Inline-after-label slot — typically the gold lead-badge pill
   * for the character lead. Sits adjacent to the label text on the
   * same line.
   */
  meta?: React.ReactNode
  /**
   * Trailing-edge slot — typically a status pill. Per-domain
   * components own the pill itself (entity status enum ≠ thread
   * status enum); ListRow only slots it.
   */
  trailing?: React.ReactNode
  /**
   * Scene-presence channel — 3 px green left-edge stripe. Per the
   * channel separation rule in entity.md, left-edge is reserved
   * for this signal alone.
   */
  inScene?: boolean
  /**
   * Recently-classified channel — info-blue background tint.
   * `'fresh'` is the just-touched state; `'fading'` decays it via
   * reduced opacity. Spec lives in entity.md → Recently-classified
   * row accent.
   */
  recentlyClassified?: RecentlyClassified
  /**
   * Master-detail selection state. Surfaces a depressed-surface
   * background to indicate the current row. Recently-classified
   * outranks selection when both fire — transient signal beats
   * persistent.
   */
  selected?: boolean
  onPress?: () => void
  disabled?: boolean
  className?: string
}

// Aventuras's pan-domain list row. Carries four orthogonal signals
// per docs/ui/patterns/entity.md → Entity row indicators:
//
//   1. Lead badge (slotted via `meta`)
//   2. Status pill (slotted via `trailing`)
//   3. Scene-presence (left-edge stripe, typed prop `inScene`)
//   4. Recently-classified (background tint, typed prop)
//
// Design rule: invariant channels are typed props so every row has
// the same structural commitment; per-domain content (kind icon,
// status pill, lead badge) is slotted because the visual primitives
// differ per surface. `selected` and `recentlyClassified` can both
// fire — recently-classified wins via class order so the transient
// signal stays visible.
export function ListRow({
  label,
  description,
  leading,
  meta,
  trailing,
  inScene,
  recentlyClassified,
  selected,
  onPress,
  disabled,
  className,
}: ListRowProps) {
  const interactive = !disabled && onPress != null
  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      aria-label={label}
      aria-selected={selected}
      className={cn(
        'relative flex-row items-center gap-3 px-row-x-md py-row-y-md',
        // Selection background — depressed-surface tint. Visible
        // when no recently-classified tint is fighting for the bg
        // channel; when both fire, the tint overrides the sunken
        // bg via class order, but the right-edge accent stripe
        // (rendered below) keeps selection readable regardless.
        selected && 'bg-bg-sunken',
        // Recently-classified fresh — full-strength tint from the
        // token. Fading is rendered as a semi-transparent overlay
        // behind content (see below) so only the background dims;
        // text + icons remain at full opacity per the
        // 4.5:1 contrast guarantee in
        // docs/ui/foundations/color.md → Recently-classified slot.
        recentlyClassified === 'fresh' && 'bg-recently-classified-bg',
        // Press / hover state-layer tints. Skip on disabled.
        interactive && 'active:bg-tint-press',
        Platform.select({ web: interactive ? 'cursor-pointer hover:bg-tint-hover' : '' }),
        disabled && 'opacity-50',
        Platform.select({ web: disabled && 'cursor-not-allowed' }),
        className,
      )}
    >
      {/* Fading-state overlay. Renders the fresh-tint color at 50%
          opacity behind the row's content, leaving text + icons
          fully opaque. This is the cross-platform equivalent of
          web's `color-mix(in srgb, var(--recently-classified-bg)
          50%, transparent)` — same visual result, works on RN
          natively without a color-mix polyfill. Locked alpha is
          0.5 per the foundation doc (empirically picked). */}
      {recentlyClassified === 'fading' ? (
        <View
          className="absolute inset-0 bg-recently-classified-bg opacity-50"
          aria-hidden
          pointerEvents="none"
        />
      ) : null}
      {/* Scene-presence stripe — absolute so it doesn't push content;
          spans the full row height by claiming top-0 / bottom-0. */}
      {/* Channel stripes — left edge for scene-presence, right
          edge for selection. Both are 3 px, absolute-positioned,
          pointerEvents="none" so the row's Pressable still owns
          the press surface. The two-edge split is load-bearing:
          recently-classified owns the row body (bg tint), so
          neither selection nor scene-presence can use the body
          channel without contending. Edge stripes always read
          regardless of what's happening on the body. */}
      {inScene ? (
        <View
          className="absolute bottom-0 left-0 top-0 w-[3px] bg-success"
          aria-hidden
          pointerEvents="none"
        />
      ) : null}
      {selected ? (
        <View
          className="absolute bottom-0 right-0 top-0 w-[3px] bg-accent"
          aria-hidden
          pointerEvents="none"
        />
      ) : null}

      {leading != null ? <View className="shrink-0">{leading}</View> : null}

      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="shrink font-medium" numberOfLines={1}>
            {label}
          </Text>
          {meta}
        </View>
        {description != null ? (
          <Text variant="muted" size="sm" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      {trailing != null ? <View className="shrink-0">{trailing}</View> : null}
    </Pressable>
  )
}

export type { ListRowProps, RecentlyClassified }
