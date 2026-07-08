// narrative/types.ts
// The AI boundary. The route depends on the provider-neutral NarrativeProvider
// interface, never on a specific vendor — swapping Anthropic in (or a mock out)
// is a single factory case, not a project-wide change.

import type { Species } from '@/data/species';
import type { AnswerProfile } from '@/lib/scoring';

/** One answered question as the client sends it — ids only, never the winner. */
export interface NarrativeSelection {
  questionId: string;
  optionId: string;
}

/** The POST /api/result request body. */
export interface NarrativeRequest {
  selections: NarrativeSelection[];
}

/**
 * The fully-reconstructed, server-trusted input a provider needs. The server
 * recomputes `species` and `profile` from the selections (deterministic
 * scoring stays authoritative), so a provider can never be fed a client-chosen
 * winner.
 */
export interface NarrativeInput {
  /** The winning species — recomputed server-side; fixed and non-negotiable. */
  species: Species;
  /** The full per-species tally. */
  profile: AnswerProfile;
  /** The human-readable answer trail, in question order. */
  answers: { prompt: string; choice: string }[];
}

/** Provider-neutral seam: every adapter (mock, anthropic, …) implements this. */
export interface NarrativeProvider {
  /** Stable id, matched against AI_PROVIDER. */
  readonly id: string;
  generateResultNarrative(input: NarrativeInput): Promise<string>;
}

/** The route's success response shape. */
export interface NarrativeResponse {
  narrative: string;
}
