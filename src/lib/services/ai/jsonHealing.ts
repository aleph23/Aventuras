import { jsonrepair } from 'jsonrepair';

/**
 * Parses JSON with automatic repair for common LLM output issues.
 * Handles: missing quotes, trailing commas, markdown code blocks,
 * truncation, single quotes, Python constants, and more.
 *
 * @throws {SyntaxError} If JSON cannot be repaired
 */
export function parseJsonWithHealing<T>(content: string): T {
	const repaired = jsonrepair(content.trim());
	return JSON.parse(repaired) as T;
}

/**
 * Safe version that returns null on failure instead of throwing.
 */
export function tryParseJsonWithHealing<T>(content: string): T | null {
	try {
		return parseJsonWithHealing<T>(content);
	} catch {
		return null;
	}
}
