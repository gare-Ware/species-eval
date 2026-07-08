// flow.ts
// The quiz's step machine: pure, guarded transitions, unit-tested. Components
// dispatch events; timing side effects (the choreography beats) stay in Quiz.
//
//   start → (begin) → quiz ⇄ thinking → result → (retake) → start
//                              │
//                              └→ (fail) → error ⇄ (retry) → thinking
//
// 'thinking' is the between-question beat: the content island is empty while
// the blob enlarges and recenters. On the FINAL beat it also covers the AI
// narrative call — Quiz blocks the 'advance' to 'result' until the narrative
// resolves, or dispatches 'fail' to 'error' if it doesn't. 'error' offers a
// 'retry' (back into the blocking beat) or a 'retake'.

import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';

export type Step = 'start' | 'quiz' | 'thinking' | 'result' | 'error';

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
  | { type: 'advance' } // thinking beat over (narrative ready): next question, or the result
  | { type: 'fail' } // the final beat's narrative call failed
  | { type: 'retry' } // from the error state, re-enter the blocking beat
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
    case 'fail':
      // Guard: only the (final) thinking beat can fail into the error state.
      if (state.step !== 'thinking') return state;
      return { ...state, step: 'error' };
    case 'retry':
      // Guard: retry re-enters the blocking beat from the error state only. The
      // answers are already complete, so this lands straight on the final beat.
      if (state.step !== 'error') return state;
      return { ...state, step: 'thinking' };
    case 'retake':
      return INITIAL_FLOW;
  }
}
