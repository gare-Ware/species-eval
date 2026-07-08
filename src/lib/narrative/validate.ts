// narrative/validate.ts
// Guard any provider's output before it leaves the route.

import { NARRATIVE_MAX_CHARS } from './prompt';

export class InvalidNarrative extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNarrative';
  }
}

/**
 * Ensure a provider's reply is a non-empty, reasonably-sized string. This is
 * about shape, not sanitization: the reading is never rendered as HTML
 * (InlineMarkdown only emits `*emphasis*` + React-escaped text), so raw markup
 * from a model shows up as inert literal text rather than executing.
 */
export function validateNarrative(raw: unknown): string {
  if (typeof raw !== 'string') throw new InvalidNarrative('Narrative must be a string.');
  const text = raw.trim();
  if (!text) throw new InvalidNarrative('Narrative was empty.');
  if (text.length > NARRATIVE_MAX_CHARS) {
    throw new InvalidNarrative(`Narrative exceeded ${NARRATIVE_MAX_CHARS} characters.`);
  }
  return text;
}
