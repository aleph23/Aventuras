import type { Happening } from '@/lib/db'

import { createWorkingSetStore } from '../factory/working-set-store'

const store = createWorkingSetStore<Happening>()

export const happeningsStore = {
  useHappenings: store.useRows,
  getHappenings: store.getRows,
  getLoadedBranch: store.getLoadedBranch,
  getById: (id: string): Happening | undefined => store.getRows().get(id),
  hydrate: store.hydrate,
  patch: store.patch,
  __reset: store.__reset,
}
