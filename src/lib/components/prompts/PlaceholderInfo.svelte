<script lang="ts">
  import { X, Info, Database, BookOpen, Wand2, FileText } from 'lucide-svelte';
  import type { ContextPlaceholder } from '$lib/services/prompts';

  interface Props {
    isOpen: boolean;
    placeholder: ContextPlaceholder;
    onClose: () => void;
  }

  let { isOpen, placeholder, onClose }: Props = $props();

  // Category icons and labels
  const categoryInfo: Record<string, { icon: typeof Info; label: string; color: string }> = {
    story: { icon: FileText, label: 'Story Context', color: 'text-blue-400' },
    entities: { icon: Database, label: 'Entity Tracking', color: 'text-green-400' },
    memory: { icon: BookOpen, label: 'Memory System', color: 'text-purple-400' },
    wizard: { icon: Wand2, label: 'Story Wizard', color: 'text-amber-400' },
    other: { icon: Info, label: 'Other', color: 'text-surface-400' },
  };

  const catInfo = $derived(categoryInfo[placeholder.category] || categoryInfo.other);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="placeholder-info-title"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onclick={onClose}
      role="presentation"
    ></div>

    <!-- Modal -->
    <div
      class="relative z-10 w-full max-w-md rounded-xl border border-surface-700 bg-surface-900 shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-700 px-4 py-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-surface-800 {catInfo.color}">
            <svelte:component this={catInfo.icon} class="h-4 w-4" />
          </div>
          <div>
            <h2 id="placeholder-info-title" class="text-base font-semibold text-surface-100">
              {placeholder.name}
            </h2>
            <p class="text-xs {catInfo.color}">{catInfo.label}</p>
          </div>
        </div>
        <button
          class="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
          onclick={onClose}
          title="Close"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-4">
        <!-- Token display -->
        <div>
          <label class="block text-xs font-medium text-surface-500 mb-1">Token</label>
          <code class="block px-3 py-2 rounded-lg bg-surface-800 text-sm text-surface-300 font-mono">
            {'{{' + placeholder.token + '}}'}
          </code>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-medium text-surface-500 mb-1">Description</label>
          <p class="text-sm text-surface-300 leading-relaxed">
            {placeholder.description}
          </p>
        </div>

        <!-- Info note -->
        <div class="flex items-start gap-2 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
          <Info class="h-4 w-4 text-surface-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-surface-400 leading-relaxed">
            This is a <strong class="text-surface-300">context placeholder</strong> that gets automatically
            filled with data at runtime. It cannot be edited directly, but you can move or remove it
            within this prompt template. It will not be populated if moved to a different prompt.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end border-t border-surface-700 px-4 py-3">
        <button class="btn btn-secondary text-sm" onclick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
