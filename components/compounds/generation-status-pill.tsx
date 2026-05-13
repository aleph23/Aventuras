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
  // Imperative ref exposes `close()` — same pattern as importer-menu.tsx.
  const triggerRef = React.useRef<React.ComponentRef<typeof PopoverTrigger>>(null)

  // Priority: active generation > error state > hidden.
  if (activePhase != null) {
    const isPhone = tier === 'phone'
    // Tag doesn't forward refs, so asChild cannot be used safely with the
    // Slot contract. PopoverTrigger renders its own Pressable wrapper;
    // Tag (no onPress prop) renders a plain View inside it — purely visual.
    // Popover is uncontrolled: rn-primitives Root doesn't accept an `open`
    // prop. Dismissal is driven via triggerRef.current?.close().
    return (
      <Popover>
        <PopoverTrigger ref={triggerRef}>
          <Tag tone="accent" leading={<Spinner size="sm" colorSlot="--accent-fg" />}>
            {isPhone ? null : PHASE_COPY[activePhase]}
          </Tag>
        </PopoverTrigger>
        <PopoverContent>
          <View className="gap-1">
            <Button
              variant="secondary"
              onPress={() => {
                onCancel()
                triggerRef.current?.close()
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
