import type { Thread } from '@/lib/db'

import { createWorkingSetStore } from '../factory/working-set-store'

const store = createWorkingSetStore<Thread>()

export const threadsStore = {
  useThreads: store.useRows,
  getThreads: store.getRows,
  getLoadedBranch: store.getLoadedBranch,
  getById: (id: string): Thread | undefined => store.getRows().get(id),
  hydrate: store.hydrate,
  patch: store.patch,
  __reset: store.__reset,
}
