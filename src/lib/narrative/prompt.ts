// narrative/prompt.ts
// Pure prompt construction, kept out of any provider so the mock, the Anthropic
// adapter, and the unit tests all share one contract. A provider takes the
// {system, user} pair and sends it however its SDK wants.

import type { NarrativeInput } from './types';

/**
 * Target length for the reading (words), encoded into the prompt. The result
 * shares the viewport with the blob, traits, and retake control, so the model
 * gets a tight blurb-sized budget rather than the longer authored descriptions.
 * Live models overshoot the stated max ~1.25x (probe-measured), so asking for
 * 28-42 lands around one compact paragraph. Retune from measurement, not
 * intuition.
 */
export const NARRATIVE_WORD_RANGE = { min: 28, max: 42 } as const;

/**
 * Hard character ceiling the route enforces on any provider's output. This is
 * a runaway guard, not a style check — the two are tuned independently: to
 * shorten the *reading*, change NARRATIVE_WORD_RANGE; only re-derive this cap
 * from the formula. Live models overshoot the stated max by ~1.2x and prose
 * runs ~6-7 chars/word, so the worst realistic reply is
 * max x 1.2 x 7 ~= 355 chars; the cap sits above that so normal variance
 * passes and only a reply that ignored the length rule outright fails.
 * (A cap set from paper math with no overshoot headroom caused intermittent
 * 502s in live use — probe measured 3/6 Haiku replies over it. Don't
 * re-tighten without re-measuring.)
 */
export const NARRATIVE_MAX_CHARS = 600;

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
    '- Length: AT MOST 2 sentences, in one short paragraph — aim for ' +
      `${NARRATIVE_WORD_RANGE.min}–${NARRATIVE_WORD_RANGE.max} words. Reference only the ` +
      'one or two most telling of their choices, not all of them. Do not quote full ' +
      'answers; compress them into your own words. Horoscope-blurb energy: every ' +
      'sentence has to earn its place.',
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
