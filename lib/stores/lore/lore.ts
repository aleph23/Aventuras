import type { Lore } from '@/lib/db'

import { createWorkingSetStore } from '../factory/working-set-store'

const store = createWorkingSetStore<Lore>()

export const loreStore = {
  useLore: store.useRows,
  getLore: store.getRows,
  getLoadedBranch: store.getLoadedBranch,
  getById: (id: string): Lore | undefined => store.getRows().get(id),
  hydrate: store.hydrate,
  patch: store.patch,
  __reset: store.__reset,
}
