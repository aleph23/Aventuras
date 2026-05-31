import { beforeEach, describe, expect, it } from 'vitest'

import { navigation } from './navigation'

describe('navigation store', () => {
  beforeEach(() => navigation.__reset())

  it('defaults to null story and branch', () => {
    expect(navigation.getNavigation()).toEqual({
      currentStoryId: null,
      currentBranchId: null,
    })
  })

  it('setCurrentStory updates currentStoryId only', () => {
    navigation.setCurrentStory('story-1')
    expect(navigation.getNavigation()).toEqual({
      currentStoryId: 'story-1',
      currentBranchId: null,
    })
  })

  it('setCurrentBranch updates currentBranchId only', () => {
    navigation.setCurrentBranch('branch-1')
    expect(navigation.getNavigation().currentBranchId).toBe('branch-1')
  })

  it('accepts null to clear a selection', () => {
    navigation.setCurrentStory('story-1')
    navigation.setCurrentStory(null)
    expect(navigation.getNavigation().currentStoryId).toBe(null)
  })
})
