import { beforeEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/lib/diagnostics'

import { appSettings, hydrateAppSettings } from './app-settings'

const SEEDED = {
  providers: [{ id: 'p1' }],
  profiles: [{ id: 'prof1' }],
  assignments: { classifier: 'prof1' },
  defaultProviderId: 'p1',
}

const EMPTY = { providers: [], profiles: [], assignments: {}, defaultProviderId: null }

describe('app-settings read-model store', () => {
  beforeEach(() => appSettings.__reset())

  it('starts at empty defaults before hydration', () => {
    expect(appSettings.getAppSettings()).toEqual(EMPTY)
  })

  it('hydrateAppSettings mirrors the seeded row', async () => {
    await hydrateAppSettings(async () => SEEDED)
    expect(appSettings.getAppSettings()).toEqual(SEEDED)
  })

  it('falls back to defaults on a missing row', async () => {
    await hydrateAppSettings(async () => undefined)
    expect(appSettings.getAppSettings()).toEqual(EMPTY)
  })

  it('falls back to defaults and logs a breadcrumb when the read throws', async () => {
    const errorSpy = vi.spyOn(logger, 'error')
    await hydrateAppSettings(async () => {
      throw new Error('corrupt JSON')
    })
    expect(appSettings.getAppSettings()).toEqual(EMPTY)
    expect(errorSpy).toHaveBeenCalledWith(
      'bootstrap.app_settings_hydrate_failed',
      expect.objectContaining({ error: 'corrupt JSON' }),
    )
    errorSpy.mockRestore()
  })
})
