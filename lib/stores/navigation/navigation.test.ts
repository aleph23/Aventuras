import { beforeEach, describe, expect, it } from 'vitest'

import { navigationStore } from './navigation'

describe('navigation store', () => {
  beforeEach(() => navigationStore.__reset())

  it('defaults to null story and branch', () => {
    expect(navigationStore.getNavigation()).toEqual({
      currentStoryId: null,
      currentBranchId: null,
    })
  })

  it('setCurrentStory updates currentStoryId only', () => {
    navigationStore.setCurrentStory('story-1')
    expect(navigationStore.getNavigation()).toEqual({
      currentStoryId: 'story-1',
      currentBranchId: null,
    })
  })

  it('setCurrentBranch updates currentBranchId only', () => {
    navigationStore.setCurrentBranch('branch-1')
    expect(navigationStore.getNavigation().currentBranchId).toBe('branch-1')
  })

  it('accepts null to clear a selection', () => {
    navigationStore.setCurrentStory('story-1')
    navigationStore.setCurrentStory(null)
    expect(navigationStore.getNavigation().currentStoryId).toBe(null)
  })
})
