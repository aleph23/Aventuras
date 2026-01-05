<script lang="ts">
  import { story } from '$lib/stores/story.svelte';
  import { ui } from '$lib/stores/ui.svelte';
  import { Sword, MessageCircle, Search, MapPin, Loader2 } from 'lucide-svelte';
  import type { ActionChoice } from '$lib/services/ai/actionChoices';

  // Icon mapping for choice types
  const typeIcons = {
    action: Sword,
    dialogue: MessageCircle,
    examine: Search,
    move: MapPin,
  };

  // Style classes for choice types
  const typeStyles = {
    action: 'border-l-red-500/50 hover:border-l-red-400',
    dialogue: 'border-l-blue-500/50 hover:border-l-blue-400',
    examine: 'border-l-yellow-500/50 hover:border-l-yellow-400',
    move: 'border-l-green-500/50 hover:border-l-green-400',
  };

  function handleChoiceClick(choice: ActionChoice) {
    // Set the pending action choice - ActionInput will pick this up and submit
    ui.setPendingActionChoice(choice.text, story.currentStory?.id);
  }

  // Key bindings for quick selection (1-4)
  function handleKeydown(event: KeyboardEvent) {
    if (ui.actionChoices.length === 0) return;

    const keyNum = parseInt(event.key);
    if (keyNum >= 1 && keyNum <= ui.actionChoices.length) {
      event.preventDefault();
      handleChoiceClick(ui.actionChoices[keyNum - 1]);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if ui.actionChoicesLoading}
  <div class="flex items-center justify-center gap-2 py-4 text-surface-400">
    <Loader2 class="h-4 w-4 animate-spin" />
    <span class="text-sm">Generating options...</span>
  </div>
{:else if ui.actionChoices.length > 0}
  <div class="mt-3 sm:mt-4 space-y-2">
    <div class="flex items-center gap-2 text-surface-500 text-xs uppercase tracking-wide mb-2">
      <span>What do you do?</span>
      <span class="text-surface-600 hidden sm:inline">(Press 1-{ui.actionChoices.length} to quick select)</span>
    </div>

    {#each ui.actionChoices as choice, index}
      {@const Icon = typeIcons[choice.type]}
      <button
        class="w-full text-left flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3 rounded-lg
               bg-surface-800/50 border-l-4 {typeStyles[choice.type]}
               hover:bg-surface-700/50 active:bg-surface-700 transition-all duration-150 group min-h-[52px]"
        onclick={() => handleChoiceClick(choice)}
      >
        <span class="flex items-center justify-center w-6 h-6 rounded bg-surface-700 text-surface-400
                     group-hover:bg-surface-600 group-hover:text-surface-200 text-sm font-mono flex-shrink-0">
          {index + 1}
        </span>
        <Icon class="h-4 w-4 text-surface-500 group-hover:text-surface-300 shrink-0" />
        <span class="text-surface-200 group-hover:text-surface-100 text-sm sm:text-base">
          {choice.text}
        </span>
      </button>
    {/each}
  </div>
{/if}
