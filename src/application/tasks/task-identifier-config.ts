/**
 * Configuration for resolving user-provided task identifiers.
 * Centralizes pronoun handling so "that"/"it"/"this" can be resolved from context.
 */

const PRONOUN_IDENTIFIERS = new Set([
  'that',
  'it',
  'this',
  'the last one',
  'the one we just did',
])

export function isPronounIdentifier(identifier: string): boolean {
  return PRONOUN_IDENTIFIERS.has(identifier.toLowerCase().trim())
}
