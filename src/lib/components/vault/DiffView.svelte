<script lang="ts">
  import type { PendingChange } from '$lib/services/ai/interactiveLorebook';
  import type { VaultLorebookEntry } from '$lib/types';
  import { Check, X, ArrowRight, Trash2, GitMerge, Plus } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    change: PendingChange;
    onApprove: () => void;
    onReject: () => void;
  }

  let { change, onApprove, onReject }: Props = $props();

  // Format entry for display
  function formatEntry(entry: VaultLorebookEntry | undefined): string {
    if (!entry) return '';
    return [
      `Name: ${entry.name}`,
      `Type: ${entry.type}`,
      `Description: ${entry.description}`,
      entry.keywords.length > 0 ? `Keywords: ${entry.keywords.join(', ')}` : null,
      `Injection: ${entry.injectionMode}`,
      `Priority: ${entry.priority}`,
      entry.group ? `Group: ${entry.group}` : null,
      entry.disabled ? `Status: Disabled` : null,
    ].filter(Boolean).join('\n');
  }

  // Format updates for display
  function formatUpdates(updates: Partial<VaultLorebookEntry> | undefined): string {
    if (!updates) return '';
    const lines: string[] = [];
    if (updates.name !== undefined) lines.push(`Name: ${updates.name}`);
    if (updates.type !== undefined) lines.push(`Type: ${updates.type}`);
    if (updates.description !== undefined) lines.push(`Description: ${updates.description}`);
    if (updates.keywords !== undefined) lines.push(`Keywords: ${updates.keywords.join(', ')}`);
    if (updates.injectionMode !== undefined) lines.push(`Injection: ${updates.injectionMode}`);
    if (updates.priority !== undefined) lines.push(`Priority: ${updates.priority}`);
    if (updates.group !== undefined) lines.push(`Group: ${updates.group ?? '(none)'}`);
    if (updates.disabled !== undefined) lines.push(`Status: ${updates.disabled ? 'Disabled' : 'Enabled'}`);
    return lines.join('\n');
  }

  // Get the merged entry with updates applied
  function getMergedView(previous: VaultLorebookEntry, updates: Partial<VaultLorebookEntry>): VaultLorebookEntry {
    return { ...previous, ...updates };
  }
</script>

<div class="rounded-lg border border-surface-600 bg-surface-800 overflow-hidden" in:fade={{ duration: 150 }}>
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 sm:px-4 bg-surface-700/50 border-b border-surface-600">
    <div class="flex items-center gap-2">
      {#if change.type === 'create'}
        <Plus class="h-4 w-4 text-green-400" />
        <span class="text-sm font-medium text-green-400">Create Entry</span>
      {:else if change.type === 'update'}
        <ArrowRight class="h-4 w-4 text-blue-400" />
        <span class="text-sm font-medium text-blue-400">Update Entry</span>
      {:else if change.type === 'delete'}
        <Trash2 class="h-4 w-4 text-red-400" />
        <span class="text-sm font-medium text-red-400">Delete Entry</span>
      {:else if change.type === 'merge'}
        <GitMerge class="h-4 w-4 text-purple-400" />
        <span class="text-sm font-medium text-purple-400">Merge Entries</span>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <button
        class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40 text-sm font-medium transition-colors"
        onclick={onReject}
      >
        <X class="h-4 w-4" />
        Reject
      </button>
      <button
        class="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 active:bg-green-500/40 text-sm font-medium transition-colors"
        onclick={onApprove}
      >
        <Check class="h-4 w-4" />
        Approve
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="p-3 sm:p-4">
    {#if change.type === 'create'}
      <!-- Create: Show new entry -->
      <div class="rounded-md bg-green-500/10 border border-green-500/30 p-3">
        <div class="text-xs font-medium text-green-400 mb-2">New Entry</div>
        <pre class="text-sm text-surface-200 whitespace-pre-wrap font-mono">{formatEntry(change.entry)}</pre>
      </div>

    {:else if change.type === 'update'}
      <!-- Update: Stacked on mobile, side-by-side on desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <!-- Old (Previous) -->
        <div class="rounded-md bg-red-500/10 border border-red-500/30 p-3">
          <div class="text-xs font-medium text-red-400 mb-2">Before</div>
          <pre class="text-sm text-surface-300 whitespace-pre-wrap font-mono">{formatEntry(change.previous)}</pre>
        </div>

        <!-- New (With updates applied) -->
        <div class="rounded-md bg-green-500/10 border border-green-500/30 p-3">
          <div class="text-xs font-medium text-green-400 mb-2">After</div>
          {#if change.previous && change.updates}
            <pre class="text-sm text-surface-200 whitespace-pre-wrap font-mono">{formatEntry(getMergedView(change.previous, change.updates))}</pre>
          {/if}
        </div>
      </div>

      <!-- Changes summary -->
      <div class="mt-3 rounded-md bg-blue-500/10 border border-blue-500/30 p-3">
        <div class="text-xs font-medium text-blue-400 mb-2">Changes</div>
        <pre class="text-sm text-surface-200 whitespace-pre-wrap font-mono">{formatUpdates(change.updates)}</pre>
      </div>

    {:else if change.type === 'delete'}
      <!-- Delete: Show entry being removed -->
      <div class="rounded-md bg-red-500/10 border border-red-500/30 p-3">
        <div class="text-xs font-medium text-red-400 mb-2">Entry to Delete</div>
        <pre class="text-sm text-surface-300 whitespace-pre-wrap font-mono line-through opacity-70">{formatEntry(change.previous)}</pre>
      </div>

    {:else if change.type === 'merge'}
      <!-- Merge: Show source entries and result -->
      <div class="space-y-4">
        <!-- Source entries -->
        <div class="rounded-md bg-red-500/10 border border-red-500/30 p-3">
          <div class="text-xs font-medium text-red-400 mb-2">Entries to Merge ({change.previousEntries?.length ?? 0})</div>
          <div class="space-y-2">
            {#each change.previousEntries ?? [] as entry, i}
              <div class="bg-surface-700/50 rounded p-2">
                <div class="text-xs text-surface-400 mb-1">Entry {i + 1}: {entry.name}</div>
                <pre class="text-sm text-surface-300 whitespace-pre-wrap font-mono">{formatEntry(entry)}</pre>
              </div>
            {/each}
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex justify-center">
          <ArrowRight class="h-5 w-5 text-purple-400 rotate-90" />
        </div>

        <!-- Merged result -->
        <div class="rounded-md bg-green-500/10 border border-green-500/30 p-3">
          <div class="text-xs font-medium text-green-400 mb-2">Merged Entry</div>
          <pre class="text-sm text-surface-200 whitespace-pre-wrap font-mono">{formatEntry(change.entry)}</pre>
        </div>
      </div>
    {/if}
  </div>
</div>
