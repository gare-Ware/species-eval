// narrative/providers/mock.ts
// The no-key provider: deterministic, offline, and used by default in local dev
// and tests. It isn't the on-error fallback (that's a separate concern in the
// route) — its job is to prove the whole personalization path end to end by
// weaving the reader's actual first and last answers into a templated reading,
// so the UI, timing, and tests exercise real personalized copy without a model.

import type { NarrativeInput, NarrativeProvider } from '../types';

export const mockProvider: NarrativeProvider = {
  id: 'mock',
  async generateResultNarrative(input: NarrativeInput): Promise<string> {
    const { species, answers } = input;
    const [primaryTrait, secondaryTrait] = species.traits;
    const opener = answers[0]?.choice.trim();
    const closer = answers[answers.length - 1]?.choice.trim();

    return [
      `You are *${species.name}*: ${opener ? `"${opener}"` : species.tagline} gives away the ${primaryTrait} in you.`,
      closer
        ? `When pressure peaks, "${closer}" becomes the rule, sharpened by a ${secondaryTrait} streak.`
        : `Under pressure, that ${secondaryTrait} streak turns instinct into a signature.`,
    ]
      .join(' ');
  },
};
