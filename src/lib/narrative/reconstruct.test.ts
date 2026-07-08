import { describe, expect, it } from 'vitest';
import { questions } from '@/data/questions';
import { scoreQuiz } from '@/lib/scoring';
import { buildNarrativeInput, InvalidNarrativeRequest } from './reconstruct';

// A complete, valid payload. options[0] of every question favors the Grays, so
// this is also a known-winner fixture for the recomputation test.
function validBody() {
  return {
    selections: questions.map((q) => ({ questionId: q.id, optionId: q.options[0].id })),
  };
}

describe('buildNarrativeInput', () => {
  it('reconstructs the answer trail in canonical question order', () => {
    const input = buildNarrativeInput(validBody());
    expect(input.answers).toHaveLength(questions.length);
    expect(input.answers[0]).toEqual({
      prompt: questions[0].prompt,
      choice: questions[0].options[0].label,
    });
  });

  it('recomputes the winner server-side (never trusts the client)', () => {
    const input = buildNarrativeInput(validBody());
    // Derived purely from the selections, matching the deterministic core.
    const expected = scoreQuiz(questions.map((q) => q.options[0]));
    expect(input.species.id).toBe(expected.winnerId);
    expect(input.species.id).toBe('grays');
    expect(input.profile).toEqual(expected.profile);
  });

  it('ignores the order selections arrive in', () => {
    const shuffled = { selections: [...validBody().selections].reverse() };
    expect(buildNarrativeInput(shuffled).answers[0].prompt).toBe(questions[0].prompt);
  });

  it('rejects a non-object body', () => {
    expect(() => buildNarrativeInput(null)).toThrow(InvalidNarrativeRequest);
    expect(() => buildNarrativeInput('nope')).toThrow(InvalidNarrativeRequest);
  });

  it('rejects a wrong number of selections (partial or padded)', () => {
    const short = { selections: validBody().selections.slice(1) };
    expect(() => buildNarrativeInput(short)).toThrow(/Expected \d+ selections/);
  });

  it('rejects a selection missing string ids', () => {
    const bad = { selections: validBody().selections.map(() => ({ questionId: 1, optionId: 2 })) };
    expect(() => buildNarrativeInput(bad)).toThrow(InvalidNarrativeRequest);
  });

  it('rejects an option that does not belong to its question', () => {
    const body = validBody();
    body.selections[0] = { questionId: questions[0].id, optionId: 'not-a-real-option' };
    expect(() => buildNarrativeInput(body)).toThrow(/does not belong/);
  });

  it('rejects a duplicate answer that leaves a question uncovered', () => {
    const body = validBody();
    // Duplicate q0's selection over q1's slot: count still matches, but q1 is
    // now unanswered.
    body.selections[1] = { ...body.selections[0] };
    expect(() => buildNarrativeInput(body)).toThrow(/Missing a selection/);
  });
});
