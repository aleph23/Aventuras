# AGENTS.md

This file contains guidelines for agentic coding assistants working on the Aventura codebase.

## Build/Lint/Test Commands

### Development & Build
```bash
npm run dev              # Start dev server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build
npm run tauri dev        # Start Tauri development window
```

### Type Checking
```bash
npm run check           # Run svelte-check (type checking)
npm run check:watch     # Watch mode type checking
npx svelte-check --tsconfig ./tsconfig.json    # Direct type check
```

### Testing
**Current Status**: No test suite is currently configured in `package.json`.

If/when tests are added (e.g., using Vitest), the standard commands would be:
```bash
npm test                # Run all tests
npm test -- -t "test name" # Run a single test (if using Vitest/Jest)
```

## Project Architecture

- **Framework**: SvelteKit 2 + Tauri 2 (desktop app)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- **Database**: SQLite via `@tauri-apps/plugin-sql`
- **AI**: OpenAI-compatible APIs (OpenRouter, custom providers)

## Current Refactor: Preset-Based Service Configuration

**Status**: In Progress - Phase 3 (AgentProfiles UI) Complete

### Overview
Implementing preset-based service configuration to fix bugs where services have `presetId` fields but don't actually use them at runtime. This addresses the issue where Story Wizard categories don't populate in Agent Profiles UI at first.

### Completed (Phase 1: Service Updates)
Services updated to accept `presetId` and use `settings.getPresetConfig(presetId)`:
1. MemoryService ✅
2. ClassifierService ✅
3. SuggestionsService ✅
4. ActionChoicesService ✅
5. StyleReviewerService ✅
6. TimelineFillService ✅
7. LoreManagementService ✅
8. AgenticRetrievalService ✅
9. EntryRetrievalService ✅
10. ImageGenerationService ✅
11. InteractiveLorebookService ✅

### Completed (Phase 2: Service-Specific Settings)
- Added `serviceSpecificSettings` state property to SettingsStore
- Implemented default functions for all 15 service-specific interfaces:
  - ClassifierSpecificSettings
  - LorebookClassifierSpecificSettings
  - MemorySpecificSettings
  - SuggestionsSpecificSettings
  - ActionChoicesSpecificSettings
  - StyleReviewerSpecificSettings
  - LoreManagementSpecificSettings
  - InteractiveLorebookSpecificSettings
  - AgenticRetrievalSpecificSettings
  - TimelineFillSpecificSettings
  - ChapterQuerySpecificSettings
  - EntryRetrievalSpecificSettings
  - ImageGenerationSpecificSettings
  - TTSSpecificSettings
  - CharacterCardImportSpecificSettings
- Added database loading/saving for `serviceSpecificSettings`
- Added helper methods: `saveServiceSpecificSettings()`, `resetServiceSpecificSettings()`

### Completed (Phase 3: AgentProfiles UI)
- Updated `getServiceSettings()` to use `settings.servicePresetAssignments` instead of `systemServicesSettings`/`wizardSettings`
- Updated `getServicesForProfile()` to use `settings.servicePresetAssignments`
- Updated `handleSavePreset()` to only save the preset (no longer propagates to services)
- Updated `handleDeletePreset()` to reset assignments using `settings.setServicePresetId()`
- Updated `handleAssignPreset()` to use `settings.setServicePresetId()`
- Updated `handleResetProfiles()` to reset `settings.servicePresetAssignments` to defaults
- Added `imageGeneration` to `systemServices` list and `defaultAssignments`

### Remaining Work
**Phase 4**: Add migration logic for existing users
**Phase 5**: Testing and verification

### Key Architecture Changes
- Services now accept `presetId` parameter in constructor
- Services use `settings.getPresetConfig(presetId)` for generation config
- Service-specific fields (like `chatHistoryTruncation`) remain separate
- Default preset assignments in `servicePresetAssignments` state

