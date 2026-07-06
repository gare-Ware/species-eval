// Data-invariant tests: direction-proof checks on the authored content. No UI
// or motion here — these pin the contracts the type system can't express
// (uniqueness, reachability, dead weights), so they survive any visual redesign.

import { describe, expect, it } from 'vitest';
import { scoreQuiz } from '@/lib/scoring';
import { questions } from './questions';
import type { SpeciesId } from './species';
import { ACTIVE_SPECIES_IDS, getSpecies, isActiveSpecies, species } from './species';

describe('species data', () => {
  it('has no duplicate ids', () => {
    const ids = species.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('authors an entry for every active roster id', () => {
    for (const id of ACTIVE_SPECIES_IDS) {
      expect(getSpecies(id).id).toBe(id);
    }
  });
});

describe('question data', () => {
  it('awards only positive weights', () => {
    for (const question of questions) {
      for (const option of question.options) {
        for (const [id, points] of Object.entries(option.scores)) {
          expect(points, `${question.id}: "${option.label}" → ${id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has no dead options — every option scores at least one active species', () => {
    for (const question of questions) {
      for (const option of question.options) {
        const awardsActive = Object.entries(option.scores).some(
          ([id, points]) => isActiveSpecies(id as SpeciesId) && (points ?? 0) > 0,
        );
        expect(awardsActive, `${question.id}: "${option.label}"`).toBe(true);
      }
    }
  });

  it('lets every active species win — no unreachable results', () => {
    for (const id of ACTIVE_SPECIES_IDS) {
      // The strongest possible run for this species: its best option in every
      // question. If even that doesn't win, no answer path can reach it.
      const answers = questions.map(
        (question) =>
          [...question.options].sort(
            (a, b) => (b.scores[id] ?? 0) - (a.scores[id] ?? 0),
          )[0],
      );
      expect(scoreQuiz(answers).winnerId, `${id} must be reachable`).toBe(id);
    }
  });
});
