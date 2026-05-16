import { useState } from 'react'
import { ScrollView, View } from 'react-native'

import { EntryCard, type EntryCardProps } from '@/components/compounds/entry-card'
import { ThemePicker } from '@/components/foundations/sections/theme-picker'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

const aiMeta = { tokens: { reply: 312, reasoning: 87 } }

export default function EntryCardDevRoute() {
  const [editing, setEditing] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [lastAction, setLastAction] = useState<string | null>(null)

  const log = (action: string) => setLastAction(action)

  const startEdit = (id: string, initial: string) => {
    setEditing(id)
    setDrafts((d) => ({ ...d, [id]: initial }))
  }
  const commitEdit = (id: string) => {
    log(`Committed edit on ${id}: ${(drafts[id] ?? '').slice(0, 40)}…`)
    setEditing(null)
  }
  const cancelEdit = () => {
    log('Canceled edit')
    setEditing(null)
  }
  const updateDraft = (id: string, next: string) => setDrafts((d) => ({ ...d, [id]: next }))

  const editProps = (id: string, originalContent: string): Partial<EntryCardProps> =>
    editing === id
      ? {
          editing: true,
          content: drafts[id] ?? originalContent,
          onContentChange: (next) => updateDraft(id, next),
          onCommitEdit: () => commitEdit(id),
          onCancelEdit: cancelEdit,
        }
      : { onEdit: () => startEdit(id, originalContent) }

  const opening = 'The road from Ironshore is empty for a hundred miles.'
  const userTurn = 'I draw my sword and step toward the figure.'
  const aiTurn =
    'The figure raises a single gloved hand. The air thickens around your blade — you feel the metal hum, then go still in your grip.'

  return (
    <ScrollView
      className="flex-1 bg-bg-base"
      // RN's default `keyboardShouldPersistTaps` is `"never"`,
      // which consumes the first tap when the soft keyboard is
      // open — buttons inside an editing EntryCard would need two
      // taps (one to dismiss keyboard, one to fire onPress).
      // `"handled"` lets taps on registered onPress handlers fire
      // AND dismiss the keyboard in a single tap. Production
      // screens hosting EntryCard's edit mode must set this.
      keyboardShouldPersistTaps="handled"
    >
      <ThemePicker />
      <View className="flex-col gap-10 p-4">
        <View className="gap-3">
          <Heading level={2}>Reader narrative — interactive</Heading>
          <Text size="sm" variant="muted">
            Click pencil to enter edit mode. Edit-host wires save/cancel via callbacks; this dev
            route mirrors that.
          </Text>
          {lastAction != null ? (
            <Text size="xs" variant="muted">
              Last: {lastAction}
            </Text>
          ) : null}
          <View className="flex-col gap-3">
            <EntryCard
              kind="opening"
              content={opening}
              worldTimeLabel="Day 1 · 06:00"
              meta={{ tokens: { reply: 89 } }}
              onBranch={() => log('Branch from opening')}
              onFlipEra={() => log('Flip era on opening')}
              {...editProps('opening', opening)}
            />
            <EntryCard
              kind="user"
              content={userTurn}
              worldTimeLabel="Day 1 · 09:14"
              onDelete={() => log('Delete user turn')}
              onFlipEra={() => log('Flip era on user')}
              {...editProps('user', userTurn)}
            />
            <EntryCard
              kind="ai"
              content={aiTurn}
              worldTimeLabel="Day 1 · 09:14"
              meta={aiMeta}
              reasoning="Lean on supernatural restraint over combat — telegraph 'cannot win this'."
              onRegen={() => log('Regen ai')}
              onBranch={() => log('Branch from ai')}
              onDelete={() => log('Delete ai')}
              onFlipEra={() => log('Flip era on ai')}
              {...editProps('ai', aiTurn)}
            />
            <EntryCard
              kind="streaming"
              streamingPhase="reasoning"
              content="Considering whether the warden answers in words or violence…"
            />
          </View>
        </View>

        <View className="gap-3">
          <Heading level={2}>System error</Heading>
          <Text size="sm" variant="muted">
            Inline retry/dismiss buttons inside the bubble; no top-right cluster, no world-time
            footer.
          </Text>
          <EntryCard
            kind="system"
            content="Generation failed: provider returned 503."
            detail="The model service is temporarily unavailable."
            onRetry={() => log('Retry')}
            onDismiss={() => log('Dismiss')}
          />
        </View>

        <View className="gap-3">
          <Heading level={2}>Disabled state (generation in flight)</Heading>
          <Text size="sm" variant="muted">
            All actions disabled with the host&apos;s reason. Hover an action on web for the
            tooltip.
          </Text>
          <EntryCard
            kind="ai"
            content={aiTurn}
            worldTimeLabel="Day 1 · 09:14"
            meta={aiMeta}
            disabled
            disabledReason="Generation is in flight. Cancel to edit."
            onEdit={() => {}}
            onDelete={() => {}}
            onRegen={() => {}}
            onBranch={() => {}}
            onFlipEra={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  )
}
