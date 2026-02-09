/**
 * Context System Module
 *
 * Unified context building and template rendering for all AI services.
 * The ContextBuilder replaces the old two-phase prompt expansion with a
 * single LiquidJS render pass over a flat context object.
 *
 * @example
 * import { ContextBuilder } from '$lib/services/context'
 *
 * // Story context (async - loads from database)
 * const ctx = await ContextBuilder.forStory(storyId)
 * ctx.add({ recentContent, activeQuests })
 * const { system, user } = await ctx.render('suggestions')
 *
 * // Wizard context (sync - data already in memory)
 * const wizCtx = ContextBuilder.forWizard(wizardData, WizardStep.SettingCreation)
 * wizCtx.add({ seed, genreLabel })
 * const { system, user } = await wizCtx.render('setting-expansion')
 */

// ============================================================================
// Core Builder
// ============================================================================

export { ContextBuilder } from './context-builder'

// ============================================================================
// Runtime Variable Registry
// ============================================================================

export { RUNTIME_VARIABLES, getAvailableVariables } from './runtime-variables'

// ============================================================================
// Type Exports
// ============================================================================

export type {
  RenderResult,
  ContextBuilderConfig,
  RuntimeVariableDefinition,
  ExternalTemplateId,
} from './types'

export { WizardStep, EXTERNAL_TEMPLATE_IDS } from './types'
