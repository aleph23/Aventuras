<script lang="ts">
  import { story } from '$lib/stores/story.svelte';
  import { ui } from '$lib/stores/ui.svelte';
  import StoryEntry from './StoryEntry.svelte';
  import StreamingEntry from './StreamingEntry.svelte';
  import ActionInput from './ActionInput.svelte';
  import ActionChoices from './ActionChoices.svelte';

  let storyContainer: HTMLDivElement;

  // Auto-scroll to bottom when new entries are added or streaming content changes
  $effect(() => {
    // Track both entries and streaming state for scroll
    const _ = story.entries.length;
    const __ = ui.streamingContent;

    if (storyContainer) {
      storyContainer.scrollTop = storyContainer.scrollHeight;
    }
  });
</script>

<div class="flex h-full flex-col">
  <!-- Story entries container -->
  <div
    bind:this={storyContainer}
    class="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4"
  >
    <div class="mx-auto max-w-3xl space-y-3 sm:space-y-4">
      {#if story.entries.length === 0 && !ui.isStreaming}
        <div class="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-2">
          <p class="text-base sm:text-lg text-surface-400">Your adventure begins here...</p>
          <p class="mt-2 text-sm text-surface-500">
            Type an action below to start your story
          </p>
        </div>
      {:else}
        {#each story.entries as entry (entry.id)}
          <StoryEntry {entry} />
        {/each}

        <!-- Show streaming entry while generating -->
        {#if ui.isStreaming}
          <StreamingEntry />
        {/if}

        <!-- Show RPG-style action choices after narration (adventure mode only) -->
        {#if !ui.isStreaming && story.storyMode === 'adventure'}
          <ActionChoices />
        {/if}
      {/if}
    </div>
  </div>

  <!-- Action input area -->
  <div class="border-t border-surface-700 bg-surface-800 p-3 sm:p-4 pb-safe">
    <div class="mx-auto max-w-3xl">
      <ActionInput />
    </div>
  </div>
</div>
