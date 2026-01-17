<script lang="ts">
  import { ui } from '$lib/stores/ui.svelte';
  import { story } from '$lib/stores/story.svelte';
  import { Users, MapPin, Backpack, Scroll, Clock, GitBranch, BookOpen, BookMarked, Brain } from 'lucide-svelte';
  import CharacterPanel from '$lib/components/world/CharacterPanel.svelte';

  import LocationPanel from '$lib/components/world/LocationPanel.svelte';
  import InventoryPanel from '$lib/components/world/InventoryPanel.svelte';
  import QuestPanel from '$lib/components/world/QuestPanel.svelte';
  import TimePanel from '$lib/components/world/TimePanel.svelte';
  import BranchPanel from '$lib/components/branch/BranchPanel.svelte';
  import { swipe } from '$lib/utils/swipe';

  const tabs = [
    { id: 'characters' as const, icon: Users, label: 'Characters' },
    { id: 'locations' as const, icon: MapPin, label: 'Locations' },
    { id: 'inventory' as const, icon: Backpack, label: 'Inventory' },
    { id: 'quests' as const, icon: Scroll, label: 'Quests' },
    { id: 'time' as const, icon: Clock, label: 'Time' },
    { id: 'branches' as const, icon: GitBranch, label: 'Branches' },
  ];

  function handleSwipeLeft() {
    // Navigate to next tab
    const currentIndex = tabs.findIndex(t => t.id === ui.sidebarTab);
    if (currentIndex < tabs.length - 1) {
      ui.setSidebarTab(tabs[currentIndex + 1].id);
    }
  }

  function handleSwipeRight() {
    // Navigate to previous tab, or close sidebar if on first tab
    const currentIndex = tabs.findIndex(t => t.id === ui.sidebarTab);
    if (currentIndex > 0) {
      ui.setSidebarTab(tabs[currentIndex - 1].id);
    } else {
      // On first tab, swipe right closes sidebar (swiping towards the right edge)
      ui.toggleSidebar();
    }
  }
</script>

<aside
  class="sidebar flex h-full w-[calc(100vw-3rem)] max-w-72 flex-col border-l border-surface-700 sm:w-72"
  use:swipe={{ onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight, threshold: 50 }}
>
  <!-- Tab navigation -->
  <div class="flex border-b border-surface-700">
    {#each tabs as tab}
      <button
        class="flex flex-1 items-center justify-center gap-1.5 py-3 sm:py-3 min-h-[48px] text-sm transition-colors"
        class:text-accent-400={ui.sidebarTab === tab.id}
        class:text-surface-400={ui.sidebarTab !== tab.id}
        class:border-b-2={ui.sidebarTab === tab.id}
        class:border-accent-500={ui.sidebarTab === tab.id}
        class:hover:text-surface-200={ui.sidebarTab !== tab.id}
        onclick={() => ui.setSidebarTab(tab.id)}
        title={tab.label}
      >
        <svelte:component this={tab.icon} class="h-5 w-5 sm:h-4 sm:w-4" />
      </button>
    {/each}
  </div>

  <!-- Panel content -->
  <div class="flex-1 overflow-y-auto p-3">
    {#if ui.sidebarTab === 'characters'}
      <CharacterPanel />
    {:else if ui.sidebarTab === 'locations'}
      <LocationPanel />
    {:else if ui.sidebarTab === 'inventory'}
      <InventoryPanel />
    {:else if ui.sidebarTab === 'quests'}
      <QuestPanel />
    {:else if ui.sidebarTab === 'time'}
      <TimePanel />
    {:else if ui.sidebarTab === 'branches'}
      <BranchPanel />
    {/if}
  </div>

  <!-- Bottom Context Navigation -->
  <div class="flex items-center gap-1 border-t border-surface-700 p-2">
    <button
      class="btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded py-2 text-xs"
      class:text-accent-400={ui.activePanel === 'story'}
      class:text-surface-400={ui.activePanel !== 'story'}
      onclick={() => ui.setActivePanel('story')}
      title="Story"
    >
      <BookOpen class="h-4 w-4" />
      <span>Story</span>
    </button>
    <button
      class="btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded py-2 text-xs"
      class:text-accent-400={ui.activePanel === 'lorebook'}
      class:text-surface-400={ui.activePanel !== 'lorebook'}
      onclick={() => ui.setActivePanel('lorebook')}
      title="Lorebook"
    >
      <BookMarked class="h-4 w-4" />
      <span>Lorebook</span>
    </button>
    <button
      class="btn-ghost flex flex-1 flex-col items-center justify-center gap-1 rounded py-2 text-xs"
      class:text-accent-400={ui.activePanel === 'memory'}
      class:text-surface-400={ui.activePanel !== 'memory'}
      onclick={() => ui.setActivePanel('memory')}
      title="Memory"
    >
      <Brain class="h-4 w-4" />
      <span>Memory</span>
    </button>
  </div>
</aside>


<style>
  .sidebar {
    background-color: rgb(20 27 37);
  }
</style>
