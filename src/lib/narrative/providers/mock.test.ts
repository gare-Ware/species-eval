import { describe, expect, it } from 'vitest';
import { getSpecies } from '@/data/species';
import { NARRATIVE_MAX_CHARS } from '../prompt';
import type { NarrativeInput } from '../types';
import { mockProvider } from './mock';

const input: NarrativeInput = {
  species: getSpecies('hybrids'),
  profile: { grays: 0, nordics: 0, reptilians: 0, mantids: 0, hybrids: 6 },
  answers: [
    { prompt: 'A new group project kicks off.', choice: 'I sense what the team is missing and become that.' },
    { prompt: 'Pick the principle you live by.', choice: 'Bend, blend, endure.' },
  ],
};

describe('mockProvider', () => {
  it('weaves the species and the reader’s own answers into the reading', async () => {
    const text = await mockProvider.generateResultNarrative(input);
    expect(text).toContain('Hybrids');
    expect(text).toContain(input.answers[0].choice);
    expect(text).toContain(input.answers[input.answers.length - 1].choice);
  });

  it('stays within the validated length ceiling', async () => {
    const text = await mockProvider.generateResultNarrative(input);
    expect(text.trim().length).toBeGreaterThan(0);
    expect(text.length).toBeLessThanOrEqual(NARRATIVE_MAX_CHARS);
  });
});
