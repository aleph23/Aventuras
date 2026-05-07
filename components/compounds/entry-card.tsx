import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Book,
  Brain,
  GitBranch,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react-native'
import * as React from 'react'
import { View } from 'react-native'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { IconAction } from '@/components/ui/icon-action'
import { Text } from '@/components/ui/text'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type EntryKind = 'user' | 'ai' | 'opening' | 'system' | 'streaming'

type EntryMeta = {
  tokens: { reply: number; reasoning?: number }
}

type EntryCardProps = {
  kind: EntryKind
  content: string
  /** Pre-formatted by the host's calendar renderer; opaque to the compound. */
  worldTimeLabel?: string

  onEdit?: () => void
  /** Not provided for `opening` (block-delete) or `system`/`streaming`. */
  onDelete?: () => void

  // ai / opening:
  meta?: EntryMeta
  reasoning?: string
  /** ai only. */
  onRegen?: () => void
  /** ai, opening. */
  onBranch?: () => void
  /** user, ai, opening. Host hides when active calendar has no eras. */
  onFlipEra?: () => void

  /** Streaming-only — drives the top-line indicator. */
  streamingPhase?: 'reasoning' | 'reply'

  // system-only:
  detail?: string
  onRetry?: () => void
  onDismiss?: () => void

  // edit-restrictions (uniform):
  disabled?: boolean
  disabledReason?: string

  // edit mode (host-controlled):
  editing?: boolean
  onContentChange?: (next: string) => void
  onCommitEdit?: () => void
  onCancelEdit?: () => void

  className?: string
}

// Bubble styling per kind. Spec doc uses tokens that don't exist
// (`bg-highlight`, `bg-region`, `border-line-soft`); mapped to live
// project tokens. user = recessed bg (input), ai/opening = raised
// bg (response), system = warning border, streaming = dashed border
// over ai bg. Visual identity session can swap these for purpose-
// built tokens later.
const KIND_BUBBLE: Record<EntryKind, string> = {
  user: 'bg-bg-sunken border-border',
  ai: 'bg-bg-raised border-border',
  opening: 'bg-bg-raised border-border',
  system: 'bg-bg-base border-warning',
  streaming: 'bg-bg-raised border-border border-dashed',
}

