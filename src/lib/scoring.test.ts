import { describe, expect, it } from 'vitest';
import type { Option } from '@/data/questions';
import { ACTIVE_SPECIES_IDS } from '@/data/species';
import { scoreQuiz } from './scoring';

describe('scoreQuiz', () => {
  it('picks the species with the highest tally', () => {
    const answers: Option[] = [
      { label: 'a', scores: { reptilians: 2 } },
      { label: 'b', scores: { reptilians: 2, grays: 1 } },
      { label: 'c', scores: { grays: 1 } },
    ];

    const { winnerId, profile } = scoreQuiz(answers);

    expect(winnerId).toBe('reptilians');
    expect(profile.reptilians).toBe(4);
    expect(profile.grays).toBe(2);
  });

  it('breaks ties by ACTIVE_SPECIES_IDS order', () => {
    // grays and nordics both reach 2; grays comes first in the active roster.
    const answers: Option[] = [
      { label: 'a', scores: { nordics: 2 } },
      { label: 'b', scores: { grays: 2 } },
    ];

    expect(scoreQuiz(answers).winnerId).toBe('grays');
    expect(ACTIVE_SPECIES_IDS.indexOf('grays')).toBeLessThan(
      ACTIVE_SPECIES_IDS.indexOf('nordics'),
    );
  });

  it('ignores points awarded to inactive species', () => {
    const answers: Option[] = [
      // 'pleiadians' is authored but not in the active roster; it must never win.
      { label: 'a', scores: { pleiadians: 99 } },
      { label: 'b', scores: { mantids: 1 } },
    ];

    const { winnerId, profile } = scoreQuiz(answers);

    expect(winnerId).toBe('mantids');
    expect(profile).not.toHaveProperty('pleiadians');
  });

  it('returns the first active species for an empty quiz', () => {
    expect(scoreQuiz([]).winnerId).toBe(ACTIVE_SPECIES_IDS[0]);
  });
});
