import { describe, expect, it } from 'vitest';
import { getSpecies } from '@/data/species';
import type { NarrativeInput } from './types';
import { buildNarrativePrompt, NARRATIVE_WORD_RANGE } from './prompt';

const input: NarrativeInput = {
  species: getSpecies('mantids'),
  profile: { grays: 1, nordics: 0, reptilians: 0, mantids: 5, hybrids: 0 },
  answers: [
    { prompt: 'How do you make a genuinely hard decision?', choice: 'I model the outcomes years ahead.' },
    { prompt: 'At a party, where do people find you?', choice: 'In a corner, deep in one intense conversation.' },
  ],
};

describe('buildNarrativePrompt', () => {
  it('fixes the winning species and forbids hedging', () => {
    const { system } = buildNarrativePrompt(input);
    expect(system).toContain('Mantids');
    expect(system).toMatch(/fixed and\s+non-negotiable/);
  });

  it('encodes the length target', () => {
    const { system } = buildNarrativePrompt(input);
    expect(system).toContain(`${NARRATIVE_WORD_RANGE.min}`);
    expect(system).toContain(`${NARRATIVE_WORD_RANGE.max}`);
  });

  it('constrains formatting to inline emphasis only', () => {
    const { system } = buildNarrativePrompt(input);
    expect(system).toMatch(/no html/i);
    expect(system).toMatch(/emphasis/i);
  });

  it('personalizes from the actual answer choices', () => {
    const { user } = buildNarrativePrompt(input);
    for (const answer of input.answers) {
      expect(user).toContain(answer.choice);
    }
    expect(user).toContain(input.species.tagline);
  });
});
