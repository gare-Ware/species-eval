// narrative/prompt.ts
// Pure prompt construction, kept out of any provider so the mock, the Anthropic
// adapter, and the unit tests all share one contract. A provider takes the
// {system, user} pair and sends it however its SDK wants.

import type { NarrativeInput } from './types';

/** Target length for the reading (words). Encoded into the prompt. */
export const NARRATIVE_WORD_RANGE = { min: 90, max: 130 } as const;

/**
 * Hard character ceiling the route enforces on any provider's output — set a
 * little above 130 words of prose so a well-behaved reply passes and a runaway
 * one fails.
 */
export const NARRATIVE_MAX_CHARS = 900;

export interface NarrativePrompt {
  system: string;
  user: string;
}

export function buildNarrativePrompt(input: NarrativeInput): NarrativePrompt {
  const { species, answers } = input;

  const system = [
    'You are the voice of an alien-species personality quiz. You write one short, ' +
      'playful "which alien are you" reading — horoscope energy: warm, a little cheeky, ' +
      'lightly cosmic, never mean.',
    '',
    'Rules:',
    `- The reader has been matched to the ${species.name}. This match is fixed and ` +
      `non-negotiable — write them AS a ${species.name}. Never hedge, never suggest ` +
      'another species, never say "maybe."',
    '- Address the reader as "you". Second person throughout.',
    '- Personalize: draw on the specific answers below so the reading feels earned, not ' +
      'generic. Reference the substance of their choices, never the quiz mechanics (do ' +
      'not mention "questions", "options", or "points").',
    `- Length: ${NARRATIVE_WORD_RANGE.min}–${NARRATIVE_WORD_RANGE.max} words. One or two ` +
      'short paragraphs.',
    '- Plain prose only. No headings, no lists, no HTML. You may use *asterisk emphasis* ' +
      'sparingly (once or twice at most); no other markdown.',
    '- Output only the reading itself — no preamble, no title, no surrounding quotation marks.',
  ].join('\n');

  const answerTrail = answers
    .map((a) => `- Asked "${a.prompt}" they chose: "${a.choice}"`)
    .join('\n');

  const user = [
    `Matched species: ${species.name} — ${species.tagline}`,
    `In lore: ${species.description}`,
    `Signature traits: ${species.traits.join(', ')}`,
    '',
    'Their answers:',
    answerTrail,
    '',
    `Write their ${species.name} reading now.`,
  ].join('\n');

  return { system, user };
}
