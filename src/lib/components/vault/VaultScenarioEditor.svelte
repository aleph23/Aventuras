<script lang="ts">
  import type { VaultScenario, VaultScenarioNpc, VaultCharacter } from '$lib/types';
  import { scenarioVault } from '$lib/stores/scenarioVault.svelte';
  import { characterVault } from '$lib/stores/characterVault.svelte';
  import { 
    X, Save, AlertCircle, Plus, Trash2, Users, MessageSquare, 
    FileText, MapPin, User, ChevronDown, ChevronRight, Search
  } from 'lucide-svelte';
  import { fade, slide } from 'svelte/transition';
  import TagInput from '$lib/components/tags/TagInput.svelte';

  interface Props {
    scenario: VaultScenario;
    onClose: () => void;
  }

  let { scenario, onClose }: Props = $props();

  // Local state for editing
  let name = $state(scenario.name);
  let description = $state(scenario.description || '');
  let settingSeed = $state(scenario.settingSeed);
  let npcs = $state<VaultScenarioNpc[]>(JSON.parse(JSON.stringify(scenario.npcs))); // Deep copy
  let firstMessage = $state(scenario.firstMessage || '');
  let alternateGreetings = $state<string[]>([...scenario.alternateGreetings]);
  let tags = $state<string[]>([...scenario.tags]);
  
  // UI State
  let activeTab = $state<'general' | 'npcs' | 'opening'>('general');
  let saving = $state(false);
  let error = $state<string | null>(null);
  
  // Character Selector State
  let showCharacterSelector = $state(false);
  let charSearchQuery = $state('');
  
  // Collapsed state tracking (Set of indices that are expanded)
  let expandedNpcs = $state<Set<number>>(new Set());

  // Derived filtered characters
  const filteredCharacters = $derived.by(() => {
    if (!showCharacterSelector) return [];
    let chars = characterVault.characters;
    if (charSearchQuery.trim()) {
      const q = charSearchQuery.toLowerCase();
      chars = chars.filter(c => c.name.toLowerCase().includes(q));
    }
    return chars;
  });

  function toggleNpc(index: number) {
    const newSet = new Set(expandedNpcs);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    expandedNpcs = newSet;
  }

  function handleSave() {
    if (!name.trim()) {
      error = 'Scenario name is required';
      return;
    }

    saving = true;
    error = null;

    scenarioVault.update(scenario.id, {
      name,
      description: description || null,
      settingSeed,
      npcs,
      firstMessage: firstMessage || null,
      alternateGreetings,
      tags,
      metadata: {
        ...scenario.metadata,
        npcCount: npcs.length,
        hasFirstMessage: !!firstMessage,
        alternateGreetingsCount: alternateGreetings.length
      }
    }).then(() => {
      onClose();
    }).catch(e => {
      error = e instanceof Error ? e.message : 'Failed to save scenario';
      saving = false;
    });
  }

  // NPC Management
  function addNpc() {
    const newIndex = npcs.length;
    npcs.push({
      name: 'New NPC',
      role: 'Supporting Character',
      description: '',
      relationship: 'Neutral',
      traits: []
    });
    npcs = npcs; // Trigger update
    
    // Auto-expand the new NPC
    const newSet = new Set(expandedNpcs);
    newSet.add(newIndex);
    expandedNpcs = newSet;
  }

  function removeNpc(index: number) {
    npcs.splice(index, 1);
    npcs = npcs; // Trigger update
    
    // Adjust expanded indices
    const newSet = new Set<number>();
    for (const i of expandedNpcs) {
      if (i < index) newSet.add(i);
      else if (i > index) newSet.add(i - 1);
    }
    expandedNpcs = newSet;
  }

  function addNpcFromCharacter(char: VaultCharacter) {
    const newIndex = npcs.length;
    npcs.push({
      name: char.name,
      role: char.role || 'Supporting Character',
      description: char.description || '',
      relationship: char.relationshipTemplate || 'Neutral',
      traits: [...char.traits]
    });
    npcs = npcs;
    
    // Auto-expand
    const newSet = new Set(expandedNpcs);
    newSet.add(newIndex);
    expandedNpcs = newSet;
    
    showCharacterSelector = false;
  }

  // Alternate Greetings Management
  function addGreeting() {
    alternateGreetings.push('');
    alternateGreetings = alternateGreetings;
  }

  function removeGreeting(index: number) {
    alternateGreetings.splice(index, 1);
    alternateGreetings = alternateGreetings;
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
  role="dialog"
  aria-modal="true"
>
  <div class="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-surface-900 shadow-2xl overflow-hidden ring-1 ring-surface-700">
    
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-surface-700 bg-surface-800 px-6 py-4">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-700">
          <MapPin class="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-surface-100">Edit Scenario</h2>
          <p class="text-xs text-surface-400">{name}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        {#if error}
          <div class="flex items-center gap-2 text-red-400 text-sm mr-4 bg-red-500/10 px-3 py-1.5 rounded-full">
            <AlertCircle class="h-4 w-4" />
            {error}
          </div>
        {/if}

        <button
          class="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50 transition-colors"
          onclick={handleSave}
          disabled={saving}
        >
          {#if saving}
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          {:else}
            <Save class="h-4 w-4" />
          {/if}
          Save Changes
        </button>
        
        <div class="h-6 w-px bg-surface-700 mx-1"></div>

        <button
          class="rounded-lg p-2 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors"
          onclick={onClose}
          title="Close"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-surface-700 bg-surface-800/50 px-6">
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'general' ? 'border-accent-500 text-accent-400' : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => activeTab = 'general'}
      >
        <FileText class="h-4 w-4" />
        General
      </button>
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'npcs' ? 'border-accent-500 text-accent-400' : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => activeTab = 'npcs'}
      >
        <Users class="h-4 w-4" />
        NPCs ({npcs.length})
      </button>
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'opening' ? 'border-accent-500 text-accent-400' : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => activeTab = 'opening'}
      >
        <MessageSquare class="h-4 w-4" />
        Opening
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 bg-surface-900">
      <div class="max-w-3xl mx-auto">
        
        <!-- General Tab -->
        {#if activeTab === 'general'}
          <div class="space-y-6" in:fade={{ duration: 150 }}>
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label class="block text-sm font-medium text-surface-300 mb-1">Scenario Name</label>
                <input
                  type="text"
                  bind:value={name}
                  class="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-2.5 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
                  placeholder="e.g. The Cyberpunk City"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-300 mb-1">Description (Short Summary)</label>
                <textarea
                  bind:value={description}
                  rows="2"
                  class="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-2.5 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
                  placeholder="Brief overview shown on the card..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-300 mb-1">Setting Seed (World Details)</label>
                <p class="text-xs text-surface-500 mb-2">The core setting information used to generate the story world.</p>
                <textarea
                  bind:value={settingSeed}
                  rows="12"
                  class="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-sm text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none font-mono leading-relaxed"
                  placeholder="Detailed world setting..."
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-300 mb-1">Tags</label>
                <TagInput
                  value={tags}
                  type="scenario"
                  onChange={(newTags) => tags = newTags}
                  placeholder="Add tags..."
                />
              </div>
            </div>
          </div>
        {/if}

        <!-- NPCs Tab -->
        {#if activeTab === 'npcs'}
          <div class="space-y-6" in:fade={{ duration: 150 }}>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-surface-300">Supporting Characters</h3>
              <div class="flex items-center gap-2">
                <button
                  onclick={() => { charSearchQuery = ''; showCharacterSelector = true; }}
                  class="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-xs font-medium text-surface-200 hover:border-surface-500 hover:bg-surface-600 transition-colors"
                >
                  <Users class="h-3.5 w-3.5" />
                  Add from Vault
                </button>
                <button
                  onclick={addNpc}
                  class="flex items-center gap-2 rounded-lg bg-surface-700 px-3 py-1.5 text-xs font-medium text-surface-200 hover:bg-surface-600 hover:text-white transition-colors"
                >
                  <Plus class="h-3.5 w-3.5" />
                  Add NPC
                </button>
              </div>
            </div>

            <div class="space-y-4">
              {#if npcs.length === 0}
                <div class="rounded-lg border border-dashed border-surface-700 p-8 text-center text-surface-500">
                  <Users class="mx-auto h-8 w-8 opacity-50 mb-2" />
                  <p>No NPCs defined yet.</p>
                </div>
              {:else}
                {#each npcs as npc, i}
                  <div class="rounded-lg border border-surface-700 bg-surface-800/50 overflow-hidden">
                    <!-- Header / Collapsed View -->
                    <div 
                      class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-700/50 transition-colors"
                      onclick={() => toggleNpc(i)}
                      onkeydown={(e) => e.key === 'Enter' && toggleNpc(i)}
                      role="button"
                      tabindex="0"
                    >
                      <div class="flex items-center gap-3">
                        {#if expandedNpcs.has(i)}
                          <ChevronDown class="h-4 w-4 text-surface-400" />
                        {:else}
                          <ChevronRight class="h-4 w-4 text-surface-400" />
                        {/if}
                        <div>
                          <div class="font-medium text-surface-200 text-sm">
                            {npc.name || 'Unnamed NPC'}
                          </div>
                          <div class="text-xs text-surface-400">
                            {npc.role || 'No role'}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onclick={(e) => { e.stopPropagation(); removeNpc(i); }}
                        class="p-1.5 text-surface-500 hover:bg-red-500/10 hover:text-red-400 rounded transition-colors"
                        title="Remove NPC"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>

                    <!-- Expanded Content -->
                    {#if expandedNpcs.has(i)}
                      <div class="p-4 border-t border-surface-700 bg-surface-800/30" transition:slide={{ duration: 200 }}>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label class="block text-xs font-medium text-surface-400 mb-1">Name</label>
                            <input
                              type="text"
                              bind:value={npc.name}
                              class="w-full rounded bg-surface-700/50 border border-surface-600 px-3 py-1.5 text-sm text-surface-100 focus:border-accent-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-surface-400 mb-1">Role</label>
                            <input
                              type="text"
                              bind:value={npc.role}
                              class="w-full rounded bg-surface-700/50 border border-surface-600 px-3 py-1.5 text-sm text-surface-100 focus:border-accent-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div class="mb-4">
                          <label class="block text-xs font-medium text-surface-400 mb-1">Description</label>
                          <textarea
                            bind:value={npc.description}
                            rows="2"
                            class="w-full rounded bg-surface-700/50 border border-surface-600 px-3 py-1.5 text-sm text-surface-100 focus:border-accent-500 focus:outline-none"
                          ></textarea>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label class="block text-xs font-medium text-surface-400 mb-1">Relationship</label>
                            <input
                              type="text"
                              bind:value={npc.relationship}
                              class="w-full rounded bg-surface-700/50 border border-surface-600 px-3 py-1.5 text-sm text-surface-100 focus:border-accent-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-surface-400 mb-1">Traits (comma separated)</label>
                            <input
                              type="text"
                              value={npc.traits.join(', ')}
                              oninput={(e) => npc.traits = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean)}
                              class="w-full rounded bg-surface-700/50 border border-surface-600 px-3 py-1.5 text-sm text-surface-100 focus:border-accent-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}

        <!-- Opening Tab -->
        {#if activeTab === 'opening'}
          <div class="space-y-8" in:fade={{ duration: 150 }}>
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-surface-300">First Message (Opening Scene)</label>
                <span class="text-xs text-surface-500">The initial message displayed when starting the story.</span>
              </div>
              <textarea
                bind:value={firstMessage}
                rows="8"
                class="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-sm text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none font-mono leading-relaxed"
                placeholder="Write the opening scene..."
              ></textarea>
            </div>

            <div>
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-sm font-medium text-surface-300">Alternate Greetings</h3>
                  <p class="text-xs text-surface-500">Variations of the opening scene.</p>
                </div>
                <button
                  onclick={addGreeting}
                  class="flex items-center gap-2 rounded-lg bg-surface-700 px-3 py-1.5 text-xs font-medium text-surface-200 hover:bg-surface-600 hover:text-white transition-colors"
                >
                  <Plus class="h-3.5 w-3.5" />
                  Add Variation
                </button>
              </div>

              <div class="space-y-4">
                {#each alternateGreetings as greeting, i}
                  <div class="relative group">
                    <textarea
                      bind:value={alternateGreetings[i]}
                      rows="4"
                      class="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 pr-10 text-sm text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none font-mono"
                      placeholder={`Variation ${i + 1}...`}
                    ></textarea>
                    <button
                      onclick={() => removeGreeting(i)}
                      class="absolute top-2 right-2 p-1.5 text-surface-500 hover:bg-red-500/10 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove variation"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                {/each}
                {#if alternateGreetings.length === 0}
                  <p class="text-sm text-surface-500 italic">No alternate greetings defined.</p>
                {/if}
              </div>
            </div>
          </div>
        {/if}

      </div>
    </div>
  </div>

  <!-- Character Selector Modal -->
  {#if showCharacterSelector}
    <div 
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onclick={(e) => { e.stopPropagation(); showCharacterSelector = false; }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        class="flex h-[70vh] w-full max-w-lg flex-col rounded-xl bg-surface-900 shadow-2xl ring-1 ring-surface-700"
        onclick={(e) => e.stopPropagation()}
        role="document"
        tabindex="-1"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-surface-700 bg-surface-800 px-4 py-3">
          <h3 class="font-semibold text-surface-100">Select Character</h3>
          <button
            onclick={() => showCharacterSelector = false}
            class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-700 hover:text-surface-200"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Search -->
        <div class="p-4 border-b border-surface-700">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              bind:value={charSearchQuery}
              placeholder="Search vault characters..."
              class="w-full rounded-lg border border-surface-600 bg-surface-800 pl-9 pr-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          {#if filteredCharacters.length === 0}
            <div class="p-8 text-center text-surface-500">
              <Users class="mx-auto h-8 w-8 opacity-50 mb-2" />
              <p>No matching characters found.</p>
            </div>
          {:else}
            {#each filteredCharacters as char}
              <button
                class="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-800 transition-colors group"
                onclick={() => addNpcFromCharacter(char)}
              >
                <!-- Avatar -->
                <div class="h-10 w-10 flex-shrink-0 rounded-lg bg-surface-800 border border-surface-700 overflow-hidden">
                  {#if char.portrait}
                    <img src={char.portrait} alt="" class="h-full w-full object-cover" />
                  {:else}
                    <div class="flex h-full w-full items-center justify-center bg-surface-700">
                      <User class="h-5 w-5 text-surface-400" />
                    </div>
                  {/if}
                </div>
                
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-surface-200 group-hover:text-accent-400 transition-colors">
                    {char.name}
                  </div>
                  <div class="text-xs text-surface-400 truncate">
                    {char.role || 'Supporting'} • {char.traits.slice(0, 3).join(', ')}
                  </div>
                </div>
                
                <Plus class="h-4 w-4 text-surface-500 group-hover:text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>