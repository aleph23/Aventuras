<script lang="ts">
  import { Code, Eye, Plus, RotateCcw, Check, ChevronDown, Info } from 'lucide-svelte';
  import { promptService, type Macro, type PromptTemplate, type MacroOverride, type ComplexMacro, type SimpleMacro, type ContextPlaceholder, getPlaceholderByToken } from '$lib/services/prompts';
  import MacroChip from './MacroChip.svelte';
  import MacroEditor from './MacroEditor.svelte';
  import ComplexMacroEditor from './ComplexMacroEditor.svelte';
  import PlaceholderInfo from './PlaceholderInfo.svelte';

  interface Props {
    /** The prompt template being edited */
    template: PromptTemplate;
    /** Current system prompt content (may be overridden) */
    content: string;
    /** Current user prompt content (may be overridden) */
    userContent?: string;
    /** Whether the system content has been modified from default */
    isModified?: boolean;
    /** Whether the user content has been modified from default */
    isUserModified?: boolean;
    /** Current story context for complex macro preview */
    currentContext?: {
      mode?: 'adventure' | 'creative-writing';
      pov?: 'first' | 'second' | 'third';
      tense?: 'past' | 'present';
    };
    /** Macro overrides for display */
    macroOverrides?: MacroOverride[];
    /** Callback when system content changes */
    onChange: (content: string) => void;
    /** Callback when user content changes */
    onUserChange?: (content: string) => void;
    /** Callback to reset system content to default */
    onReset: () => void;
    /** Callback to reset user content to default */
    onUserReset?: () => void;
    /** Callback when a macro override changes */
    onMacroOverride?: (override: MacroOverride) => void;
    /** Callback when a macro override is reset */
    onMacroReset?: (macroId: string) => void;
  }

  let {
    template,
    content,
    userContent,
    isModified = false,
    isUserModified = false,
    currentContext,
    macroOverrides = [],
    onChange,
    onUserChange,
    onReset,
    onUserReset,
    onMacroOverride,
    onMacroReset,
  }: Props = $props();

  // Check if template has user content
  const hasUserPrompt = $derived(template.userContent !== undefined && template.userContent.length > 0);

  // Active prompt tab (system or user)
  let activeTab = $state<'system' | 'user'>('system');

  // Get the current content based on active tab
  const currentContent = $derived(activeTab === 'system' ? content : (userContent ?? ''));
  const currentIsModified = $derived(activeTab === 'system' ? isModified : isUserModified);

  // View mode state
  let viewMode = $state<'visual' | 'raw'>('visual');
  let showMacroMenu = $state(false);
  let menuPosition = $state({ x: 0, y: 0 });

  // Editor modals
  let editingMacro = $state<Macro | null>(null);
  let showSimpleEditor = $state(false);
  let showComplexEditor = $state(false);

  // Placeholder info modal
  let viewingPlaceholder = $state<ContextPlaceholder | null>(null);
  let showPlaceholderInfo = $state(false);

  // Get all available macros
  const allMacros = $derived(promptService.getAllMacros());

  // Parse content into segments (text, macros, and placeholders)
  let segments = $derived.by(() => {
    const textToParse = currentContent;
    const result: Array<{
      type: 'text' | 'macro' | 'placeholder';
      content: string;
      macro?: Macro;
      placeholder?: ContextPlaceholder;
    }> = [];
    const regex = /\{\{(\w+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(textToParse)) !== null) {
      // Add text before the token
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: textToParse.slice(lastIndex, match.index),
        });
      }

      // Find if this is a macro or a context placeholder
      const token = match[1];
      const macro = allMacros.find(m => m.token === token);
      const placeholder = getPlaceholderByToken(token);

      if (macro) {
        result.push({
          type: 'macro',
          content: match[0],
          macro,
        });
      } else if (placeholder) {
        result.push({
          type: 'placeholder',
          content: match[0],
          placeholder,
        });
      } else {
        // Unknown token - treat as text with special styling
        result.push({
          type: 'text',
          content: match[0],
        });
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < textToParse.length) {
      result.push({
        type: 'text',
        content: textToParse.slice(lastIndex),
      });
    }

    return result;
  });

  // Handle content change based on active tab
  function handleContentChange(newContent: string) {
    if (activeTab === 'system') {
      onChange(newContent);
    } else {
      onUserChange?.(newContent);
    }
  }

  // Handle reset based on active tab
  function handleReset() {
    if (activeTab === 'system') {
      onReset();
    } else {
      onUserReset?.();
    }
  }

  // Find macro override
  function findMacroOverride(macroId: string): MacroOverride | undefined {
    return macroOverrides.find(o => o.macroId === macroId);
  }

  // Handle macro chip click
  function handleMacroClick(macro: Macro) {
    editingMacro = macro;
    if (macro.type === 'simple') {
      showSimpleEditor = true;
    } else {
      showComplexEditor = true;
    }
  }

  // Handle simple macro save
  function handleSimpleSave(value: string) {
    if (!editingMacro || editingMacro.type !== 'simple') return;

    onMacroOverride?.({
      macroId: editingMacro.id,
      value,
    });

    showSimpleEditor = false;
    editingMacro = null;
  }

  // Handle complex macro save
  function handleComplexSave(variantOverrides: import('$lib/services/prompts').MacroVariant[]) {
    if (!editingMacro || editingMacro.type !== 'complex') return;

    onMacroOverride?.({
      macroId: editingMacro.id,
      variantOverrides,
    });

    showComplexEditor = false;
    editingMacro = null;
  }

  // Handle macro reset
  function handleMacroReset() {
    if (!editingMacro) return;
    onMacroReset?.(editingMacro.id);
    showSimpleEditor = false;
    showComplexEditor = false;
    editingMacro = null;
  }

  // Handle placeholder click - show info modal
  function handlePlaceholderClick(placeholder: ContextPlaceholder) {
    viewingPlaceholder = placeholder;
    showPlaceholderInfo = true;
  }

  // Insert macro at cursor position (raw mode)
  let textareaRef: HTMLTextAreaElement | undefined;

  function insertMacro(macro: Macro) {
    if (viewMode !== 'raw' || !textareaRef) {
      // In visual mode, just append
      handleContentChange(currentContent + `{{${macro.token}}}`);
    } else {
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      const newContent = currentContent.slice(0, start) + `{{${macro.token}}}` + currentContent.slice(end);
      handleContentChange(newContent);

      // Restore cursor position after the inserted macro
      requestAnimationFrame(() => {
        if (textareaRef) {
          const newPos = start + macro.token.length + 4; // +4 for {{ and }}
          textareaRef.setSelectionRange(newPos, newPos);
          textareaRef.focus();
        }
      });
    }
    showMacroMenu = false;
  }

  function toggleMacroMenu(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();
    menuPosition = {
      x: rect.left,
      y: rect.bottom + 4,
    };
    showMacroMenu = !showMacroMenu;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.macro-menu') && !target.closest('.macro-menu-trigger')) {
      showMacroMenu = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="prompt-editor">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
    <div class="flex items-center gap-2">
      <h3 class="text-sm font-medium text-surface-200">{template.name}</h3>
      {#if currentIsModified}
        <span class="text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-700/30">
          Modified
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-1 flex-wrap">
      <!-- View mode toggle -->
      <div class="flex items-center rounded-lg bg-surface-800 p-0.5">
        <button
          class="view-toggle {viewMode === 'visual' ? 'view-toggle-active' : ''}"
          onclick={() => viewMode = 'visual'}
          title="Visual mode"
        >
          <Eye class="h-3.5 w-3.5" />
        </button>
        <button
          class="view-toggle {viewMode === 'raw' ? 'view-toggle-active' : ''}"
          onclick={() => viewMode = 'raw'}
          title="Raw mode"
        >
          <Code class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Insert macro button -->
      <div class="relative">
        <button
          class="macro-menu-trigger btn btn-ghost text-xs flex items-center gap-1 px-2 py-1"
          onclick={toggleMacroMenu}
        >
          <Plus class="h-3.5 w-3.5" />
          <span class="hidden xs:inline">Insert Macro</span>
          <span class="xs:hidden">Macro</span>
          <ChevronDown class="h-3 w-3" />
        </button>

        {#if showMacroMenu}
          <div
            class="macro-menu fixed z-50 w-64 max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto rounded-lg border border-surface-700 bg-surface-900 shadow-xl"
            style="left: min({menuPosition.x}px, calc(100vw - 17rem)); top: {menuPosition.y}px;"
          >
            <div class="p-2 space-y-1">
              <div class="text-xs text-surface-500 px-2 py-1">Simple Macros</div>
              {#each allMacros.filter(m => m.type === 'simple') as macro}
                <button
                  class="w-full text-left px-2 py-1.5 rounded hover:bg-surface-800 text-sm text-surface-300"
                  onclick={() => insertMacro(macro)}
                >
                  <span class="font-medium">{macro.name}</span>
                  <span class="text-xs text-surface-500 ml-2 hidden sm:inline">{'{{' + macro.token + '}}'}</span>
                </button>
              {/each}

              <div class="border-t border-surface-700 my-2"></div>

              <div class="text-xs text-surface-500 px-2 py-1">Complex Macros</div>
              {#each allMacros.filter(m => m.type === 'complex') as macro}
                <button
                  class="w-full text-left px-2 py-1.5 rounded hover:bg-surface-800 text-sm text-surface-300"
                  onclick={() => insertMacro(macro)}
                >
                  <span class="font-medium">{macro.name}</span>
                  <span class="text-xs text-surface-500 ml-2 hidden sm:inline">{'{{' + macro.token + '}}'}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Reset button -->
      {#if currentIsModified}
        <button
          class="btn btn-ghost text-xs flex items-center gap-1 px-2 py-1 text-surface-400 hover:text-red-400"
          onclick={handleReset}
          title="Reset to default"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          <span class="hidden xs:inline">Reset</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Description -->
  <p class="text-xs text-surface-500 mb-2">{template.description}</p>

  <!-- System/User Tabs (only show if template has user content) -->
  {#if hasUserPrompt}
    <div class="flex items-center gap-1 mb-3">
      <button
        class="prompt-tab {activeTab === 'system' ? 'prompt-tab-active' : ''}"
        onclick={() => activeTab = 'system'}
      >
        System Prompt
        {#if isModified}
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1"></span>
        {/if}
      </button>
      <button
        class="prompt-tab {activeTab === 'user' ? 'prompt-tab-active' : ''}"
        onclick={() => activeTab = 'user'}
      >
        User Message
        {#if isUserModified}
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1"></span>
        {/if}
      </button>
    </div>
  {/if}

  <!-- Content area -->
  {#if viewMode === 'visual'}
    <!-- Visual mode: render with macro chips -->
    <div class="visual-content">
      {#each segments as segment}
        {#if segment.type === 'text'}
          <span class="whitespace-pre-wrap">{segment.content}</span>
        {:else if segment.type === 'macro' && segment.macro}
          <MacroChip
            macro={segment.macro}
            interactive={true}
            onClick={() => handleMacroClick(segment.macro!)}
          />
        {:else if segment.type === 'placeholder' && segment.placeholder}
          <!-- Context placeholder - read-only with info click -->
          <button
            type="button"
            class="placeholder-chip"
            onclick={() => handlePlaceholderClick(segment.placeholder!)}
            title="Click for info about {segment.placeholder.name}"
          >
            <Info class="h-3 w-3" />
            <span>{segment.placeholder.name}</span>
          </button>
        {:else}
          <!-- Unknown token - render as code -->
          <code class="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-700/30">
            {segment.content}
          </code>
        {/if}
      {/each}
    </div>
  {:else}
    <!-- Raw mode: plain textarea -->
    <textarea
      bind:this={textareaRef}
      value={currentContent}
      oninput={(e) => handleContentChange(e.currentTarget.value)}
      class="raw-content input text-sm font-mono"
      placeholder={`Enter ${activeTab === 'system' ? 'system prompt' : 'user message'} content...`}
    ></textarea>
  {/if}
</div>

<!-- Simple Macro Editor Modal -->
{#if editingMacro && editingMacro.type === 'simple'}
  <MacroEditor
    isOpen={showSimpleEditor}
    macro={editingMacro as SimpleMacro}
    currentOverride={findMacroOverride(editingMacro.id)}
    onClose={() => { showSimpleEditor = false; editingMacro = null; }}
    onSave={handleSimpleSave}
    onReset={handleMacroReset}
  />
{/if}

<!-- Complex Macro Editor Modal -->
{#if editingMacro && editingMacro.type === 'complex'}
  <ComplexMacroEditor
    isOpen={showComplexEditor}
    macro={editingMacro as ComplexMacro}
    currentOverride={findMacroOverride(editingMacro.id)}
    currentContext={currentContext}
    onClose={() => { showComplexEditor = false; editingMacro = null; }}
    onSave={handleComplexSave}
    onReset={handleMacroReset}
  />
{/if}

<!-- Placeholder Info Modal -->
{#if viewingPlaceholder}
  <PlaceholderInfo
    isOpen={showPlaceholderInfo}
    placeholder={viewingPlaceholder}
    onClose={() => { showPlaceholderInfo = false; viewingPlaceholder = null; }}
  />
{/if}

<style>
  .prompt-editor {
    display: flex;
    flex-direction: column;
  }

  .view-toggle {
    padding: 0.375rem;
    border-radius: 0.375rem;
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }

  .view-toggle:hover {
    color: var(--text-primary);
  }

  .view-toggle-active {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  .visual-content {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .visual-content :global(.macro-chip) {
    vertical-align: middle;
    margin: 0 0.125rem;
  }

  .placeholder-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-secondary);
    color: var(--text-secondary);
    cursor: pointer;
    vertical-align: middle;
    margin: 0 0.125rem;
    transition: all 0.15s ease;
  }

  .placeholder-chip:hover {
    background-color: var(--bg-tertiary);
    border-color: var(--accent-primary);
    color: var(--text-primary);
  }

  .raw-content {
    min-height: 200px;
    max-height: 400px;
    resize: vertical;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  }

  .prompt-tab {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.375rem;
    color: var(--text-secondary);
    background-color: transparent;
    border: 1px solid transparent;
    transition: all 0.15s ease;
  }

  .prompt-tab:hover {
    background-color: var(--bg-tertiary);
  }

  .prompt-tab-active {
    background-color: var(--bg-tertiary);
    border-color: var(--border-primary);
    color: var(--text-primary);
  }
</style>
