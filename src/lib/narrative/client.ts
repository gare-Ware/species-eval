// narrative/client.ts
// Client half of the narrative call: turn the recorded answers into the id-only
// payload and POST it. Every question is answered once, in order, so answers[i]
// corresponds to questions[i].

import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';
import type { NarrativeSelection } from './types';

export function selectionsFromAnswers(answers: Option[]): NarrativeSelection[] {
  return answers.map((option, i) => ({
    questionId: questions[i].id,
    optionId: option.id,
  }));
}

export async function fetchNarrative(answers: Option[], signal?: AbortSignal): Promise<string> {
  const res = await fetch('/api/result', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ selections: selectionsFromAnswers(answers) }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Narrative request failed with status ${res.status}.`);
  }
  const data: unknown = await res.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as { narrative?: unknown }).narrative !== 'string' ||
    !(data as { narrative: string }).narrative.trim()
  ) {
    throw new Error('Narrative response was malformed.');
  }
  return (data as { narrative: string }).narrative;
}
