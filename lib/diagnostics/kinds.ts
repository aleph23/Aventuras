// Source of truth for the log-kind namespace. Adding a subsystem is a one-line
// change here; the Logs-tab UI iterates this union directly (slice 1.4+).
export type LogSubsystem =
  | 'pipeline'
  | 'action_layer'
  | 'classifier'
  | 'retrieval'
  | 'provider'
  | 'embedder'
  | 'translation'
  | 'memory'

export type LogKind = `${LogSubsystem}.${string}`

// Applied to the event-name half (after the first dot) at runtime in dev builds.
export const EVENT_NAME_REGEX = /^[a-z][a-z0-9_]*$/

export function eventNameOf(kind: string): string {
  const dot = kind.indexOf('.')
  return dot === -1 ? '' : kind.slice(dot + 1)
}
