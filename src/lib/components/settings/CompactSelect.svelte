<script lang="ts">
  import { ChevronDown, Check } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';

  interface Option {
    value: string | null;
    label: string;
  }

  interface Props {
    value: string | null;
    options: Option[];
    placeholder?: string;
    class?: string;
    onSelect?: (value: string | null) => void;
  }

  let { 
    value = $bindable(), 
    options, 
    placeholder = 'Select...', 
    class: className = '',
    onSelect 
  }: Props = $props();

  let isOpen = $state(false);
  let triggerElement: HTMLElement;
  let dropdownElement: HTMLElement;

  function toggle() {
    isOpen = !isOpen;
  }

  function select(option: Option) {
    value = option.value;
    isOpen = false;
    onSelect?.(option.value);
  }

  function handleOutsideClick(event: MouseEvent) {
    if (isOpen && 
        triggerElement && 
        !triggerElement.contains(event.target as Node) && 
        dropdownElement && 
        !dropdownElement.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  const selectedLabel = $derived(
    options.find(o => o.value === value)?.label ?? placeholder
  );
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="relative inline-block {className}">
  <button
    bind:this={triggerElement}
    class="w-full flex items-center justify-between gap-2 text-xs py-1.5 px-3 rounded-lg bg-surface-700/80 border border-surface-600/50 text-surface-200 hover:bg-surface-600/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500"
    onclick={(e) => { e.stopPropagation(); toggle(); }}
    type="button"
  >
    <span class="truncate">{selectedLabel}</span>
    <ChevronDown class="h-3.5 w-3.5 text-surface-400 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div
      bind:this={dropdownElement}
      class="absolute right-0 top-full mt-1 z-50 w-full min-w-[140px] max-h-[200px] overflow-y-auto rounded-lg border border-surface-600 bg-surface-800 shadow-xl"
      transition:fly={{ y: -5, duration: 150 }}
      onclick={(e) => e.stopPropagation()}
    >
      <div class="p-1">
        {#each options as option}
          <button
            class="w-full text-left px-3 py-2 rounded-md text-xs text-surface-200 hover:bg-surface-700 hover:text-white transition-colors flex items-center justify-between gap-2 {option.value === value ? 'bg-surface-700/50 text-accent-300' : ''}"
            onclick={() => select(option)}
            type="button"
          >
            <span class="truncate">{option.label}</span>
            {#if option.value === value}
              <Check class="h-3 w-3 text-accent-400 flex-shrink-0" />
            {/if}
          </button>
        {/each}
        {#if options.length === 0}
          <div class="px-3 py-2 text-xs text-surface-500 text-center">
            No options
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
