<script lang="ts">
  import { tagStore } from '$lib/stores/tags.svelte';
  import type { VaultTag, VaultType } from '$lib/types';
  import { X, Search, Trash2, Edit2, Check, Plus } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let activeTab = $state<VaultType>('character');
  let searchQuery = $state('');
  let editingId = $state<string | null>(null);
  let editName = $state('');
  let editColor = $state('');

  const colors = [
    'red-500', 'orange-500', 'amber-500', 'yellow-500', 'lime-500', 
    'green-500', 'emerald-500', 'teal-500', 'cyan-500', 'sky-500', 
    'blue-500', 'indigo-500', 'violet-500', 'purple-500', 'fuchsia-500', 
    'pink-500', 'rose-500'
  ];

  const filteredTags = $derived.by(() => {
    let tags = tagStore.getTagsForType(activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tags = tags.filter(t => t.name.toLowerCase().includes(q));
    }
    return tags;
  });

  function startEdit(tag: VaultTag) {
    editingId = tag.id;
    editName = tag.name;
    editColor = tag.color;
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await tagStore.update(editingId, { 
      name: editName.trim(), 
      color: editColor 
    });
    editingId = null;
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this tag? It will be removed from all vault items.')) {
      await tagStore.delete(id);
    }
  }

  async function handleCreate() {
    if (!searchQuery.trim()) return;
    await tagStore.add(searchQuery.trim(), activeTab);
    searchQuery = '';
  }
</script>

<div 
  class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
  onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  role="dialog"
  aria-modal="true"
>
  <div class="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface-800 shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-700 p-4">
      <h2 class="text-lg font-semibold text-surface-100">Manage Tags</h2>
      <button 
        class="rounded p-1.5 hover:bg-surface-700 text-surface-400 hover:text-surface-200"
        onclick={onClose}
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-surface-700 bg-surface-900/50">
      <button 
        class="flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'character' ? 'border-accent-500 text-accent-400' : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => activeTab = 'character'}
      >
        Characters
      </button>
      <button 
        class="flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'lorebook' ? 'border-accent-500 text-accent-400' : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => activeTab = 'lorebook'}
      >
        Lorebooks
      </button>
      <button 
        class="flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'scenario' ? 'border-accent-500 text-accent-400' : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => activeTab = 'scenario'}
      >
        Scenarios
      </button>
    </div>

    <!-- Search/Add Bar -->
    <div class="border-b border-surface-700 p-4 bg-surface-800">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder={`Search or add ${activeTab} tags...`}
            class="w-full rounded-lg border border-surface-600 bg-surface-700 pl-9 pr-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
            onkeydown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <button 
          class="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50"
          disabled={!searchQuery.trim() || filteredTags.some(t => t.name.toLowerCase() === searchQuery.toLowerCase())}
          onclick={handleCreate}
        >
          <Plus class="h-4 w-4" />
          Add
        </button>
      </div>
    </div>

    <!-- Tag List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-900">
      {#each filteredTags as tag (tag.id)}
        <div 
          class="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800 p-3 hover:border-surface-600 transition-colors"
          in:fade={{ duration: 150 }}
        >
          {#if editingId === tag.id}
            <!-- Edit Mode -->
            <div class="flex flex-1 items-center gap-3">
              <!-- Color Picker -->
              <div class="relative group">
                <div class={`h-6 w-6 rounded-full bg-${editColor} cursor-pointer ring-2 ring-surface-600`}></div>
                <div class="absolute left-0 top-full z-10 mt-2 hidden w-48 flex-wrap gap-1 rounded-lg border border-surface-600 bg-surface-800 p-2 shadow-xl group-hover:flex">
                  {#each colors as color}
                    <button 
                      class={`h-5 w-5 rounded-full bg-${color} hover:ring-2 ring-white`}
                      onclick={() => editColor = color}
                      title={color}
                    ></button>
                  {/each}
                </div>
              </div>
              
              <input 
                bind:value={editName}
                class="flex-1 rounded border border-surface-600 bg-surface-700 px-2 py-1 text-sm text-surface-100 focus:border-accent-500 focus:outline-none"
                autofocus
                onkeydown={(e) => e.key === 'Enter' && saveEdit()}
              />
              
              <div class="flex gap-1">
                <button class="rounded p-1 hover:bg-green-500/20 text-green-400" onclick={saveEdit}>
                  <Check class="h-4 w-4" />
                </button>
                <button class="rounded p-1 hover:bg-surface-600 text-surface-400" onclick={() => editingId = null}>
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
          {:else}
            <!-- View Mode -->
            <div class="flex items-center gap-3">
              <div class={`h-3 w-3 rounded-full bg-${tag.color}`}></div>
              <span class="font-medium text-surface-200">{tag.name}</span>
            </div>
            
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                class="rounded p-1.5 hover:bg-surface-700 text-surface-400 hover:text-surface-200"
                onclick={() => startEdit(tag)}
              >
                <Edit2 class="h-4 w-4" />
              </button>
              <button 
                class="rounded p-1.5 hover:bg-red-500/20 text-surface-400 hover:text-red-400"
                onclick={() => handleDelete(tag.id)}
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center py-12 text-surface-500">
          <p>No tags found.</p>
          <p class="text-sm">Create one above to get started.</p>
        </div>
      {/each}
    </div>
  </div>
</div>
