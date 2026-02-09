/**
 * ContextBuilder
 *
 * Central piece of the context system. Replaces the two-phase expansion
 * (MacroEngine + placeholder injection) with a single LiquidJS render pass
 * over a flat context object.
 *
 * Usage:
 *   const ctx = await ContextBuilder.forStory(storyId)
 *   ctx.add({ recentContent, activeQuests })
 *   const { system, user } = await ctx.render('suggestions')
 *
 * Design decisions:
 * - NOT a singleton -- instantiate per-render via static factory methods
 * - Flat namespace: all variables as {{ variableName }} directly
 * - Missing runtime variables render as empty string (LiquidJS default)
 * - External templates bypass Liquid rendering
 */

import { database } from '$lib/services/database'
import { templateEngine } from '$lib/services/templates/engine'
import { createLogger } from '$lib/services/ai/core/config'
import { EXTERNAL_TEMPLATE_IDS } from './types'
import type { RenderResult, ContextBuilderConfig } from './types'
import { WizardStep } from './types'

const log = createLogger('ContextBuilder')

/**
 * ContextBuilder assembles a flat context object from system state,
 * custom variables, and service runtime data, then renders templates
 * through LiquidJS in a single pass.
 */
export class ContextBuilder {
  /** Flat context object -- all variables live here */
  private context: Record<string, any> = {}

  /** Pack ID for template retrieval */
  private packId: string = 'default-pack'

  // =========================================================================
  // Static Factory Methods
  // =========================================================================

  /**
   * Create a ContextBuilder pre-populated with story context.
   *
   * Loads from database:
   * - Story settings (mode, pov, tense, genre, tone, themes, etc.)
   * - Protagonist name from the story's characters
   * - Current location from the story's locations
   * - Story time from the time tracker
   * - Active pack's custom variable default values
   *
   * @param storyId - Story ID to load context from
   * @param config - Optional configuration overrides
   * @returns Populated ContextBuilder instance
   */
  static async forStory(storyId: string, config?: ContextBuilderConfig): Promise<ContextBuilder> {
    const builder = new ContextBuilder()

    log('forStory', { storyId, hasConfig: !!config })

    // Load story from database
    const story = await database.getStory(storyId)
    if (!story) {
      log('forStory: story not found', { storyId })
      return builder
    }

    // Auto-populate system variables from story
    builder.context.mode = story.mode || 'adventure'
    builder.context.pov = story.settings?.pov || 'second'
    builder.context.tense = story.settings?.tense || 'present'
    builder.context.genre = story.genre || ''
    builder.context.tone = story.settings?.tone || ''
    builder.context.themes = story.settings?.themes?.join(', ') || ''
    builder.context.settingDescription = story.description || ''

    // Load protagonist name from characters
    const characters = await database.getCharacters(storyId)
    const protagonist = characters.find((c) => c.relationship === 'self')
    builder.context.protagonistName = protagonist?.name || 'the protagonist'
    builder.context.protagonistDescription = protagonist?.description || ''

    // Load current location
    const locations = await database.getLocations(storyId)
    const currentLocation = locations.find((l) => l.current)
    builder.context.currentLocation = currentLocation?.name || ''

    // Format story time
    if (story.timeTracker) {
      const t = story.timeTracker
      const year = t.years + 1
      const day = t.days + 1
      builder.context.storyTime = `Year ${year}, Day ${day}, ${t.hours} hours ${t.minutes} minutes`
    } else {
      builder.context.storyTime = ''
    }

    // Visual prose mode flags
    builder.context.visualProseMode = story.settings?.visualProseMode || false
    builder.context.inlineImageMode = story.settings?.imageGenerationMode === 'inline'

    // Determine pack ID
    const packId = config?.packId || await database.getStoryPackId(storyId) || 'default-pack'
    builder.packId = packId

    // Load custom variable values from the active pack
    if (!config?.skipCustomVariables) {
      await builder.loadCustomVariables(packId)
    }

    log('forStory complete', {
      storyId,
      packId: builder.packId,
      contextKeys: Object.keys(builder.context).length,
    })

    return builder
  }