### Notes
- TTSService is a separate audio generation service (not LLM text generation), so it doesn't use generation presets
- CharacterCardImport service doesn't exist (only defined in settings interfaces)

---

## Code Style Guidelines

### File Organization
```
src/
├── routes/           # SvelteKit pages (+page.svelte, +layout.svelte)
├── lib/
│   ├── components/   # Svelte components (PascalCase.svelte)
│   ├── services/     # Business logic classes (PascalCase.ts) or modules (camelCase.ts)
│   ├── stores/       # Svelte stores (*.svelte.ts for runes)
│   ├── types/        # TypeScript types (index.ts)
│   └── utils/        # Utility functions (camelCase.ts)
```

### Naming Conventions
- **Components**: `PascalCase.svelte` (e.g., `StoryView.svelte`)
- **Services**: `PascalCase.ts` (classes) or `camelCase.ts` (modules)
- **Functions/Vars**: `camelCase` (e.g., `generateResponse`, `isLoading`)
- **Types**: `PascalCase` (e.g., `interface Story`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CONFIG`)
- **Handlers**: `handle<Action>` (e.g., `handleSubmit`)

### Imports
- Use `$lib` alias.
- Use `type` keyword for type-only imports.
```typescript
import type { Story } from '$lib/types';
import { settings } from '$lib/stores/settings.svelte';
```

### Svelte Component Patterns (Svelte 5)
Use Runes (`$state`, `$derived`, `$props`). Avoid `export let`.

```typescript
<script lang="ts">
  import { story } from '$lib/stores/story.svelte';

  interface Props {
    entry: StoryEntry;
    onAction?: () => void;
  }
  let { entry, onAction }: Props = $props();

  let isOpen = $state(false);
  let isActive = $derived(entry.status === 'active');

  $effect(() => {
    // Side effects here
    return () => { /* cleanup */ };
  });

  function handleClick() {
    isOpen = !isOpen;
  }
</script>

<button onclick={handleClick} class="btn btn-primary">
  {entry.content}
</button>
```

### TypeScript Patterns
- **Strict Mode**: No `any`.
- **Async/Await**: Always handle errors with `try/catch` in top-level or service methods.
- **Null Safety**: Use `?.` and `??`.

```typescript
async function loadStory(id: string): Promise<void> {
  try {
    const story = await database.getStory(id);
    if (!story) throw new Error(`Story not found: ${id}`);
    this.currentStory = story;
  } catch (error) {
    console.error('[StoryStore] Failed to load:', error);
    throw error;
  }
}
```

### State Management (Runes)
Use `.svelte.ts` files for global state.

```typescript
class StoryStore {
  currentStory = $state<Story | null>(null);
  entries = $state<StoryEntry[]>([]);

  // Computed
  get activeCharacters() {
    return this.characters.filter(c => c.status === 'active');
  }

  // Action
  async addEntry(content: string) {
    const entry = await database.addEntry({ content });
    this.entries = [...this.entries, entry]; // Immutable update
  }
}
export const story = new StoryStore();
```

### Tailwind CSS
- Use utility classes directly.
- Dark mode: `surface-*` colors.
- Responsive: `sm:`, `md:`, `lg:`.
- Layout: `flex` or `grid`.

```html
<div class="flex h-full flex-col bg-surface-900 p-4 sm:p-6">
  <!-- Content -->
</div>
```

### AI Integration
- Use abstract providers in `src/lib/services/ai`.
- Handle streaming with async generators.

```typescript
async *streamResponse(context: Context): AsyncIterable<StreamChunk> {
  const provider = this.getProvider();
  for await (const chunk of provider.streamResponse(context)) {
    yield chunk;
  }
}
```

### Database
- Use `src/lib/services/database.ts`.
- Parameterize all SQL queries.

## When in Doubt
1. **Search**: Use `grep`/`glob` to find existing patterns.
2. **Type Check**: Run `npm run check`.
3. **Consistency**: Mimic surrounding code.
4. **Safety**: No secrets in code.
