<script lang="ts">
  import { settings } from '$lib/stores/settings.svelte';
  import { promptExportService } from '$lib/services/promptExport';
  import type {
    ParsedPromptImport,
    ImportPresetConfig,
    ReasoningEffort,
  } from '$lib/types';
  import {
    X,
    Upload,
    FileJson,
    Loader2,
    Check,
    AlertCircle,
    AlertTriangle,
    ChevronDown,
    Sparkles,
  } from 'lucide-svelte';
  import { swipe } from '$lib/utils/swipe';
  import { fly, fade, slide } from 'svelte/transition';
  import CompactSelect from './CompactSelect.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  // State
  let currentStep = $state<1 | 2 | 3>(1);
  let fileInput: HTMLInputElement;
  let dragOver = $state(false);
  let parseResult = $state<ParsedPromptImport | null>(null);
  let error = $state<string | null>(null);
  let presetConfigs = $state<Map<string, ImportPresetConfig>>(new Map());
  let expandedPreset = $state<string | null>(null);
  let isImporting = $state(false);
  let importSuccess = $state(false);

  // Derived
  const availableProfiles = $derived(
    settings.apiSettings.profiles.map(p => ({ id: p.id, name: p.name }))
  );

  function getAvailableModelsForProfile(profileId: string): string[] {
    const profile = settings.apiSettings.profiles.find(p => p.id === profileId);
    if (!profile) return [];
    return [...profile.customModels, ...profile.fetchedModels];
  }

  const importStats = $derived.by(() => {
    if (!parseResult?.data) return null;
    const data = parseResult.data;
    return {
      customMacros: data.promptSettings.customMacros.length,
      macroOverrides: data.promptSettings.macroOverrides.length,
      templateOverrides: data.promptSettings.templateOverrides.length,
      presets: data.generationPresets.length,
    };
  });

  const stepTitles = ['Select File', 'Configure', 'Import'];

  // Functions
  function resetState() {
    currentStep = 1;
    parseResult = null;
    error = null;
    presetConfigs = new Map();
    expandedPreset = null;
    isImporting = false;
    importSuccess = false;
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  async function processFile(file: File) {
    error = null;
    parseResult = null;

    if (!file.name.endsWith('.json')) {
      error = 'Please select a JSON file';
      return;
    }

    try {
      const text = await file.text();
      const result = promptExportService.parseImportFile(text);

      if (!result.success) {
        error = result.errors.join(', ');
        return;
      }

      parseResult = result;

      const configs = new Map<string, ImportPresetConfig>();
      const profiles = settings.apiSettings.profiles;
      const defaultProfileId = profiles.length > 0 ? profiles[0].id : '';

      for (const preset of result.data!.generationPresets) {
        configs.set(preset.id, {
          presetId: preset.id,
          presetName: preset.name,
          profileId: defaultProfileId,
          model: preset.model,
          temperature: preset.temperature,
          maxTokens: preset.maxTokens,
          reasoningEffort: preset.reasoningEffort,
          providerOnly: [...preset.providerOnly],
          manualBody: preset.manualBody,
        });
      }
      presetConfigs = configs;
      currentStep = 2;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to read file';
    }
  }

  function updatePresetConfig(presetId: string, updates: Partial<ImportPresetConfig>) {
    const newConfigs = new Map(presetConfigs);
    const config = newConfigs.get(presetId)!;
    newConfigs.set(presetId, { ...config, ...updates });
    presetConfigs = newConfigs;
  }

  function togglePresetExpanded(presetId: string) {
    expandedPreset = expandedPreset === presetId ? null : presetId;
  }

  async function handleImport() {
    if (!parseResult?.data) return;

    isImporting = true;
    error = null;

    try {
      await promptExportService.applyImport(parseResult.data, presetConfigs);
      importSuccess = true;
      currentStep = 3;

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Import failed';
    } finally {
      isImporting = false;
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    onclick={handleClose}
    onkeydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 150 }}
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

    <!-- Modal -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="relative w-full sm:max-w-xl bg-surface-900 sm:rounded-2xl rounded-t-2xl rounded-b-none shadow-2xl border border-surface-700/50 max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
      use:swipe={{ onSwipeDown: handleClose, threshold: 50 }}
      transition:fly={{ y: 100, duration: 200 }}
    >
      <!-- Mobile Handle -->
      <div class="sm:hidden flex justify-center pt-3 pb-2">
        <div class="w-12 h-1.5 rounded-full bg-surface-600"></div>
      </div>

      <!-- Header -->
      <div class="px-5 sm:px-6 pt-2 sm:pt-5 pb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-accent-500/10">
              <Upload class="h-5 w-5 text-accent-400" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-surface-100">Import Prompts</h2>
              <p class="text-xs text-surface-500">{stepTitles[currentStep - 1]}</p>
            </div>
          </div>
          <button
            class="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            onclick={handleClose}
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Progress Steps -->
        <div class="flex items-center gap-2 mt-4">
          {#each [1, 2, 3] as step}
            <div class="flex-1 flex items-center gap-2">
              <div
                class="h-1.5 flex-1 rounded-full transition-all duration-300 {
                  step < currentStep ? 'bg-accent-500' :
                  step === currentStep ? 'bg-accent-500' : 'bg-surface-700'
                }"
              ></div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">
        <!-- Error Message -->
        {#if error}
          <div class="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3" transition:fly={{ y: -10, duration: 200 }}>
            <AlertCircle class="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p class="text-red-300 text-sm">{error}</p>
          </div>
        {/if}

        <!-- Warnings -->
        {#if parseResult?.warnings && parseResult.warnings.length > 0}
          <div class="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle class="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div class="text-amber-300 text-sm">
              {#each parseResult.warnings as warning}
                <p>{warning}</p>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Step 1: File Upload -->
        {#if currentStep === 1}
          <div class="space-y-4" transition:fade={{ duration: 150 }}>
            <div
              class="border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer {
                dragOver
                  ? 'border-accent-500 bg-accent-500/5 scale-[1.02]'
                  : 'border-surface-600 hover:border-surface-500 hover:bg-surface-800/30'
              }"
              ondrop={handleDrop}
              ondragover={handleDragOver}
              ondragleave={handleDragLeave}
              role="button"
              tabindex="0"
              onclick={() => fileInput.click()}
              onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
            >
              <div class="inline-flex p-4 rounded-2xl bg-surface-800/50 mb-4">
                <FileJson class="h-10 w-10 text-surface-400" />
              </div>
              <p class="text-surface-200 font-medium mb-1">Drop your file here</p>
              <p class="text-sm text-surface-500">or click to browse</p>
            </div>
            <input
              type="file"
              accept=".json,application/json"
              class="hidden"
              bind:this={fileInput}
              onchange={handleFileSelect}
            />
            <p class="text-center text-xs text-surface-500">
              Supports Aventura prompt export files (.json)
            </p>
          </div>

        <!-- Step 2: Configure Presets -->
        {:else if currentStep === 2 && parseResult?.data}
          <div class="space-y-4" transition:fade={{ duration: 150 }}>
            <!-- Stats Summary -->
            {#if importStats}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div class="p-3 rounded-xl bg-surface-800/50 text-center">
                  <div class="text-lg font-semibold text-surface-100">{importStats.templateOverrides}</div>
                  <div class="text-xs text-surface-500">Prompts</div>
                </div>
                <div class="p-3 rounded-xl bg-surface-800/50 text-center">
                  <div class="text-lg font-semibold text-surface-100">{importStats.customMacros}</div>
                  <div class="text-xs text-surface-500">Macros</div>
                </div>
                <div class="p-3 rounded-xl bg-surface-800/50 text-center">
                  <div class="text-lg font-semibold text-surface-100">{importStats.macroOverrides}</div>
                  <div class="text-xs text-surface-500">Overrides</div>
                </div>
                <div class="p-3 rounded-xl bg-surface-800/50 text-center">
                  <div class="text-lg font-semibold text-surface-100">{importStats.presets}</div>
                  <div class="text-xs text-surface-500">Presets</div>
                </div>
              </div>
            {/if}

            <!-- Presets Configuration -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-surface-300">Generation Presets</h3>
              </div>

              <div class="space-y-2">
                {#each parseResult.data.generationPresets as preset (preset.id)}
                  {@const config = presetConfigs.get(preset.id)!}
                  {@const isExpanded = expandedPreset === preset.id}
                  {@const availableModels = getAvailableModelsForProfile(config.profileId)}

                   <div class="rounded-xl border border-surface-700 bg-surface-800/30 transition-all">
                    <!-- Preset Header with Profile & Model (always visible) -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div
                      class="w-full px-3 py-2.5 flex flex-col gap-2 text-left hover:bg-surface-800/50 transition-colors cursor-pointer rounded-t-xl {isExpanded ? '' : 'rounded-b-xl'} focus:outline-none"
                      onclick={() => togglePresetExpanded(preset.id)}
                      role="button"
                      tabindex="0"
                    >
                      <!-- Header Row (Icon + Name + Original Model) -->
                      <div class="flex items-center gap-3 w-full min-w-0">
                        <Sparkles class="h-4 w-4 text-accent-400 flex-shrink-0" />
                        <div class="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                          <span class="text-sm font-medium text-surface-100 truncate">{preset.name}</span>
                          <span class="text-xs text-surface-500 truncate border-l border-surface-700 pl-2">
                            Was: <span class="text-surface-400">{preset.model}</span>
                          </span>
                        </div>
                        <ChevronDown class="h-4 w-4 text-surface-400 transition-transform flex-shrink-0 {isExpanded ? 'rotate-180' : ''}" />
                      </div>
                      
                      <!-- Controls Row -->
                      <div class="flex items-center gap-2 w-full">
                        <!-- Profile Select -->
                        <CompactSelect
                          value={config.profileId}
                          options={availableProfiles.map(p => ({ value: p.id, label: p.name }))}
                          class="flex-1"
                          onSelect={(newProfileId) => {
                            if (!newProfileId) return;
                            const models = getAvailableModelsForProfile(newProfileId);
                            const newModel = models.length > 0 ? models[0] : config.model;
                            updatePresetConfig(preset.id, {
                              profileId: newProfileId,
                              model: newModel
                            });
                          }}
                        />

                        <!-- Model Select -->
                        <CompactSelect
                          value={config.model}
                          options={availableModels.length > 0
                            ? availableModels.map(m => ({ value: m, label: m }))
                            : [{ value: null, label: 'No models' }]
                          }
                          class="flex-1"
                          placeholder="Select model"
                          onSelect={(newModel) => {
                            if (newModel) {
                              updatePresetConfig(preset.id, { model: newModel });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <!-- Expanded Settings -->
                    {#if isExpanded}
                      <div class="px-3 pb-3 pt-2 border-t border-surface-700/30" transition:slide={{ duration: 200 }}>
                        <div class="grid grid-cols-2 gap-2">

                          <!-- Temperature -->
                          <div>
                            <label class="text-xs text-surface-500 mb-1 block">Temperature</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="2"
                              class="w-full px-2 py-1.5 rounded-md bg-surface-700/50 border border-surface-600 text-surface-100 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
                              value={config.temperature}
                              oninput={(e) => updatePresetConfig(preset.id, { temperature: parseFloat(e.currentTarget.value) || 0 })}
                            />
                          </div>

                          <!-- Max Tokens -->
                          <div>
                            <label class="text-xs text-surface-500 mb-1 block">Max Tokens</label>
                            <input
                              type="number"
                              min="1"
                              class="w-full px-2 py-1.5 rounded-md bg-surface-700/50 border border-surface-600 text-surface-100 text-sm focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
                              value={config.maxTokens}
                              oninput={(e) => updatePresetConfig(preset.id, { maxTokens: parseInt(e.currentTarget.value) || 1 })}
                            />
                          </div>

                          <!-- Reasoning Effort -->
                          <div class="col-span-2">
                            <label class="text-xs text-surface-500 mb-1 block">Reasoning</label>
                            <div class="grid grid-cols-4 gap-1">
                              {#each ['off', 'low', 'medium', 'high'] as level}
                                <button
                                  class="py-1.5 px-2 rounded-md text-xs font-medium transition-colors {
                                    config.reasoningEffort === level
                                      ? 'bg-accent-500 text-white'
                                      : 'bg-surface-700/50 text-surface-400 hover:bg-surface-700'
                                  }"
                                  onclick={() => updatePresetConfig(preset.id, { reasoningEffort: level as ReasoningEffort })}
                                >
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                              {/each}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <!-- Warning -->
            <div class="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
              <AlertTriangle class="h-5 w-5 text-amber-400 flex-shrink-0" />
              <p class="text-xs text-amber-300/80">
                Importing will <span class="font-medium text-amber-300">replace</span> all current prompts, macros, and presets.
              </p>
            </div>
          </div>

        <!-- Step 3: Success -->
        {:else if currentStep === 3}
          <div class="py-8 text-center" transition:fade={{ duration: 150 }}>
            <div class="inline-flex p-4 rounded-full bg-green-500/10 mb-4">
              <Check class="h-10 w-10 text-green-400" />
            </div>
            <h3 class="text-xl font-semibold text-surface-100 mb-2">Import Complete!</h3>
            <p class="text-surface-400">Your prompts have been imported successfully.</p>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if currentStep !== 3}
        <div class="px-5 sm:px-6 py-4 border-t border-surface-700/50 bg-surface-800/30">
          <div class="flex gap-3">
            {#if currentStep === 1}
              <button
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-surface-300 bg-surface-700/50 hover:bg-surface-700 transition-colors"
                onclick={handleClose}
              >
                Cancel
              </button>
            {:else if currentStep === 2}
              <button
                class="py-2.5 px-4 rounded-xl text-sm font-medium text-surface-300 bg-surface-700/50 hover:bg-surface-700 transition-colors"
                onclick={() => { currentStep = 1; parseResult = null; }}
              >
                Back
              </button>
              <button
                class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 transition-colors flex items-center justify-center gap-2"
                onclick={handleImport}
                disabled={isImporting}
              >
                {#if isImporting}
                  <Loader2 class="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                {:else}
                  <span>Import</span>
                {/if}
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Safe area padding for mobile -->
      <div class="h-safe sm:hidden"></div>
    </div>
  </div>
{/if}

<style>
  .h-safe {
    height: env(safe-area-inset-bottom, 0);
  }
</style>
