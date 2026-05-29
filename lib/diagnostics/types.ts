import type { LogKind } from './kinds'

export type LogLevel = 'debug' | 'warn' | 'error'

export type LogEntry = {
  id: string
  emittedAt: number
  level: LogLevel
  kind: LogKind
  fields: Record<string, unknown>
  actionId?: string
}

// Stub shapes from docs/observability.md so slices 1.4 / 1.5 have a target to
// fill. Canonical spec wins if these gain fields during 1.4 / 1.5 authoring.
export type HttpCall = {
  id: string
  startedAt: number
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestBody?: unknown
  source?: string
  actionId?: string
  state: 'in_flight' | 'completed' | 'failed'
  endedAt?: number
  durationMs?: number
  status?: number | null
  responseHeaders?: Record<string, string>
  responseBody?: unknown
  streamed?: boolean
  error?: string
}

export type PhaseEvent = {
  phase: string
  kind: 'enter' | 'exit'
  at: number
  durationMs?: number
}

export type TurnCapture = {
  actionId: string
  branchId: string
  targetEntryId?: string
  startedAt: number
  endedAt?: number
  outcome?: 'completed' | 'aborted' | 'failed'
  outcomeReason?: string
  phaseEvents: PhaseEvent[]
  classifierOutputRaw?: unknown
}
