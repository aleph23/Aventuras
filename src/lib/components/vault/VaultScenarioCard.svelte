<script lang="ts">
  import type { VaultScenario } from '$lib/types';
  import { Star, Pencil, Trash2, MapPin, Users, MessageSquare, Loader2 } from 'lucide-svelte';
  import { tagStore } from '$lib/stores/tags.svelte';
  import TagBadge from '$lib/components/tags/TagBadge.svelte';

  interface Props {
    scenario: VaultScenario;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    selectable?: boolean;
    onSelect?: () => void;
  }

  let { scenario, onEdit, onDelete, onToggleFavorite, selectable = false, onSelect }: Props = $props();

  let confirmingDelete = $state(false);
  let isImporting = $derived(scenario.metadata?.importing === true);

  function handleCardClick() {
    if (isImporting) return;
    if (selectable && onSelect) {
      onSelect();
    }
  }

  function handleDelete(e: Event) {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
    confirmingDelete = false;
  }

  function handleCancelDelete(e: Event) {
    e.stopPropagation();
    confirmingDelete = false;
  }

  function handleConfirmDelete(e: Event) {
    e.stopPropagation();
    confirmingDelete = true;
  }
</script>

<div
  class="relative rounded-lg border bg-surface-800 p-4 {selectable && !isImporting ? 'cursor-pointer border-surface-700 hover:border-accent-500 transition-all' : 'border-surface-700'}"
  onclick={handleCardClick}
  role={selectable && !isImporting ? "button" : undefined}
  tabindex={selectable && !isImporting ? 0 : undefined}
  onkeydown={selectable && !isImporting ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); } : undefined}
>
  {#if isImporting}
    <div class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-900/80 backdrop-blur-sm">
      <Loader2 class="h-8 w-8 animate-spin text-primary-400" />
      <span class="text-sm font-medium text-primary-200">Processing...</span>
    </div>
  {/if}

  <div class="flex items-start gap-3">
    <!-- Icon -->
    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-700 flex-shrink-0">
      <MapPin class="h-6 w-6 text-green-400" />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <h3 class="font-medium text-surface-100 truncate">{scenario.name}</h3>
        {#if scenario.favorite}
          <Star class="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
        {/if}
      </div>

      <div class="flex items-center gap-2 mt-1 flex-wrap">
        {#if scenario.npcs.length > 0}
          <span class="flex items-center gap-1 text-xs text-surface-400">
            <Users class="h-3 w-3" />
            {scenario.npcs.length} NPCs
          </span>
        {/if}
        {#if scenario.firstMessage}
          <span class="flex items-center gap-1 text-xs text-surface-400">
            <MessageSquare class="h-3 w-3" />
            Opening
          </span>
        {/if}
        {#if scenario.source === 'wizard'}
          <span class="text-xs text-surface-500">• Created</span>
        {:else if scenario.source === 'import'}
          <span class="text-xs text-surface-500">• Imported</span>
        {/if}
      </div>

      {#if scenario.description}
        <p class="mt-2 text-sm text-surface-400 line-clamp-2">{scenario.description}</p>
      {/if}

      <!-- Tags -->
      {#if scenario.tags.length > 0}
        <div class="mt-2 flex flex-wrap gap-1">
          {#each scenario.tags.slice(0, 3) as tag}
            <TagBadge name={tag} color={tagStore.getColor(tag, 'scenario')} />
          {/each}
          {#if scenario.tags.length > 3}
            <span class="text-xs text-surface-500">+{scenario.tags.length - 3}</span>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Actions -->
  {#if !selectable && (onEdit || onDelete || onToggleFavorite)}
    <div class="mt-3 flex items-center justify-end gap-1 border-t border-surface-700 pt-3">
      {#if confirmingDelete}
        <button
          class="rounded px-2 py-1 text-xs bg-surface-700 text-surface-300 hover:bg-surface-600"
          onclick={handleCancelDelete}
        >
          Cancel
        </button>
        <button
          class="rounded px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
          onclick={handleDelete}
        >
          Confirm Delete
        </button>
      {:else}
        {#if onToggleFavorite}
          <button
            class="rounded p-1.5 hover:bg-surface-700"
            onclick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
            title={scenario.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star class="h-4 w-4 {scenario.favorite ? 'text-yellow-400 fill-yellow-400' : 'text-surface-500'}" />
          </button>
        {/if}
        {#if onEdit}
          <button
            class="rounded p-1.5 hover:bg-surface-700"
            onclick={(e) => { e.stopPropagation(); onEdit?.(); }}
            title="Edit"
          >
            <Pencil class="h-4 w-4 text-surface-500 hover:text-surface-200" />
          </button>
        {/if}
        {#if onDelete}
          <button
            class="rounded p-1.5 hover:bg-surface-700"
            onclick={handleConfirmDelete}
            title="Delete"
          >
            <Trash2 class="h-4 w-4 text-surface-500 hover:text-red-400" />
          </button>
        {/if}
      {/if}
    </div>
  {/if}
</div>
