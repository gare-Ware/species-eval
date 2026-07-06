// scoring.ts
// Deterministic, AI-free scoring. Tally each chosen option's weighted points
// across the active species; the highest total wins. Ties break by the species'
// position in ACTIVE_SPECIES_IDS, so the same answers always yield the same
// result across retakes.

import type { Option } from '@/data/questions';
import { ACTIVE_SPECIES_IDS, isActiveSpecies } from '@/data/species';
import type { ActiveSpeciesId } from '@/data/species';
import type { SpeciesId } from '@/data/species';

export type AnswerProfile = Record<ActiveSpeciesId, number>;

export interface QuizResult {
  /** Full per-species tally — the "answer profile" (carried to the AI route in Phase 3). */
  profile: AnswerProfile;
  /** Winning species id: highest total, ties broken by ACTIVE_SPECIES_IDS order. */
  winnerId: ActiveSpeciesId;
}

function emptyProfile(): AnswerProfile {
  return Object.fromEntries(
    ACTIVE_SPECIES_IDS.map((id) => [id, 0]),
  ) as AnswerProfile;
}

export function scoreQuiz(answers: Option[]): QuizResult {
  const profile = emptyProfile();

  for (const answer of answers) {
    for (const [id, points] of Object.entries(answer.scores)) {
      const speciesId = id as SpeciesId;
      // Only tally species in the active roster; ignore points for any
      // currently-disabled species so they can never win.
      if (isActiveSpecies(speciesId) && typeof points === 'number') {
        profile[speciesId] += points;
      }
    }
  }

  // Walk in declaration order so the first species at the max total wins ties.
  let winnerId: ActiveSpeciesId = ACTIVE_SPECIES_IDS[0];
  for (const id of ACTIVE_SPECIES_IDS) {
    if (profile[id] > profile[winnerId]) {
      winnerId = id;
    }
  }

  return { profile, winnerId };
}
