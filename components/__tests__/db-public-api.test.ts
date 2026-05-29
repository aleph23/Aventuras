import { describe, expect, it } from 'vitest'

import {
  APP_SETTINGS_DEFAULTS,
  APP_SETTINGS_SINGLETON_ID,
  appSettings,
  branches,
  db,
  ensureAppSettingsSingleton,
  pipelineRuns,
  stories,
  storyEntries,
  useDbMigrations,
} from '../../lib/db'

// Lives OUTSIDE lib/db, importing only the public path. The positive half of
// the public-API discipline. Importing must NOT throw (lazy proxy construction).
describe('lib/db public API', () => {
  it('exports the client, tables, and startup helpers', () => {
    expect(db).toBeDefined()
    expect(stories).toBeDefined()
    expect(branches).toBeDefined()
    expect(storyEntries).toBeDefined()
    expect(appSettings).toBeDefined()
    expect(pipelineRuns).toBeDefined()
    expect(typeof useDbMigrations).toBe('function')
    expect(typeof ensureAppSettingsSingleton).toBe('function')
    expect(APP_SETTINGS_DEFAULTS).toBeDefined()
    expect(APP_SETTINGS_SINGLETON_ID).toBeDefined()
  })
})
