import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const eslint = new ESLint({ cwd: process.cwd() })

async function ruleIds(code: string, filePath: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.map((m) => m.ruleId)
}

describe('lib/diagnostics lint enforcement', () => {
  it('flags console.* outside lib/diagnostics', async () => {
    expect(await ruleIds("console.log('x')\n", 'components/__console-fixture.tsx')).toContain(
      'no-console',
    )
  })

  it('allows console.* inside lib/diagnostics', async () => {
    expect(
      await ruleIds("console.log('x')\n", 'lib/diagnostics/__console-fixture.ts'),
    ).not.toContain('no-console')
  })

  it('flags a deep import of lib/diagnostics internals from outside', async () => {
    expect(
      await ruleIds("import { logger } from '@/lib/diagnostics/logger'\n", 'components/__deep.tsx'),
    ).toContain('boundaries/dependencies')
  })

  it('allows the public import of lib/diagnostics', async () => {
    expect(
      await ruleIds("import { logger } from '@/lib/diagnostics'\n", 'components/__public.tsx'),
    ).not.toContain('boundaries/dependencies')
  })
})
