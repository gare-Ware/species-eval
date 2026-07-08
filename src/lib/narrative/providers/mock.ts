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
      `The signal resolves and it's unmistakable — you're *${species.name}*, through and through.`,
      opener ? `Faced with a fresh start, your instinct gave you away — "${opener}"` : '',
      `That's the ${primaryTrait} in you talking, shot through with a ${secondaryTrait} ` +
        'streak the rest of us never quite manage to place.',
      closer ? `And when it truly counts, you fall back on one rule: "${closer}"` : '',
      `${species.tagline} Everyone else is just now catching up.`,
    ]
      .filter(Boolean)
      .join(' ');
  },
};
