// flow.ts
// The quiz's step machine: pure, guarded transitions, unit-tested. Components
// dispatch events; timing side effects (the choreography beats) stay in Quiz.
//
//   start → (begin) → quiz ⇄ thinking → result → (retake) → start
//
// 'thinking' is the between-question beat: the content island is empty while
// the blob enlarges and recenters.
//
// Phase-3 seam: the AI narrative call lands here — fire the fetch on the last
// 'answer', dispatch 'advance' from Promise.all([minDwell, fetch]) so the
// reveal choreography absorbs the latency.

import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';

export type Step = 'start' | 'quiz' | 'thinking' | 'result';

export interface QuizFlow {
  step: Step;
  /**
   * Chosen options so far. The current question index is derived: while in
   * 'quiz' it is always answers.length.
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
      // Guard: the exiting card's buttons stay clickable during its fade, so a
      // fast double-tap fires a second 'answer' from 'thinking' — ignore it.
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
