'use client';

import { useEffect, useReducer, useRef } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import type { QuizEvent } from '@/lib/flow';
import { INITIAL_FLOW, quizFlowReducer } from '@/lib/flow';
import { scoreQuiz } from '@/lib/scoring';
import { FADE, fadeSlide, REDUCED_THINK_DWELL_MS, THINK_DWELL_MS } from '@/lib/motion';
import { Starscape } from './Starscape';
// Frame is parked, not gone: the accent border read too bright against the dark
// field at rest. Re-enable by uncommenting this and <Frame /> below.
// import { Frame } from './Frame';
import { Blob } from './Blob';
import { StartScreen } from './StartScreen';
import { QuestionCard } from './QuestionCard';
import { ResultCard } from './ResultCard';

// The bottom hint rides the same restrained rise/sink as the question cards.
const hint = fadeSlide('below');

// Single client orchestrator: renders one continuous scene around the step
// machine (lib/flow.ts). The blob never unmounts — chrome and step content
// animate around it while its `layout` prop glides it to each new spot. The
// one side effect owned here is the thinking-beat timer.
export function Quiz() {
  const prefersReducedMotion = useReducedMotion();
  const [{ step, answers }, dispatch] = useReducer(quizFlowReducer, INITIAL_FLOW);
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasUserNavigated = useRef(false);
  const startHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => clearTimeout(thinkTimer.current), []);

  // In 'quiz' the current question is always the one after the recorded answers.
  const index = Math.min(answers.length, questions.length - 1);
  const winner = step === 'result' ? getSpecies(scoreQuiz(answers).winnerId) : null;
  const isFinalThinkingBeat = step === 'thinking' && answers.length >= questions.length;
  let announcement = '';
  if (step === 'quiz') {
    announcement = `Question ${index + 1} of ${questions.length}`;
  } else if (isFinalThinkingBeat) {
    announcement = 'Preparing your result';
  } else if (step === 'thinking') {
    announcement = 'Preparing the next question';
  } else if (winner) {
    announcement = `Result: Species match, ${winner.name}`;
  }
  const hintVariants = prefersReducedMotion ? FADE : hint;

  function send(event: QuizEvent) {
    hasUserNavigated.current = true;
    dispatch(event);
  }

  useEffect(() => {
    if (!hasUserNavigated.current || step === 'thinking') return;

    const target =
      step === 'start'
        ? startHeadingRef.current
        : step === 'quiz'
          ? questionHeadingRef.current
          : resultHeadingRef.current;

    if (!target) return;

    const frame = requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [index, step, winner?.id]);

  // Theme takeover for this subtree (Starscape included, so the sky tints too):
  // --accent gets the pure species color; --foreground blends toward the base so
  // body text stays readable for dark accents. Retake removes the override.
  const theme = winner
    ? ({
        '--accent': winner.accent,
        '--foreground': `color-mix(in oklab, ${winner.accent} 58%, var(--base-foreground))`,
      } as CSSProperties)
    : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <div style={theme} className="flex w-full flex-col items-center gap-10">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        <Starscape />
        {/* <Frame /> */}

        {/* popLayout pops the exiting headline from flow immediately, so the
            blob's layout glide starts while the lines are still peeling away. */}
        <AnimatePresence mode="popLayout">
          {step === 'start' && <StartScreen key="headline" headingRef={startHeadingRef} />}
        </AnimatePresence>

        <Blob
          step={step}
          species={winner}
          returnToQuizSize={step === 'thinking' && !isFinalThinkingBeat}
          onBegin={() => send({ type: 'begin' })}
        />

        {/* Separate island so the hint's motion is independent of the content
            swap below. */}
        <AnimatePresence mode="popLayout">
          {step === 'start' && (
            <motion.p
              key="hint"
              variants={hintVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40"
            >
              Tap to begin · {questions.length} questions
            </motion.p>
          )}
        </AnimatePresence>

        {/* Content island. popLayout pops the exiting card out of flow the
            moment its exit starts, so the column re-centers in the same commit
            and the layout-projected blob glides while the card fades
            (mode="wait" would hold the card's box until unmount and the blob
            would jump). The step machine keeps this island empty while a card
            exits. Retake needs no gate: the exiting result has no box, so the
            landing chrome mounts immediately and the blob makes one glide back
            to its start spot. */}
        <AnimatePresence
          mode="popLayout"
          onExitComplete={() => {
            // Thinking beat: the answered card is gone — dwell, then wind up.
            if (step === 'thinking') {
              clearTimeout(thinkTimer.current);
              thinkTimer.current = setTimeout(
                () => dispatch({ type: 'advance' }),
                prefersReducedMotion ? REDUCED_THINK_DWELL_MS : THINK_DWELL_MS,
              );
            }
          }}
        >
          {step === 'quiz' && (
            <QuestionCard
              key={questions[index].id}
              question={questions[index]}
              index={index}
              total={questions.length}
              headingRef={questionHeadingRef}
              onAnswer={(option) => send({ type: 'answer', option })}
            />
          )}
          {step === 'result' && winner && (
            <ResultCard
              key="result"
              species={winner}
              headingRef={resultHeadingRef}
              onRetake={() => send({ type: 'retake' })}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
