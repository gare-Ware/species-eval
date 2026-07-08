// narrative/reconstruct.ts
// Server-side trust boundary. The client sends only {questionId, optionId}
// pairs; here we validate them, rebuild the chosen Option[] from the canonical
// questions, and re-run the deterministic scoring ourselves. The winner the AI
// writes about is computed on the server — the client never gets to pick it.

import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import { scoreQuiz } from '@/lib/scoring';
import type { NarrativeInput, NarrativeSelection } from './types';

/** Thrown for any malformed / inconsistent payload — the route maps it to 400. */
export class InvalidNarrativeRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNarrativeRequest';
  }
}

function parseSelections(body: unknown): NarrativeSelection[] {
  if (typeof body !== 'object' || body === null || !('selections' in body)) {
    throw new InvalidNarrativeRequest('Body must be an object with a "selections" array.');
  }
  const raw = (body as { selections: unknown }).selections;
  if (!Array.isArray(raw)) {
    throw new InvalidNarrativeRequest('"selections" must be an array.');
  }
  // Exactly one selection per question — catches partial quizzes, extras, and
  // duplicates when combined with the per-question coverage check below.
  if (raw.length !== questions.length) {
    throw new InvalidNarrativeRequest(
      `Expected ${questions.length} selections, received ${raw.length}.`,
    );
  }
  return raw.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new InvalidNarrativeRequest(`selection[${i}] must be an object.`);
    }
    const { questionId, optionId } = entry as Record<string, unknown>;
    if (typeof questionId !== 'string' || typeof optionId !== 'string') {
      throw new InvalidNarrativeRequest(
        `selection[${i}] needs string "questionId" and "optionId".`,
      );
    }
    return { questionId, optionId };
  });
}

/**
 * Validate an unknown request body and reconstruct the full, server-trusted
 * NarrativeInput. Throws InvalidNarrativeRequest on anything malformed.
 */
export function buildNarrativeInput(body: unknown): NarrativeInput {
  const selections = parseSelections(body);

  const options: Option[] = [];
  const answers: { prompt: string; choice: string }[] = [];

  // Walk in canonical question order so the answer trail and scoring input are
  // deterministic regardless of the order the client sent selections in.
  for (const question of questions) {
    const selection = selections.find((s) => s.questionId === question.id);
    if (!selection) {
      throw new InvalidNarrativeRequest(`Missing a selection for question "${question.id}".`);
    }
    const option = question.options.find((o) => o.id === selection.optionId);
    if (!option) {
      throw new InvalidNarrativeRequest(
        `Option "${selection.optionId}" does not belong to question "${question.id}".`,
      );
    }
    options.push(option);
    answers.push({ prompt: question.prompt, choice: option.label });
  }

  const { profile, winnerId } = scoreQuiz(options);
  return { species: getSpecies(winnerId), profile, answers };
}
