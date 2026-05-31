import { QueryClient } from '@tanstack/react-query'

// Off-label: this cache memoizes compute-derived values (e.g. the future diff
// cache), not network state. Defaults disable every automatic refetch and never
// expire entries — invalidation is always explicit.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
