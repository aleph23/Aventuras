<script lang="ts">
  import { tagStore } from "$lib/stores/tags.svelte";
  import type { VaultType } from "$lib/types";
  import { Filter, Check, X } from "lucide-svelte";
  import { fade, slide } from "svelte/transition";

  interface Props {
    selectedTags: string[];
    logic: "AND" | "OR";
    type: VaultType;
    onUpdate: (tags: string[], logic: "AND" | "OR") => void;
  }

  let { selectedTags, logic, type, onUpdate }: Props = $props();

  let isOpen = $state(false);
  let search = $state("");

  const availableTags = $derived(tagStore.getTagsForType(type));

  const filteredTags = $derived.by(() => {
    if (!search.trim()) return availableTags;
    const q = search.toLowerCase();
    return availableTags.filter((t) => t.name.toLowerCase().includes(q));
  });

  function toggleTag(tagName: string) {
    if (selectedTags.includes(tagName)) {
      onUpdate(
        selectedTags.filter((t) => t !== tagName),
        logic,
      );
    } else {
      onUpdate([...selectedTags, tagName], logic);
    }
  }

  function clearTags() {
    onUpdate([], logic);
    isOpen = false;
  }

  function toggleLogic() {
    onUpdate(selectedTags, logic === "AND" ? "OR" : "AND");
  }

  // Close dropdown on click outside
  function handleClickOutside(node: HTMLElement) {
    const handleClick = (e: MouseEvent) => {
      if (!node.contains(e.target as Node)) {
        isOpen = false;
      }
    };
    document.addEventListener("click", handleClick);
    return {
      destroy() {
        document.removeEventListener("click", handleClick);
      },
    };
  }
</script>

<div class="relative z-20" use:handleClickOutside>
  <button
    class={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
      selectedTags.length > 0
        ? "border-accent-500 bg-accent-500/10 text-accent-400"
        : "border-surface-600 bg-surface-800 text-surface-400 hover:border-surface-500"
    }`}
    onclick={() => (isOpen = !isOpen)}
  >
    <Filter class="h-3 w-3" />
    <span class="hidden sm:inline">Tags</span>
    {#if selectedTags.length > 0}
      <span
        class="ml-1 rounded-full bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-bold"
      >
        {selectedTags.length}
      </span>
    {/if}
  </button>

  {#if isOpen}
    <!-- Mobile Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm sm:hidden"
      transition:fade={{ duration: 100 }}
      onclick={() => (isOpen = false)}
      aria-hidden="true"
    ></div>

    <div
      transition:fade={{ duration: 100 }}
      class="
        fixed left-1/2 top-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 shadow-2xl
        sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:translate-x-0 sm:translate-y-0 sm:shadow-xl
        rounded-xl border border-surface-600 bg-surface-800 p-3
      "
    >
      <!-- Header / Logic Toggle -->
      <div class="mb-3 flex items-center justify-between">
        <span class="text-xs font-medium text-surface-400">Filter Logic:</span>
        <button
          class="flex items-center rounded bg-surface-700 p-0.5"
          onclick={toggleLogic}
        >
          <span
            class={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
              logic === "AND"
                ? "bg-accent-500 text-white shadow-sm"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            AND
          </span>
          <span
            class={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
              logic === "OR"
                ? "bg-accent-500 text-white shadow-sm"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            OR
          </span>
        </button>
      </div>

      <!-- Search -->
      <div class="mb-2">
        <input
          type="text"
          bind:value={search}
          placeholder="Filter tags..."
          class="w-full rounded border border-surface-600 bg-surface-700 px-2 py-1.5 text-xs text-surface-100 placeholder-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>

      <!-- Tag List -->
      <div class="max-h-48 space-y-1 overflow-y-auto">
        {#each filteredTags as tag}
          <button
            class={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${
              selectedTags.includes(tag.name)
                ? "bg-accent-500/10 text-accent-400"
                : "text-surface-300 hover:bg-surface-700"
            }`}
            onclick={() => toggleTag(tag.name)}
          >
            <div class="flex items-center gap-2">
              <span>{tag.name}</span>
            </div>
            {#if selectedTags.includes(tag.name)}
              <Check class="h-3 w-3" />
            {/if}
          </button>
        {/each}
        {#if filteredTags.length === 0}
          <div class="py-2 text-center text-xs text-surface-500">
            No tags found
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if selectedTags.length > 0}
        <div class="mt-2 border-t border-surface-700 pt-2">
          <button
            class="flex w-full items-center justify-center gap-1 rounded bg-surface-700 py-1.5 text-xs text-surface-300 hover:bg-surface-600 hover:text-surface-100"
            onclick={clearTags}
          >
            <X class="h-3 w-3" />
            Clear Filters
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
