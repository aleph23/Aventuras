<script lang="ts">
  import { settings } from '$lib/stores/settings.svelte';
  import { Cpu, RefreshCw } from 'lucide-svelte';
  import ProviderOnlySelector from './ProviderOnlySelector.svelte';
  import type { ProviderInfo } from '$lib/services/ai/types';
  import { OpenAIProvider } from '$lib/services/ai/openrouter';
  import type { ReasoningEffort } from '$lib/types';

  interface Props {
    providerOptions: ProviderInfo[];
    onOpenManualBodyEditor: (title: string, value: string, onSave: (next: string) => void) => void;
  }

  let { providerOptions, onOpenManualBodyEditor }: Props = $props();

  const reasoningLevels: ReasoningEffort[] = ['off', 'low', 'medium', 'high'];
  const reasoningLabels: Record<ReasoningEffort, string> = {
    off: 'Off',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  let isLoadingModels = $state(false);
  let modelError = $state<string | null>(null);

  // Get models from main narrative profile (sorted by provider priority)
  let profileModels = $derived.by(() => {
    const profile = settings.getMainNarrativeProfile();
    if (!profile) return [];
    const models = [...new Set([...profile.fetchedModels, ...profile.customModels])];
    
    const providerPriority: Record<string, number> = {
      'x-ai': 1,
      'deepseek': 2,
      'openai': 3,
      'anthropic': 4,
      'google': 5,
      'meta-llama': 6,
      'mistralai': 7,
    };

    return models.sort((a, b) => {
      const providerA = a.split('/')[0];
      const providerB = b.split('/')[0];
      const priorityA = providerPriority[providerA] ?? 99;
      const priorityB = providerPriority[providerB] ?? 99;

      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.localeCompare(b);
    });
  });

  function getReasoningIndex(value?: ReasoningEffort): number {
    const index = reasoningLevels.indexOf(value ?? 'off');
    return index === -1 ? 0 : index;
  }

  function getReasoningValue(index: number): ReasoningEffort {
    const clamped = Math.min(Math.max(0, index), reasoningLevels.length - 1);
    return reasoningLevels[clamped];
  }

  async function handleSetMainNarrativeProfile(profileId: string) {
    await settings.setMainNarrativeProfile(profileId);
  }

  async function fetchModelsToProfile() {
    const profile = settings.getMainNarrativeProfile();
    if (!profile) return;
    if (isLoadingModels) return;

    isLoadingModels = true;
    modelError = null;

    try {
      const apiSettings = settings.getApiSettingsForProfile(profile.id);
      const provider = new OpenAIProvider(apiSettings);
      const fetchedModels = await provider.listModels();

      const filteredModelIds = fetchedModels
        .filter(m => {
          const id = m.id.toLowerCase();
          if (id.includes('embedding') || id.includes('vision-only') || id.includes('tts') || id.includes('whisper')) {
            return false;
          }
          return true;
        })
        .map(m => m.id);

      await settings.updateProfile(profile.id, {
        fetchedModels: filteredModelIds,
      });

      console.log(`[MainNarrative] Fetched ${filteredModelIds.length} models to profile`);
    } catch (error) {
      console.error('[MainNarrative] Failed to fetch models:', error);
      modelError = error instanceof Error ? error.message : 'Failed to load models.';
    } finally {
      isLoadingModels = false;
    }
  }
</script>

<div class="card bg-surface-800 p-4 border border-surface-700">
  <div class="flex items-center gap-2 mb-4">
    <Cpu class="h-5 w-5 text-accent-400" />
    <h3 class="text-sm font-semibold text-surface-100">Main Narrative</h3>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- API Endpoint -->
    <div>
      <label class="mb-1.5 block text-xs font-medium text-surface-400">
        API Endpoint
      </label>
      <select
        class="input text-sm"
        value={settings.apiSettings.mainNarrativeProfileId}
        onchange={(e) => handleSetMainNarrativeProfile(e.currentTarget.value)}
      >
        {#each settings.apiSettings.profiles as profile (profile.id)}
          <option value={profile.id}>
            {profile.name}
            {#if profile.id === settings.getDefaultProfileIdForProvider()} (Default){/if}
          </option>
        {/each}
      </select>
    </div>

    <!-- Model Select -->
    <div>
      <div class="mb-1.5 flex items-center justify-between">
        <label class="text-xs font-medium text-surface-400">
          Model
        </label>
        <button
          class="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 disabled:opacity-50"
          onclick={fetchModelsToProfile}
          disabled={isLoadingModels}
        >
          <span class={isLoadingModels ? 'animate-spin' : ''}>
            <RefreshCw class="h-3 w-3" />
          </span>
          Refresh
        </button>
      </div>
      
      {#if modelError}
        <p class="mb-1 text-xs text-amber-400">{modelError}</p>
      {/if}

      <select
        class="input text-sm"
        value={settings.apiSettings.defaultModel}
        onchange={(e) => settings.setDefaultModel(e.currentTarget.value)}
        disabled={isLoadingModels}
      >
        {#if isLoadingModels}
          <option>Loading models...</option>
        {:else if profileModels.length === 0}
          <option value="">No models - click Refresh</option>
        {:else}
          {#each profileModels as modelId}
            <option value={modelId}>{modelId}</option>
          {/each}
        {/if}
      </select>
      {#if profileModels.length > 0}
        <p class="mt-1 text-xs text-surface-500">
          {profileModels.length} models available
        </p>
      {/if}
    </div>
  </div>

  <!-- Temperature & Max Tokens Row -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-surface-700" class:opacity-50={settings.advancedRequestSettings.manualMode}>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-surface-400">
        Temperature: {settings.apiSettings.temperature.toFixed(1)}
      </label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={settings.apiSettings.temperature}
        oninput={(e) => settings.setTemperature(parseFloat(e.currentTarget.value))}
        disabled={settings.advancedRequestSettings.manualMode}
        class="w-full"
      />
      <div class="flex justify-between text-xs text-surface-500 mt-1">
        <span>Focused</span>
        <span>Creative</span>
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-medium text-surface-400">
        Max Tokens: {settings.apiSettings.maxTokens.toLocaleString()}
      </label>
      <input
        type="range"
        min="256"
        max="1000000"
        step="1"
        value={settings.apiSettings.maxTokens}
        oninput={(e) => settings.setMaxTokens(parseInt(e.currentTarget.value))}
        disabled={settings.advancedRequestSettings.manualMode}
        class="w-full"
      />
      <input
        type="number"
        min="256"
        max="1000000"
        value={settings.apiSettings.maxTokens}
        oninput={(e) => {
          const value = parseInt(e.currentTarget.value);
          if (!isNaN(value) && value >= 256 && value <= 1000000) {
            settings.setMaxTokens(value);
          }
        }}
        disabled={settings.advancedRequestSettings.manualMode}
        class="input w-full text-sm mt-2"
        placeholder="256 - 1,000,000"
      />
    </div>
  </div>

  <!-- Thinking & Provider Row -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-surface-700" class:opacity-50={settings.advancedRequestSettings.manualMode}>
    <div>
      <label class="mb-1.5 block text-xs font-medium text-surface-400">
        Thinking: {reasoningLabels[settings.apiSettings.reasoningEffort]}
      </label>
      <input
        type="range"
        min="0"
        max="3"
        step="1"
        value={getReasoningIndex(settings.apiSettings.reasoningEffort)}
        onchange={(e) => settings.setMainReasoningEffort(getReasoningValue(parseInt(e.currentTarget.value)))}
        disabled={settings.advancedRequestSettings.manualMode}
        class="w-full"
      />
      <div class="flex justify-between text-xs text-surface-500 mt-1">
        <span>Off</span>
        <span>Low</span>
        <span>Med</span>
        <span>High</span>
      </div>
    </div>

    <div>
      <ProviderOnlySelector
        providers={providerOptions}
        selected={settings.apiSettings.providerOnly}
        disabled={settings.advancedRequestSettings.manualMode}
        onChange={(next) => {
          settings.setMainProviderOnly(next);
        }}
      />
    </div>
  </div>

  {#if settings.advancedRequestSettings.manualMode}
    <div class="mt-4 pt-4 border-t border-surface-700">
      <div class="mb-1 flex items-center justify-between">
        <label class="text-xs font-medium text-surface-400">Manual Request Body (JSON)</label>
        <button
          class="text-xs text-accent-400 hover:text-accent-300"
          onclick={() => onOpenManualBodyEditor('Main Narrative', settings.apiSettings.manualBody, (next) => {
            settings.apiSettings.manualBody = next;
            settings.setMainManualBody(next);
          })}
        >
          Pop out
        </button>
      </div>
      <textarea
        bind:value={settings.apiSettings.manualBody}
        onblur={() => settings.setMainManualBody(settings.apiSettings.manualBody)}
        class="input text-xs min-h-[100px] resize-y font-mono w-full"
        rows="4"
      ></textarea>
      <p class="text-xs text-surface-500 mt-1">
        Overrides request parameters; messages and tools are managed by Aventura.
      </p>
    </div>
  {/if}
</div>
