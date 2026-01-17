<script lang="ts">
  import { characterVault } from "$lib/stores/characterVault.svelte";
  import { lorebookVault } from "$lib/stores/lorebookVault.svelte";
  import { scenarioVault } from "$lib/stores/scenarioVault.svelte";
  import { ui } from "$lib/stores/ui.svelte";
  import type {
    VaultCharacter,
    VaultCharacterType,
    VaultLorebook,
    VaultScenario,
  } from "$lib/types";
  import {
    Plus,
    Search,
    Star,
    User,
    Users,
    ChevronLeft,
    Upload,
    Loader2,
    Archive,
    Book,
    Globe,
    MapPin,
  } from "lucide-svelte";
  import VaultCharacterCard from "./VaultCharacterCard.svelte";
  import VaultCharacterForm from "./VaultCharacterForm.svelte";
  import VaultLorebookCard from "./VaultLorebookCard.svelte";
  import VaultLorebookEditor from "./VaultLorebookEditor.svelte";
  import VaultScenarioCard from "./VaultScenarioCard.svelte";
  import VaultScenarioEditor from "./VaultScenarioEditor.svelte";
  import DiscoveryModal from "$lib/components/discovery/DiscoveryModal.svelte";
  import { fade } from "svelte/transition";

  // Types
  type VaultTab = "characters" | "lorebooks" | "scenarios";

  // State
  let activeTab = $state<VaultTab>("characters");
  let searchQuery = $state("");
  let showFavoritesOnly = $state(false);

  // Character State
  let charFilterType = $state<VaultCharacterType | "all">("all");
  let showCharForm = $state(false);
  let editingCharacter = $state<VaultCharacter | null>(null);
  let defaultCharFormType = $state<VaultCharacterType>("protagonist");
  let importCharError = $state<string | null>(null);

  // Lorebook State
  let importLorebookError = $state<string | null>(null);
  let editingLorebook = $state<VaultLorebook | null>(null);

  // Scenario State
  let importScenarioError = $state<string | null>(null);
  let editingScenario = $state<VaultScenario | null>(null);

  // Discovery Modal State
  let showDiscoveryModal = $state(false);
  let discoveryMode = $state<"character" | "lorebook" | "scenario">(
    "character",
  );

  // Derived: Filtered Characters
  const filteredCharacters = $derived.by(() => {
    let chars = characterVault.characters;

    if (charFilterType !== "all") {
      chars = chars.filter((c) => c.characterType === charFilterType);
    }

    if (showFavoritesOnly) {
      chars = chars.filter((c) => c.favorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chars = chars.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query)) ||
          c.traits.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return chars;
  });

  // Derived: Filtered Lorebooks
  const filteredLorebooks = $derived.by(() => {
    let books = lorebookVault.lorebooks;

    if (showFavoritesOnly) {
      books = books.filter((b) => b.favorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      books = books.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return books;
  });

  // Derived: Filtered Scenarios
  const filteredScenarios = $derived.by(() => {
    let items = scenarioVault.scenarios;

    if (showFavoritesOnly) {
      items = items.filter((s) => s.favorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return items;
  });

  // Load on mount
  $effect(() => {
    if (!characterVault.isLoaded) characterVault.load();
    if (!lorebookVault.isLoaded) lorebookVault.load();
    if (!scenarioVault.isLoaded) scenarioVault.load();
  });

  // Character Handlers
  function openCreateCharForm(type: VaultCharacterType = "protagonist") {
    editingCharacter = null;
    defaultCharFormType = type;
    showCharForm = true;
  }

  function openEditCharForm(character: VaultCharacter) {
    editingCharacter = character;
    showCharForm = true;
  }

  async function handleDeleteChar(id: string) {
    await characterVault.delete(id);
  }

  async function handleToggleFavoriteChar(id: string) {
    await characterVault.toggleFavorite(id);
  }

  async function handleImportCard(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Fire and forget (store handles loading state via placeholder)
    try {
      await characterVault.importFromFile(file);
    } catch (error) {
      console.error("[CharacterVault] Import failed:", error);
      importCharError =
        error instanceof Error
          ? error.message
          : "Failed to import character card";
    } finally {
      input.value = "";
    }
  }

  // Lorebook Handlers
  async function handleImportLorebook(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Fire and forget (store handles loading state via placeholder)
    try {
      await lorebookVault.importFromFile(file);
    } catch (error) {
      console.error("[VaultPanel] Lorebook import failed:", error);
      importLorebookError =
        error instanceof Error ? error.message : "Failed to import lorebook";
    } finally {
      input.value = "";
    }
  }

  async function handleDeleteLorebook(id: string) {
    await lorebookVault.delete(id);
  }

  async function handleToggleFavoriteLorebook(id: string) {
    await lorebookVault.toggleFavorite(id);
  }

  function openEditLorebook(lorebook: VaultLorebook) {
    editingLorebook = lorebook;
  }

  async function handleCreateLorebook() {
    // Create a new empty lorebook and open it for editing
    const newLorebook = await lorebookVault.add({
      name: "",
      description: null,
      entries: [],
      tags: [],
      favorite: false,
      source: "manual",
      originalFilename: null,
      originalStoryId: null,
      metadata: {
        format: "aventura",
        totalEntries: 0,
        entryBreakdown: {
          character: 0,
          location: 0,
          item: 0,
          faction: 0,
          concept: 0,
          event: 0,
        },
      },
    });
    editingLorebook = newLorebook;
  }

  // Scenario Handlers
  async function handleImportScenario(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await scenarioVault.importFromFile(file);
    } catch (error) {
      console.error("[VaultPanel] Scenario import failed:", error);
      importScenarioError =
        error instanceof Error ? error.message : "Failed to import scenario";
    } finally {
      input.value = "";
    }
  }

  async function handleDeleteScenario(id: string) {
    await scenarioVault.delete(id);
  }

  async function handleToggleFavoriteScenario(id: string) {
    await scenarioVault.toggleFavorite(id);
  }

  function openEditScenario(scenario: VaultScenario) {
    editingScenario = scenario;
  }

  function openBrowseOnline(mode: "character" | "lorebook" | "scenario") {
    discoveryMode = mode;
    showDiscoveryModal = true;
  }
</script>

<div class="flex h-full flex-col bg-surface-900">
  <!-- Header -->
  <div class="flex flex-col border-b border-surface-700 bg-surface-800">
    <!-- Top Bar -->
    <div class="flex items-center justify-between px-3 py-3 sm:px-6">
      <div class="flex items-center gap-3">
        <button
          class="rounded p-1.5 hover:bg-surface-700 -ml-1 sm:ml-0"
          onclick={() => ui.setActivePanel("library")}
          title="Back to Library"
        >
          <ChevronLeft class="h-5 w-5 text-surface-400" />
        </button>
        <div class="flex items-center gap-2">
          <Archive class="h-5 w-5 text-surface-400" />
          <h2 class="text-lg font-semibold text-surface-100">Vault</h2>
        </div>
      </div>

      <!-- Right Side Actions (Context Sensitive) -->
      <div class="flex items-center gap-2 -mr-1 sm:mr-0">
        {#if activeTab === "characters"}
          <button
            class="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:border-surface-500 hover:bg-surface-600"
            onclick={() => openBrowseOnline("character")}
            title="Browse characters online"
          >
            <Globe class="h-4 w-4" />
            <span class="hidden sm:inline">Browse Online</span>
          </button>
          <label
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:border-surface-500"
          >
            <Upload class="h-4 w-4" />
            <span class="hidden sm:inline">Import Card</span>
            <input
              type="file"
              accept=".json,.png"
              class="hidden"
              onchange={handleImportCard}
            />
          </label>
          <button
            class="flex items-center gap-2 rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
            onclick={() => openCreateCharForm()}
          >
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">New Character</span>
          </button>
        {:else if activeTab === "lorebooks"}
          <!-- Lorebook Actions -->
          <button
            class="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:border-surface-500 hover:bg-surface-600"
            onclick={() => openBrowseOnline("lorebook")}
            title="Browse lorebooks online"
          >
            <Globe class="h-4 w-4" />
            <span class="hidden sm:inline">Browse Online</span>
          </button>
          <label
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:border-surface-500"
          >
            <Upload class="h-4 w-4" />
            <span class="hidden sm:inline">Import Lorebook</span>
            <input
              type="file"
              accept=".json,application/json"
              class="hidden"
              onchange={handleImportLorebook}
            />
          </label>
          <button
            class="flex items-center gap-2 rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
            onclick={handleCreateLorebook}
          >
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline">New Lorebook</span>
          </button>
        {:else if activeTab === "scenarios"}
          <!-- Scenario Actions -->
          <button
            class="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:border-surface-500 hover:bg-surface-600"
            onclick={() => openBrowseOnline("scenario")}
            title="Browse scenarios online"
          >
            <Globe class="h-4 w-4" />
            <span class="hidden sm:inline">Browse Online</span>
          </button>
          <label
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:border-surface-500"
          >
            <Upload class="h-4 w-4" />
            <span class="hidden sm:inline">Import Card</span>
            <input
              type="file"
              accept=".json,.png"
              class="hidden"
              onchange={handleImportScenario}
            />
          </label>
        {/if}
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="flex px-4 sm:px-6">
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
        'characters'
          ? 'border-accent-500 text-accent-400'
          : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => (activeTab = "characters")}
      >
        <Users class="h-4 w-4" />
        <span class="hidden sm:inline">Characters</span>
        <span
          class="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400 sm:ml-1"
        >
          {characterVault.characters.length}
        </span>
      </button>
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
        'lorebooks'
          ? 'border-accent-500 text-accent-400'
          : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => (activeTab = "lorebooks")}
      >
        <Book class="h-4 w-4" />
        <span class="hidden sm:inline">Lorebooks</span>
        <span
          class="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400 sm:ml-1"
        >
          {lorebookVault.lorebooks.length}
        </span>
      </button>
      <button
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
        'scenarios'
          ? 'border-accent-500 text-accent-400'
          : 'border-transparent text-surface-400 hover:text-surface-200'}"
        onclick={() => (activeTab = "scenarios")}
      >
        <MapPin class="h-4 w-4" />
        <span class="hidden sm:inline">Scenarios</span>
        <span
          class="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400 sm:ml-1"
        >
          {scenarioVault.scenarios.length}
        </span>
      </button>
    </div>
  </div>

  <!-- Search and Filters (Common) -->
  <div
    class="border-b border-surface-700 px-3 py-3 space-y-3 sm:px-6 bg-surface-900/50"
  >
    {#if activeTab === "characters" && importCharError}
      <div
        class="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-sm text-red-400 flex items-center justify-between"
      >
        <span>{importCharError}</span>
        <button
          onclick={() => (importCharError = null)}
          class="text-red-400 hover:text-red-300"
        >
          <span class="sr-only">Dismiss</span>
          &times;
        </button>
      </div>
    {/if}

    {#if activeTab === "lorebooks"}
      {#if importLorebookError}
        <div
          class="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-sm text-red-400 flex items-center justify-between"
        >
          <span>{importLorebookError}</span>
          <button
            onclick={() => (importLorebookError = null)}
            class="text-red-400 hover:text-red-300"
          >
            <span class="sr-only">Dismiss</span>
            &times;
          </button>
        </div>
      {/if}
    {/if}

    {#if activeTab === "scenarios"}
      {#if importScenarioError}
        <div
          class="rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-sm text-red-400 flex items-center justify-between"
        >
          <span>{importScenarioError}</span>
          <button
            onclick={() => (importScenarioError = null)}
            class="text-red-400 hover:text-red-300"
          >
            <span class="sr-only">Dismiss</span>
            &times;
          </button>
        </div>
      {/if}
    {/if}

    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500"
        />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={activeTab === "characters"
            ? "Search characters..."
            : activeTab === "lorebooks"
              ? "Search lorebooks..."
              : "Search scenarios..."}
          class="w-full rounded-lg border border-surface-600 bg-surface-700 pl-10 pr-3 py-2 text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <div
        class="flex items-center gap-2 overflow-x-auto -mx-3 px-3 pb-1 sm:pb-0 sm:mx-0 sm:px-0 sm:overflow-visible no-scrollbar"
      >
        {#if activeTab === "characters"}
          <div
            class="flex items-center gap-1 rounded-lg bg-surface-800 p-1 border border-surface-700 shrink-0"
          >
            <button
              class="rounded-md px-3 py-1.5 text-xs transition-colors {charFilterType ===
              'all'
                ? 'bg-surface-600 text-surface-100'
                : 'text-surface-400 hover:text-surface-200'}"
              onclick={() => (charFilterType = "all")}
            >
              All
            </button>
            <button
              class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors {charFilterType ===
              'protagonist'
                ? 'bg-surface-600 text-surface-100'
                : 'text-surface-400 hover:text-surface-200'}"
              onclick={() => (charFilterType = "protagonist")}
            >
              <User class="h-3 w-3" />
              Protagonists
            </button>
            <button
              class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors {charFilterType ===
              'supporting'
                ? 'bg-surface-600 text-surface-100'
                : 'text-surface-400 hover:text-surface-200'}"
              onclick={() => (charFilterType = "supporting")}
            >
              <Users class="h-3 w-3" />
              Supporting
            </button>
          </div>
        {/if}

        <button
          class="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors shrink-0 {showFavoritesOnly
            ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
            : 'border-surface-600 bg-surface-800 text-surface-400 hover:border-surface-500'}"
          onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
        >
          <Star class="h-3 w-3 {showFavoritesOnly ? 'fill-yellow-400' : ''}" />
          Favorites
        </button>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-3 sm:p-6 bg-surface-900">
    {#if activeTab === "characters"}
      <!-- Character Grid -->
      {#if !characterVault.isLoaded}
        <div class="flex h-full items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-surface-500" />
        </div>
      {:else if filteredCharacters.length === 0}
        <div class="flex h-full items-center justify-center" in:fade>
          <div class="text-center">
            <Users class="mx-auto h-12 w-12 text-surface-600" />
            <p class="mt-3 text-surface-400">
              {#if searchQuery || showFavoritesOnly || charFilterType !== "all"}
                No characters match your filters
              {:else}
                No characters in vault yet
              {/if}
            </p>
            {#if !searchQuery && !showFavoritesOnly && charFilterType === "all"}
              <div class="mt-4 flex justify-center gap-2">
                <button
                  class="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                  onclick={() => openCreateCharForm("protagonist")}
                >
                  <User class="h-4 w-4" />
                  Create Protagonist
                </button>
                <button
                  class="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-4 py-2 text-sm text-surface-300 hover:border-surface-500"
                  onclick={() => openCreateCharForm("supporting")}
                >
                  <Users class="h-4 w-4" />
                  Create Supporting
                </button>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          in:fade
        >
          {#each filteredCharacters as character (character.id)}
            <VaultCharacterCard
              {character}
              onEdit={() => openEditCharForm(character)}
              onDelete={() => handleDeleteChar(character.id)}
              onToggleFavorite={() => handleToggleFavoriteChar(character.id)}
            />
          {/each}
        </div>
      {/if}
    {:else if activeTab === "lorebooks"}
      <!-- Lorebook Grid -->
      {#if !lorebookVault.isLoaded}
        <div class="flex h-full items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-surface-500" />
        </div>
      {:else if filteredLorebooks.length === 0}
        <div class="flex h-full items-center justify-center" in:fade>
          <div class="text-center">
            <Book class="mx-auto h-12 w-12 text-surface-600" />
            <p class="mt-3 text-surface-400">
              {#if searchQuery || showFavoritesOnly}
                No lorebooks match your filters
              {:else}
                No lorebooks in vault yet
              {/if}
            </p>
            <p class="mt-1 text-sm text-surface-500">
              Create a new lorebook or import one from a file
            </p>
            {#if !searchQuery && !showFavoritesOnly}
              <div class="mt-4">
                <button
                  class="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 mx-auto"
                  onclick={handleCreateLorebook}
                >
                  <Plus class="h-4 w-4" />
                  Create Lorebook
                </button>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          in:fade
        >
          {#each filteredLorebooks as lorebook (lorebook.id)}
            <VaultLorebookCard
              {lorebook}
              onDelete={() => handleDeleteLorebook(lorebook.id)}
              onToggleFavorite={() => handleToggleFavoriteLorebook(lorebook.id)}
              onEdit={() => openEditLorebook(lorebook)}
            />
          {/each}
        </div>
      {/if}
    {:else if activeTab === "scenarios"}
      <!-- Scenario Grid -->
      {#if !scenarioVault.isLoaded}
        <div class="flex h-full items-center justify-center">
          <Loader2 class="h-8 w-8 animate-spin text-surface-500" />
        </div>
      {:else if filteredScenarios.length === 0}
        <div class="flex h-full items-center justify-center" in:fade>
          <div class="text-center">
            <MapPin class="mx-auto h-12 w-12 text-surface-600" />
            <p class="mt-3 text-surface-400">
              {#if searchQuery || showFavoritesOnly}
                No scenarios match your filters
              {:else}
                No scenarios in vault yet
              {/if}
            </p>
            <p class="mt-1 text-sm text-surface-500">
              Import character cards to extract scenario settings
            </p>
          </div>
        </div>
      {:else}
        <div
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          in:fade
        >
          {#each filteredScenarios as scenario (scenario.id)}
            <VaultScenarioCard
              {scenario}
              onDelete={() => handleDeleteScenario(scenario.id)}
              onToggleFavorite={() => handleToggleFavoriteScenario(scenario.id)}
              onEdit={() => openEditScenario(scenario)}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Character Form Modal -->
{#if showCharForm}
  <VaultCharacterForm
    character={editingCharacter}
    defaultType={defaultCharFormType}
    onClose={() => {
      showCharForm = false;
      editingCharacter = null;
    }}
  />
{/if}

<!-- Lorebook Editor Modal -->
{#if editingLorebook}
  <VaultLorebookEditor
    lorebook={editingLorebook}
    onClose={() => (editingLorebook = null)}
  />
{/if}

<!-- Scenario Editor Modal -->
{#if editingScenario}
  <VaultScenarioEditor
    scenario={editingScenario}
    onClose={() => (editingScenario = null)}
  />
{/if}

<!-- Discovery Modal -->
<DiscoveryModal
  isOpen={showDiscoveryModal}
  mode={discoveryMode}
  onClose={() => (showDiscoveryModal = false)}
/>
