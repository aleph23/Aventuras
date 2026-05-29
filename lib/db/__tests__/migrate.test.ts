import { describe, expect, it } from 'vitest'

import { createTestDb } from './test-db'

describe('migrate', () => {
  it('creates the five milestone-1 tables', async () => {
    const { sqlite } = await createTestDb()
    const names = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r) => (r as { name: string }).name)
    expect(names).toEqual(
      expect.arrayContaining([
        'app_settings',
        'branches',
        'pipeline_runs',
        'stories',
        'story_entries',
      ]),
    )
  })
})
