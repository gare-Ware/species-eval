// narrative/validate.ts
// Guard any provider's output before it leaves the route.

import { NARRATIVE_MAX_CHARS } from './prompt';

export class InvalidNarrative extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNarrative';
  }
}

const HEADING_OR_LIST = /^(?:#{1,6}\s+|[-+*]\s+|\d+[.)]\s+)/;

/**
 * Ensure a provider's reply is a non-empty, reasonably-sized paragraph that fits
 * the UI contract. This is still not an HTML sanitizer: the reading is never
 * rendered as HTML (InlineMarkdown only emits `*emphasis*` + React-escaped
 * text), so raw markup from a model shows up as inert literal text rather than
 * executing.
 */
export function validateNarrative(raw: unknown): string {
  if (typeof raw !== 'string') throw new InvalidNarrative('Narrative must be a string.');
  const text = raw.trim();
  if (!text) throw new InvalidNarrative('Narrative was empty.');
  if (/\r?\n/.test(text)) {
    throw new InvalidNarrative('Narrative must be a single paragraph.');
  }
  if (HEADING_OR_LIST.test(text)) {
    throw new InvalidNarrative('Narrative must not be formatted as a heading or list.');
  }
  if (text.length > NARRATIVE_MAX_CHARS) {
    throw new InvalidNarrative(`Narrative exceeded ${NARRATIVE_MAX_CHARS} characters.`);
  }
  return text;
}
