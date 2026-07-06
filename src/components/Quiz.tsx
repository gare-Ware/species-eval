'use client';

import { useEffect, useReducer, useRef } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import { INITIAL_FLOW, quizFlowReducer } from '@/lib/flow';
import { scoreQuiz } from '@/lib/scoring';
import { fadeSlide, THINK_DWELL_MS } from '@/lib/motion';
import { Starscape } from './Starscape';
import { Blob } from './Blob';
import { StartScreen } from './StartScreen';
import { QuestionCard } from './QuestionCard';
import { ResultCard } from './ResultCard';

// The bottom hint rides the same restrained rise/sink as the question cards.
const hint = fadeSlide('below');

// Single client orchestrator: renders one continuous scene around the step
// machine (lib/flow.ts — all transitions and guards live there). The blob never
// unmounts — headline and step content animate around it (AnimatePresence), and
// its `layout` prop glides it to each new spot. The one side effect owned here
// is choreography: the thinking-beat timer that dispatches 'advance'.
export function Quiz() {
  const [{ step, answers }, dispatch] = useReducer(quizFlowReducer, INITIAL_FLOW);
  // Holds the pending wind-up while the blob "thinks". Cleared on unmount.
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(thinkTimer.current), []);

  // While in 'quiz' the current question is always the one after the recorded
  // answers (see QuizFlow.answers).
  const index = Math.min(answers.length, questions.length - 1);
  const winner = step === 'result' ? getSpecies(scoreQuiz(answers).winnerId) : null;

  // Theme takeover: override the semantic tokens for this subtree (Starscape is
  // inside it, so the stars tint too). --accent gets the pure species color;
  // --foreground is blended toward the base so body text stays readable even
  // for dark accents. Retake clears the override and the base theme returns.
  const theme = winner
    ? ({
        '--accent': winner.accent,
        '--foreground': `color-mix(in oklab, ${winner.accent} 58%, var(--base-foreground))`,
      } as CSSProperties)
    : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div style={theme} className="flex w-full flex-col items-center gap-10">
        <Starscape />

        {/* popLayout removes the exiting headline from flow immediately, so the
            blob starts its layout glide upward while the lines are still
            peeling away — one motion instead of two queued ones. */}
        <AnimatePresence mode="popLayout">
          {step === 'start' && <StartScreen key="headline" />}
        </AnimatePresence>

        <Blob step={step} species={winner} onBegin={() => dispatch({ type: 'begin' })} />

        {/* The hint gets its own popLayout island so its motion is independent of
            the content swap below. It rises in from just below the header and sinks
            back out — the shared restrained rise/sink (see fadeSlide). */}
        <AnimatePresence mode="popLayout">
          {step === 'start' && (
            <motion.p
              key="hint"
              variants={hint}
              initial="hidden"
              animate="show"
              exit="exit"
              className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40"
            >
              Tap to begin · {questions.length} questions
            </motion.p>
          )}
        </AnimatePresence>

        {/* One content island, popLayout like the header/hint islands above: the
            exiting card is popped out of flow the moment its exit starts — in the
            same commit as the step change — so the column re-centers immediately
            and the blob (layout-projected) glides down *while* the card fades.
            mode="wait" kept the card's box until unmount, which happened outside
            any render the blob could measure: the box vanished between frames and
            the blob jumped. The step machine (quiz → thinking → quiz) guarantees
            the island is empty while a card exits, so nothing overlaps. Retake
            needs no gate for the same reason: the exiting result has no box, so
            the landing chrome mounts in the same commit without shoving anything —
            the result fades in place while the headline/hint settle in, and the
            blob makes ONE glide from its result spot to its start spot (gating the
            chrome behind onExitComplete parked the blob alone at center first). */}
        <AnimatePresence
          mode="popLayout"
          onExitComplete={() => {
            // Thinking beat: the answered card has gone — hold the enlarged blob a
            // moment, then wind up the next question/result.
            if (step === 'thinking') {
              thinkTimer.current = setTimeout(() => dispatch({ type: 'advance' }), THINK_DWELL_MS);
            }
          }}
        >
          {step === 'quiz' && (
            <QuestionCard
              key={questions[index].id}
              question={questions[index]}
              index={index}
              total={questions.length}
              onAnswer={(option) => dispatch({ type: 'answer', option })}
            />
          )}
          {step === 'result' && winner && (
            <ResultCard
              key="result"
              species={winner}
              onRetake={() => dispatch({ type: 'retake' })}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
