// flow.ts
// The quiz's step machine, extracted from the Quiz component so every transition
// is pure, guarded, and unit-testable. Components dispatch events; choreography
// side effects (the thinking-beat timer) stay in Quiz where they belong.
//
//   start → (begin) → quiz ⇄ thinking → result → (retake) → start
//
// 'thinking' is the between-question beat: the answered card has left, the blob
// enlarges + recenters, and nothing occupies the content island.
//
// Phase-3 seam: the AI-narrative call lands here. 'thinking' becomes the async
// state — fire the fetch on the last 'answer', and dispatch 'advance' from
// Promise.all([minDwell, fetch]) so the reveal choreography absorbs the latency
// instead of a spinner.

import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';

export type Step = 'start' | 'quiz' | 'thinking' | 'result';

export interface QuizFlow {
  step: Step;
  /**
   * Chosen options so far. The current question index is derived: while in
   * 'quiz' it is always answers.length (the machine only re-enters 'quiz' when
   * a question remains), so index needs no state of its own.
   */
  answers: Option[];
}

export type QuizEvent =
  | { type: 'begin' } // the blob tapped on the start screen
  | { type: 'answer'; option: Option }
  | { type: 'advance' } // thinking beat over: next question, or the result
  | { type: 'retake' };

export const INITIAL_FLOW: QuizFlow = { step: 'start', answers: [] };

export function quizFlowReducer(state: QuizFlow, event: QuizEvent): QuizFlow {
  switch (event.type) {
    case 'begin':
      return { step: 'quiz', answers: [] };
    case 'answer':
      // Guard: only from 'quiz'. The answered card stays in the DOM (popped out
      // of flow) for its short exit fade and its buttons remain clickable, so a
      // fast double-tap fires a second 'answer' from 'thinking' — ignore it
      // instead of recording two answers.
      if (state.step !== 'quiz') return state;
      return { step: 'thinking', answers: [...state.answers, event.option] };
    case 'advance':
      // Guard: only the thinking beat winds up into the next step.
      if (state.step !== 'thinking') return state;
      return {
        ...state,
        step: state.answers.length >= questions.length ? 'result' : 'quiz',
      };
    case 'retake':
      return INITIAL_FLOW;
  }
}
