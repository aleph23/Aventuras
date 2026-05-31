import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

type NavigationState = {
  currentStoryId: string | null
  currentBranchId: string | null
  setCurrentStory: (id: string | null) => void
  setCurrentBranch: (id: string | null) => void
  __reset: () => void
}

type NavigationSnapshot = Pick<NavigationState, 'currentStoryId' | 'currentBranchId'>

const navigationStore = createStore<NavigationState>()((set) => ({
  currentStoryId: null,
  currentBranchId: null,
  setCurrentStory: (id) => set({ currentStoryId: id }),
  setCurrentBranch: (id) => set({ currentBranchId: id }),
  __reset: () => set({ currentStoryId: null, currentBranchId: null }),
}))

function useNavigation<T>(selector: (s: NavigationSnapshot) => T): T {
  return useStore(navigationStore, selector as (s: NavigationState) => T)
}

function getNavigation(): NavigationSnapshot {
  const s = navigationStore.getState()
  return { currentStoryId: s.currentStoryId, currentBranchId: s.currentBranchId }
}

const api = navigationStore.getState()

export const navigation = {
  useNavigation,
  getNavigation,
  setCurrentStory: api.setCurrentStory,
  setCurrentBranch: api.setCurrentBranch,
  __reset: api.__reset,
}

export { navigationStore }
export type { NavigationSnapshot, NavigationState }