export function EntryCard({
  kind,
  content,
  worldTimeLabel,
  onEdit,
  onDelete,
  meta,
  reasoning,
  onRegen,
  onBranch,
  onFlipEra,
  streamingPhase,
  detail,
  onRetry,
  onDismiss,
  disabled,
  disabledReason,
  editing,
  onContentChange,
  onCommitEdit,
  onCancelEdit,
  className,
}: EntryCardProps) {
  // Reasoning toggle is internal state — no external override. Brain
  // icon click flips it. Hidden entirely when no reasoning data and
  // not actively streaming reasoning.
  const [expanded, setExpanded] = React.useState(false)
  const hasReasoning = reasoning != null && reasoning.length > 0
  const isStreamingReasoning = kind === 'streaming' && streamingPhase === 'reasoning'

  // Action cluster visibility. Hidden during edit, system, streaming.
  // Per pattern doc — system uses inline retry/dismiss buttons in
  // its content slot; streaming has no per-entry actions (cancel
  // lives on the composer, not the bubble).
  const showActions = !editing && kind !== 'system' && kind !== 'streaming'

  // World-time footer visibility. Spec says hidden for system /
  // streaming, AND when worldTimeLabel undefined. Edit mode keeps
  // the footer per spec (only brain/reasoning/cluster hide).
  const showWorldTime = worldTimeLabel != null && kind !== 'system' && kind !== 'streaming'

  return (
    <View
      className={cn(
        'relative w-full rounded-lg border p-4',
        KIND_BUBBLE[kind],
        // Disabled gate uniform with other compounds — opacity
        // dim plus the host-supplied reason for hover tooltip on
        // web (handled at action-button level since the bubble
        // itself isn't a tap target).
        disabled && 'opacity-60',
        className,
      )}
      // Reserve right-edge space when an absolute action cluster
      // OR world-time footer renders, so prose doesn't slide under
      // them. pr-20 (80 px) on the bubble carves out the cluster
      // column; the footer right-3 (12 px) sits within that.
    >
      {/* Top line — varies per kind. Reserves right-pad when the
          action cluster is visible so a long meta line (model name
          + tokens) doesn't slide under the absolute cluster. */}
      <View className={cn('mb-2 flex-row items-center gap-2', showActions && 'pr-28')}>
        {kind === 'user' ? (
          <View className="rounded-sm bg-fg-primary px-2 py-0.5">
            <Text size="xs" className="font-medium text-bg-base">
              You
            </Text>
          </View>
        ) : kind === 'system' ? (
          <>
            <Icon as={AlertTriangle} size="sm" className="shrink-0 text-warning" />
            <Text size="xs" className="font-medium text-warning">
              System
            </Text>
          </>
        ) : kind === 'streaming' ? (
          <>
            <Icon as={Brain} size="sm" className="shrink-0 text-fg-muted" />
            <Text size="xs" variant="muted">
              {streamingPhase === 'reasoning' ? 'Thinking…' : 'Generating…'}
            </Text>
            <Icon as={ArrowRight} size="sm" className="shrink-0 text-fg-muted" />
          </>
        ) : (
          // ai / opening — meta line. Book glyph + brain (toggle
          // reasoning, only when present) + tokens. Model id stays
          // off the entry per data-model — it's persisted as
          // metadata for provenance but not surfaced in the
          // narrative chrome. shrink-0 on the raw <Icon> because
          // it doesn't bake that in (only <IconAction> does); flex
          // children shrink by default, which collapses the SVG
          // on narrow rows.
          <>
            <Icon as={Book} size="sm" className="shrink-0 text-fg-muted" />
            {hasReasoning ? (
              <IconAction
                icon={Brain}
                label={expanded ? 'Hide reasoning' : 'Show reasoning'}
                size="sm"
                onPress={() => setExpanded((v) => !v)}
              />
            ) : null}
            {meta?.tokens != null ? (
              // leading-none collapses the line-height to the
              // font-size so the visible glyph centers on the same
              // vertical line as the book icon and IconAction
              // brain. Without this, text-xs's default line-height
              // (1.33×) leaves descender space that pulls the
              // visible glyph above the row's geometric center.
              <Text size="xs" variant="muted" className="leading-none">
                {meta.tokens.reply} tokens
                {meta.tokens.reasoning != null ? ` (+${meta.tokens.reasoning} reasoning)` : ''}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {/* Reasoning body — collapsible. Hidden during edit per spec
          (edit-mode focuses on content only). Indented with a left
          accent rule to read as quoted-meta. v1 toggles via display:
          none / block; the spec calls for a height-clamp animation
          which is deferred to a polish pass — followup if needed. */}
      {hasReasoning && expanded && !editing ? (
        <View className="mb-3 border-l-2 border-border pl-3">
          <Text size="sm" variant="muted" className="italic">
            {reasoning}
          </Text>
        </View>
      ) : null}

      {/* Live-stream reasoning preview — when actively streaming the
          reasoning phase, surface what's coming through so the user
          sees the model "thinking". Same visual shape as the static
          reasoning body. */}
      {isStreamingReasoning && content.length > 0 ? (
        <View className="mb-3 border-l-2 border-border pl-3">
          <Text size="sm" variant="muted" className="italic">
            {content}
          </Text>
        </View>
      ) : null}

      {/* Content slot — textarea in edit mode, system error layout
          for system kind, prose otherwise. Streaming-reply phase
          renders content as it streams (same prose path); the
          reasoning-phase content is already shown in the live
          preview block above, so we skip duplicate render. */}
      {editing ? (
        <View className="gap-2">
          <Textarea
            value={content}
            onChangeText={onContentChange}
            editable={!disabled}
            autoFocus
            aria-label="Edit entry content"
            // Esc cancels in-flight edits — universal text-edit
            // UX. Commit-via-keyboard (Cmd/Ctrl+Enter) is host-
            // bindable but skipped here since RN's onKeyPress is
            // unreliable for modifier combos across platforms.
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'Escape') onCancelEdit?.()
            }}
          />
          {/* Inline Save/Cancel — narrative-pattern UX (cf.
              Slack/Discord edit). Spec forbids the full `<SaveBar>`
              compound inside the card; these are simple buttons,
              NOT a SaveBar. Host can still mount a page-level
              SaveBar in parallel if it wants cross-entry dirty-
              state tracking.

              Mobile contract: the host's ScrollView MUST set
              `keyboardShouldPersistTaps="handled"`. Without it,
              the first tap on Save/Cancel only dismisses the soft
              keyboard; user has to tap a second time to fire the
              button. The compound can't fix this on its own — the
              behavior is owned by the parent ScrollView. */}
          <View className="flex-row justify-end gap-2">
            <Button variant="ghost" size="sm" onPress={onCancelEdit} disabled={disabled}>
              <Text>Cancel</Text>
            </Button>
            <Button variant="primary" size="sm" onPress={onCommitEdit} disabled={disabled}>
              <Text>Save</Text>
            </Button>
          </View>
        </View>
      ) : kind === 'system' ? (
        <View className="gap-3">
          <Text size="sm">{content}</Text>
          {detail != null ? (
            <Text size="xs" variant="muted">
              {detail}
            </Text>
          ) : null}
          {(onRetry != null || onDismiss != null) && (
            <View className="flex-row gap-2">
              {onRetry != null ? (
                <Button variant="secondary" size="sm" onPress={onRetry} disabled={disabled}>
                  <Icon as={RefreshCw} size="sm" />
                  <Text>Retry</Text>
                </Button>
              ) : null}
              {onDismiss != null ? (
                <Button variant="ghost" size="sm" onPress={onDismiss} disabled={disabled}>
                  <Icon as={X} size="sm" />
                  <Text>Dismiss</Text>
                </Button>
              ) : null}
            </View>
          )}
        </View>
      ) : kind === 'streaming' &&
        streamingPhase === 'reasoning' ? // Reasoning-phase streaming — content is already shown in
      // the live preview block above. The reply slot stays empty
      // until the stream transitions to 'reply'.
      null : (
        <Text size="sm">{content}</Text>
      )}

      {/* Action cluster — absolute, anchored to align with the
          meta line. Right-2 hugs the corner; top-4 matches the
          bubble's `p-4` so the cluster's icon row shares a baseline
          with the meta-line book/brain/tokens. (Earlier `top-2`
          had the cluster floating 8 px above the meta line, which
          read as misaligned.) Per icon-actions pattern: 0.55 rest
          opacity, 1.0 on row hover. */}
      {showActions ? (
        <View className="absolute right-2 top-4 flex-row items-center gap-0.5">
          {onEdit != null ? (
            <IconAction
              icon={Pencil}
              label="Edit entry"
              size="sm"
              onPress={onEdit}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          ) : null}
          {onRegen != null && kind === 'ai' ? (
            <IconAction
              icon={RefreshCw}
              label="Regenerate"
              size="sm"
              onPress={onRegen}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          ) : null}
          {onBranch != null && (kind === 'ai' || kind === 'opening') ? (
            <IconAction
              icon={GitBranch}
              label="Branch from here"
              size="sm"
              onPress={onBranch}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          ) : null}
          {onFlipEra != null ? (
            <IconAction
              icon={ArrowLeftRight}
              label="Flip era"
              size="sm"
              onPress={onFlipEra}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          ) : null}
          {onDelete != null && kind !== 'opening' ? (
            <IconAction
              icon={Trash2}
              label="Delete entry"
              size="sm"
              variant="destructive"
              onPress={onDelete}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          ) : null}
        </View>
      ) : null}

      {/* World-time footer — bottom-right of bubble. Read-only; the
          manual-correction-as-click-to-edit affordance is parked
          (see followups). */}
      {showWorldTime ? (
        <View className="mt-3 flex-row justify-end">
          <Text size="xs" variant="muted">
            {worldTimeLabel}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export type { EntryCardProps, EntryKind, EntryMeta }
