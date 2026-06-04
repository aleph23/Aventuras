import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const eslint = new ESLint({ cwd: process.cwd() })

async function ruleIds(code: string): Promise<(string | null)[]> {
  // Non-test fixture path so the boundaries rule applies (test files are exempt).
  const [result] = await eslint.lintText(code, { filePath: 'components/__surface-fixture.tsx' })
  return result.messages.map((m) => m.ruleId)
}

describe('lib/stores public-API surfaces', () => {
  it('flags deep imports of raw store handles', async () => {
    expect(
      await ruleIds("import { generationStore } from '@/lib/stores/generation/generation'\n"),
    ).toContain('boundaries/dependencies')
    expect(
      await ruleIds("import { appSettingsStore } from '@/lib/stores/app-settings/app-settings'\n"),
    ).toContain('boundaries/dependencies')
    expect(
      await ruleIds("import { navigationStore } from '@/lib/stores/navigation/navigation'\n"),
    ).toContain('boundaries/dependencies')
  })

  it('allows the index import', async () => {
    expect(
      await ruleIds("import { generationStore, navigationStore } from '@/lib/stores'\n"),
    ).not.toContain('boundaries/dependencies')
  })
})
