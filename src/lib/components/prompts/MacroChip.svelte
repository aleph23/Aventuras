<script lang="ts">
  import { Variable, Settings2 } from 'lucide-svelte';
  import type { Macro } from '$lib/services/prompts';

  interface Props {
    macro: Macro;
    /** Whether this chip is in the editor (interactive) or just display */
    interactive?: boolean;
    /** Callback when the chip is clicked */
    onClick?: () => void;
    /** Optional class overrides */
    class?: string;
  }

  let {
    macro,
    interactive = true,
    onClick,
    class: className = '',
  }: Props = $props();

  const isComplex = macro.type === 'complex';
</script>

{#if interactive}
  <button
    type="button"
    class="macro-chip {isComplex ? 'macro-chip-complex' : 'macro-chip-simple'} {className}"
    onclick={onClick}
    title={macro.description}
  >
    {#if isComplex}
      <Settings2 class="h-3 w-3" />
    {:else}
      <Variable class="h-3 w-3" />
    {/if}
    <span class="macro-chip-label">{macro.name}</span>
  </button>
{:else}
  <span
    class="macro-chip {isComplex ? 'macro-chip-complex' : 'macro-chip-simple'} {className}"
    title={macro.description}
  >
    {#if isComplex}
      <Settings2 class="h-3 w-3" />
    {:else}
      <Variable class="h-3 w-3" />
    {/if}
    <span class="macro-chip-label">{macro.name}</span>
  </span>
{/if}

<style>
  .macro-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25rem;
    white-space: nowrap;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }

  .macro-chip-simple {
    background-color: var(--color-accent-900, #1e3a5f);
    color: var(--color-accent-300, #7dd3fc);
    border-color: var(--color-accent-700, #0369a1);
  }

  .macro-chip-complex {
    background-color: var(--color-surface-800, #27272a);
    color: var(--color-surface-300, #a1a1aa);
    border-color: var(--color-surface-600, #52525b);
  }

  button.macro-chip {
    cursor: pointer;
  }

  button.macro-chip:hover {
    filter: brightness(1.2);
    transform: translateY(-1px);
  }

  button.macro-chip-simple:hover {
    border-color: var(--color-accent-500, #0ea5e9);
  }

  button.macro-chip-complex:hover {
    border-color: var(--color-surface-400, #71717a);
  }

  .macro-chip-label {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
