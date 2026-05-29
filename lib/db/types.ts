import type { appSettings, branches, pipelineRuns, stories, storyEntries } from './schema'

export type Story = typeof stories.$inferSelect
export type NewStory = typeof stories.$inferInsert

export type Branch = typeof branches.$inferSelect
export type NewBranch = typeof branches.$inferInsert

export type StoryEntry = typeof storyEntries.$inferSelect
export type NewStoryEntry = typeof storyEntries.$inferInsert

export type AppSettings = typeof appSettings.$inferSelect
export type NewAppSettings = typeof appSettings.$inferInsert

export type PipelineRun = typeof pipelineRuns.$inferSelect
export type NewPipelineRun = typeof pipelineRuns.$inferInsert
