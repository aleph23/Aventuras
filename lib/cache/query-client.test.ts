import { describe, expect, it } from 'vitest'

import { createQueryClient } from './query-client'

describe('app query client', () => {
  it('disables auto-refetch and never expires entries', () => {
    const queries = createQueryClient().getDefaultOptions().queries
    expect(queries?.staleTime).toBe(Infinity)
    expect(queries?.refetchOnWindowFocus).toBe(false)
    expect(queries?.refetchOnReconnect).toBe(false)
  })
})
