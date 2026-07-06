import { describe, expect, it } from 'vitest';
import { questions } from '@/data/questions';
import type { QuizFlow } from './flow';
import { INITIAL_FLOW, quizFlowReducer } from './flow';

const anOption = questions[0].options[0];

// Answer + advance through the whole quiz, returning the final state.
function playThrough(): QuizFlow {
  let state = quizFlowReducer(INITIAL_FLOW, { type: 'begin' });
  for (const question of questions) {
    state = quizFlowReducer(state, { type: 'answer', option: question.options[0] });
    state = quizFlowReducer(state, { type: 'advance' });
  }
  return state;
}

describe('quizFlowReducer', () => {
  it('begin starts a fresh quiz', () => {
    expect(quizFlowReducer(INITIAL_FLOW, { type: 'begin' })).toEqual({
      step: 'quiz',
      answers: [],
    });
  });

  it('answer records the option and enters the thinking beat', () => {
    const state = quizFlowReducer(
      { step: 'quiz', answers: [] },
      { type: 'answer', option: anOption },
    );
    expect(state).toEqual({ step: 'thinking', answers: [anOption] });
  });

  it('ignores answers outside the quiz step (the double-tap guard)', () => {
    const thinking: QuizFlow = { step: 'thinking', answers: [anOption] };
    expect(quizFlowReducer(thinking, { type: 'answer', option: anOption })).toBe(thinking);
  });

  it('advance winds up the next question until the last answer, then the result', () => {
    const midway: QuizFlow = { step: 'thinking', answers: [anOption] };
    expect(quizFlowReducer(midway, { type: 'advance' }).step).toBe('quiz');

    const final = playThrough();
    expect(final.step).toBe('result');
    expect(final.answers).toHaveLength(questions.length);
  });

  it('advance is a no-op outside the thinking beat', () => {
    const quiz: QuizFlow = { step: 'quiz', answers: [] };
    expect(quizFlowReducer(quiz, { type: 'advance' })).toBe(quiz);
  });

  it('retake returns to a clean start', () => {
    expect(quizFlowReducer(playThrough(), { type: 'retake' })).toEqual(INITIAL_FLOW);
  });
});