  /**
   * Create a ContextBuilder for wizard context.
   *
   * Populates context progressively based on the current wizard step.
   * Early steps have fewer variables (e.g., step 2 has genre but no protagonistName).
   * Synchronous since wizard data is already in memory.
   *
   * @param wizardData - Wizard selections and data accumulated so far
   * @param step - Current wizard step number (maps to WizardStep enum)
   * @param config - Optional configuration overrides
   * @returns Populated ContextBuilder instance
   */
  static forWizard(
    wizardData: Record<string, any>,
    step: number,
    config?: ContextBuilderConfig,
  ): ContextBuilder {
    const builder = new ContextBuilder()

    log('forWizard', { step, dataKeys: Object.keys(wizardData).length })

    // Pack selection (step 1+)
    if (step >= WizardStep.PackSelection) {
      builder.packId = config?.packId || wizardData.packId || 'default-pack'
    }

    // Setting creation (step 2+): genre and setting info
    if (step >= WizardStep.SettingCreation) {
      builder.context.genre = wizardData.genre || ''
      builder.context.settingDescription = wizardData.settingDescription || ''
      builder.context.settingName = wizardData.settingName || ''
      builder.context.tone = wizardData.tone || ''
      builder.context.themes = Array.isArray(wizardData.themes)
        ? wizardData.themes.join(', ')
        : (wizardData.themes || '')
    }

    // Writing style (step 3+): mode, pov, tense
    if (step >= WizardStep.WritingStyle) {
      builder.context.mode = wizardData.mode || 'adventure'
      builder.context.pov = wizardData.pov || 'second'
      builder.context.tense = wizardData.tense || 'present'
    }

    // Character creation (step 4+): protagonist info
    if (step >= WizardStep.CharacterCreation) {
      builder.context.protagonistName = wizardData.protagonistName || 'the protagonist'
      builder.context.protagonistDescription = wizardData.protagonistDescription || ''
      builder.context.currentLocation = wizardData.currentLocation || ''
    }

    // Supporting characters (step 5+)
    if (step >= WizardStep.SupportingCharacters) {
      // Supporting character data is passed as runtime data via .add()
    }

    // Opening generation (step 6+)
    if (step >= WizardStep.OpeningGeneration) {
      builder.context.storyTime = wizardData.storyTime || ''
    }

    log('forWizard complete', {
      step,
      packId: builder.packId,
      contextKeys: Object.keys(builder.context).length,
    })

    return builder
  }

  // =========================================================================
  // Instance Methods
  // =========================================================================

  /**
   * Merge runtime data into the flat context.
   * Services call this to inject their specific variables before rendering.
   *
   * @param data - Key-value pairs to merge into context
   * @returns this (for method chaining)
   *
   * @example
   * ctx.add({ recentContent: lastEntries, activeQuests: quests })
   * ctx.add({ lorebookContext }).add({ userInput })
   */
  add(data: Record<string, any>): this {
    Object.assign(this.context, data)
    return this
  }

  /**
   * Render a template from the active pack.
   *
   * Loads both system content (templateId) and user content (templateId + '-user')
   * from the database, renders both through LiquidJS with the flat context,
   * and returns { system, user }.
   *
   * External templates (image styles, vault tools) bypass Liquid rendering
   * and return raw content as-is.
   *
   * @param templateId - Template identifier (e.g., 'suggestions', 'classifier')
   * @returns Rendered system and user prompts
   */
  async render(templateId: string): Promise<RenderResult> {
    log('render', { templateId, packId: this.packId, contextKeys: Object.keys(this.context).length })

    // External template bypass -- return raw content without Liquid rendering
    if ((EXTERNAL_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
      return this.renderExternal(templateId)
    }

    // Load system template content
    const systemTemplate = await database.getPackTemplate(this.packId, templateId)
    const systemContent = systemTemplate?.content || ''

    // Load user template content (convention: templateId + '-user')
    const userTemplateId = `${templateId}-user`
    const userTemplate = await database.getPackTemplate(this.packId, userTemplateId)
    const userContent = userTemplate?.content || ''

    // Render both through LiquidJS with the flat context
    const system = systemContent ? templateEngine.render(systemContent, this.context) : ''
    const user = userContent ? templateEngine.render(userContent, this.context) : ''

    if (!systemContent && !userContent) {
      log('render: no template content found', { templateId, packId: this.packId })
    }

    return { system, user }
  }

  /**
   * Get the current context object.
   * Useful for debugging and logging.
   *
   * @returns Copy of the current context
   */
  getContext(): Record<string, any> {
    return { ...this.context }
  }

  /**
   * Get the active pack ID.
   *
   * @returns Current pack ID
   */
  getPackId(): string {
    return this.packId
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Load custom variable default values from a pack.
   * Each custom variable's defaultValue is added to the context
   * using the variable's variableName as the key.
   */
  private async loadCustomVariables(packId: string): Promise<void> {
    try {
      const variables = await database.getPackVariables(packId)
      for (const variable of variables) {
        // Only set if not already in context (system vars take precedence)
        if (!(variable.variableName in this.context)) {
          this.context[variable.variableName] = variable.defaultValue ?? ''
        }
      }
      log('loadCustomVariables', { packId, count: variables.length })
    } catch (error) {
      log('loadCustomVariables failed', { packId, error })
    }
  }

  /**
   * Render an external template (raw text, no Liquid rendering).
   * External templates are returned as-is from the database.
   * The system prompt contains the raw template content;
   * user prompt is empty for external templates.
   */
  private async renderExternal(templateId: string): Promise<RenderResult> {
    log('renderExternal', { templateId, packId: this.packId })

    const template = await database.getPackTemplate(this.packId, templateId)
    const system = template?.content || ''

    if (!system) {
      log('renderExternal: template not found', { templateId, packId: this.packId })
    }

    return { system, user: '' }
  }
}
