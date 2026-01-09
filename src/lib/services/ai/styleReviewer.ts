import type { OpenAIProvider } from './openrouter';
import type { StoryEntry } from '$lib/types';
import { settings } from '$lib/stores/settings.svelte';
import { buildExtraBody } from './requestOverrides';
import { promptService, type PromptContext, type StoryMode, type POV, type Tense } from '$lib/services/prompts';

const DEBUG = true;

function log(...args: unknown[]) {
  if (DEBUG) {
    console.log('[StyleReviewer]', ...args);
  }
}

// Phrase analysis result
export interface PhraseAnalysis {
  phrase: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  alternatives: string[];
  contexts: string[];
}

// Complete review result
export interface StyleReviewResult {
  phrases: PhraseAnalysis[];
  overallAssessment: string;
  reviewedEntryCount: number;
  timestamp: number;
}

/**
 * Service for analyzing narration text for repetitive phrases and style issues.
 * Runs in the background every N messages to provide writing guidance.
 */
export class StyleReviewerService {
  private provider: OpenAIProvider;

  constructor(provider: OpenAIProvider) {
    this.provider = provider;
  }

  private get model(): string {
    return settings.systemServicesSettings.styleReviewer.model;
  }

  private get temperature(): number {
    return settings.systemServicesSettings.styleReviewer.temperature;
  }

  private get maxTokens(): number {
    return settings.systemServicesSettings.styleReviewer.maxTokens;
  }

  /**
   * Analyze narration entries for style issues.
   * Only analyzes visible (non-summarized) narration entries.
   * @param entries - Story entries to analyze
   * @param mode - Story mode (affects default POV/tense context)
   * @param pov - Point of view from story settings
   * @param tense - Tense from story settings
   */
  async analyzeStyle(entries: StoryEntry[], mode: StoryMode = 'adventure', pov?: POV, tense?: Tense): Promise<StyleReviewResult> {
    // Filter to only narration entries (exclude user_action, system, retry)
    const narrationEntries = entries.filter(e => e.type === 'narration');

    log('analyzeStyle called', {
      totalEntries: entries.length,
      narrationEntries: narrationEntries.length,
      model: this.model,
    });

    if (narrationEntries.length === 0) {
      return this.getEmptyResult();
    }

    // Combine narration text for analysis
    const combinedText = narrationEntries
      .map(e => e.content)
      .join('\n\n---\n\n');

    const promptContext: PromptContext = {
      mode,
      pov: pov ?? (mode === 'creative-writing' ? 'third' : 'second'),
      tense: tense ?? (mode === 'creative-writing' ? 'past' : 'present'),
      protagonistName: 'the protagonist',
    };
    const prompt = promptService.renderUserPrompt('style-reviewer', promptContext, {
      passageCount: narrationEntries.length,
      passages: combinedText,
    });

    try {
      log('Sending style analysis request...');

      const response = await this.provider.generateResponse({
        model: this.model,
        messages: [
          { role: 'system', content: promptService.renderPrompt('style-reviewer', promptContext) },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        extraBody: buildExtraBody({
          manualMode: settings.advancedRequestSettings.manualMode,
          manualBody: settings.systemServicesSettings.styleReviewer.manualBody,
          reasoningEffort: settings.systemServicesSettings.styleReviewer.reasoningEffort,
          providerOnly: settings.systemServicesSettings.styleReviewer.providerOnly,
        }),
      });

      log('Style analysis response received', {
        contentLength: response.content.length,
        usage: response.usage,
      });

      const result = this.parseAnalysisResponse(response.content, narrationEntries.length);
      log('Style analysis parsed', {
        phrasesFound: result.phrases.length,
      });

      return result;
    } catch (error) {
      log('Style analysis failed', error);
      return this.getEmptyResult();
    }
  }

  private parseAnalysisResponse(content: string, entryCount: number): StyleReviewResult {
    try {
      let jsonStr = content.trim();

      // Handle markdown code blocks
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);

      const phrases: PhraseAnalysis[] = [];
      const rawItems = Array.isArray(parsed.phrases)
        ? parsed.phrases
        : (Array.isArray(parsed.issues) ? parsed.issues : []);

      for (const item of rawItems.slice(0, 10)) {
        const phraseText = item.phrase ?? item.description;
        if (phraseText) {
          phrases.push({
            phrase: phraseText,
            frequency: typeof item.frequency === 'number'
              ? item.frequency
              : (typeof item.occurrences === 'number' ? item.occurrences : 2),
            severity: ['low', 'medium', 'high'].includes(item.severity) ? item.severity : 'low',
            alternatives: Array.isArray(item.alternatives)
              ? item.alternatives.slice(0, 3)
              : (Array.isArray(item.suggestions) ? item.suggestions.slice(0, 3) : []),
            contexts: Array.isArray(item.contexts)
              ? item.contexts.slice(0, 2)
              : (Array.isArray(item.examples) ? item.examples.slice(0, 2) : []),
          });
        }
      }

      return {
        phrases,
        overallAssessment: parsed.overallAssessment || parsed.summary || '',
        reviewedEntryCount: entryCount,
        timestamp: Date.now(),
      };
    } catch (e) {
      log('Failed to parse style analysis JSON', e);
      return this.getEmptyResult();
    }
  }

  private getEmptyResult(): StyleReviewResult {
    return {
      phrases: [],
      overallAssessment: '',
      reviewedEntryCount: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Format review results for injection into the main generation prompt.
   * Returns an empty string if there are no phrases to report.
   */
  static formatForPromptInjection(result: StyleReviewResult): string {
    if (result.phrases.length === 0) {
      return '';
    }

    let block = '\n\n<style_guidance>\n';
    block += '## Recent Style Review\n';
    block += 'The following phrases have been overused in recent narration. Please vary your language:\n\n';

    for (const phrase of result.phrases) {
      block += `- "${phrase.phrase}" (${phrase.frequency}x, ${phrase.severity})`;
      if (phrase.alternatives.length > 0) {
        block += ` - Try: ${phrase.alternatives.join(', ')}`;
      }
      block += '\n';
    }

    if (result.overallAssessment) {
      block += `\nNote: ${result.overallAssessment}`;
    }

    block += '\n</style_guidance>';
    return block;
  }
}
