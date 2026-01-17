import type { OpenAIProvider as OpenAIProvider } from './openrouter';
import type { StoryEntry, StoryBeat, Entry, GenerationPreset } from '$lib/types';
import { settings } from '$lib/stores/settings.svelte';
import { buildExtraBody } from './requestOverrides';
import { promptService, type PromptContext, type StoryMode, type POV, type Tense } from '$lib/services/prompts';

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[Suggestions]', ...args);
  }
}

export interface StorySuggestion {
  text: string;
  type: 'action' | 'dialogue' | 'revelation' | 'twist';
}

export interface SuggestionsResult {
  suggestions: StorySuggestion[];
}

export class SuggestionsService {
  private provider: OpenAIProvider;
  private settingsOverride?: Partial<GenerationPreset>;
  private presetId: string;

  constructor(provider: OpenAIProvider, presetId: string = 'suggestions', settingsOverride?: Partial<GenerationPreset>) {
    this.provider = provider;
    this.presetId = presetId;
    this.settingsOverride = settingsOverride;
  }

  private get preset(): GenerationPreset {
    return settings.getPresetConfig(this.presetId);
  }

  private get model(): string {
    return this.settingsOverride?.model ?? this.preset.model;
  }

  private get temperature(): number {
    return this.settingsOverride?.temperature ?? this.preset.temperature;
  }

  private get maxTokens(): number {
    return this.settingsOverride?.maxTokens ?? this.preset.maxTokens;
  }

  private get extraBody(): Record<string, unknown> | undefined {
    return buildExtraBody({
      manualMode: settings.advancedRequestSettings.manualMode,
      manualBody: this.settingsOverride?.manualBody ?? this.preset.manualBody,
      reasoningEffort: this.settingsOverride?.reasoningEffort ?? this.preset.reasoningEffort,
      providerOnly: this.settingsOverride?.providerOnly ?? this.preset.providerOnly,
    });
  }

  /**
   * Generate story direction suggestions for creative writing mode.
   * Per design doc section 4.2: Suggestions System
   * @param pov - Point of view from story settings
   * @param tense - Tense from story settings
   */
  async generateSuggestions(
    recentEntries: StoryEntry[],
    activeThreads: StoryBeat[],
    genre?: string | null,
    lorebookEntries?: Entry[],
    pov?: POV,
    tense?: Tense
  ): Promise<SuggestionsResult> {
    log('generateSuggestions called', {
      recentEntriesCount: recentEntries.length,
      activeThreadsCount: activeThreads.length,
      genre,
      lorebookEntriesCount: lorebookEntries?.length ?? 0,
    });

    // Get the last few entries for context
    const lastEntries = recentEntries.slice(-5);
    const lastContent = lastEntries.map(e => {
      const prefix = e.type === 'user_action' ? '[DIRECTION]' : '[NARRATIVE]';
      return `${prefix} ${e.content}`;
    }).join('\n\n');

    // Format active threads
    const threadsContext = activeThreads.length > 0
      ? activeThreads.map(t => `• ${t.title}${t.description ? `: ${t.description}` : ''}`).join('\n')
      : '(none)';

    // Format lorebook entries for context
    let lorebookContext = '';
    if (lorebookEntries && lorebookEntries.length > 0) {
      const entryDescriptions = lorebookEntries.slice(0, 15).map(e => {
        let desc = `• ${e.name} (${e.type})`;
        if (e.description) {
          desc += `: ${e.description}`;
        }
        return desc;
      }).join('\n');
      lorebookContext = `\n## Lorebook/World Elements\nThe following characters, locations, and concepts exist in this world and can be incorporated into suggestions:\n${entryDescriptions}`;
    }

    const promptContext: PromptContext = {
      mode: 'creative-writing',
      pov: pov ?? 'third',
      tense: tense ?? 'past',
      protagonistName: 'the protagonist',
    };

    const prompt = promptService.renderUserPrompt('suggestions', promptContext, {
      recentContent: lastContent,
      activeThreads: threadsContext,
      genre: genre ? `## Genre: ${genre}\n` : '',
      lorebookContext,
    });

    try {
      const response = await this.provider.generateResponse({
        model: this.model,
        messages: [
          { role: 'system', content: promptService.renderPrompt('suggestions', promptContext) },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        extraBody: this.extraBody,
      });

      const result = this.parseSuggestions(response.content);
      log('Suggestions generated:', result.suggestions.length);
      return result;
    } catch (error) {
      log('Suggestions generation failed:', error);
      return { suggestions: [] };
    }
  }

  private parseSuggestions(content: string): SuggestionsResult {
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      const suggestions: StorySuggestion[] = [];

      if (Array.isArray(parsed.suggestions)) {
        for (const s of parsed.suggestions.slice(0, 3)) {
          if (s.text) {
            suggestions.push({
              text: s.text,
              type: ['action', 'dialogue', 'revelation', 'twist'].includes(s.type)
                ? s.type
                : 'action',
            });
          }
        }
      }

      return { suggestions };
    } catch (e) {
      log('Failed to parse suggestions:', e);
      return { suggestions: [] };
    }
  }
}
