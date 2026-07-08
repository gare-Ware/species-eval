'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { questions } from '@/data/questions';
import type { Option } from '@/data/questions';
import { getSpecies } from '@/data/species';
import type { QuizEvent } from '@/lib/flow';
import { INITIAL_FLOW, quizFlowReducer } from '@/lib/flow';
import { scoreQuiz } from '@/lib/scoring';
import {
  CHARGE_CYCLE_MS,
  FADE,
  fadeSlide,
  FINAL_BEAT_INTRO_MS,
  REDUCED_THINK_DWELL_MS,
  THINK_DWELL_MS,
} from '@/lib/motion';
import { useNarrative } from '@/hooks/useNarrative';
import { Starscape } from './Starscape';
// Frame is parked, not gone: the accent border read too bright against the dark
// field at rest. Re-enable by uncommenting this and <Frame /> below.
// import { Frame } from './Frame';
import { Blob } from './Blob';
import { StartScreen } from './StartScreen';
import { QuestionCard } from './QuestionCard';
import { ResultCard } from './ResultCard';
import { ResultError } from './ResultError';

// The bottom hint rides the same restrained rise/sink as the question cards.
const hint = fadeSlide('below');

// Single client orchestrator: renders one continuous scene around the step
// machine (lib/flow.ts). The blob never unmounts — chrome and step content
// animate around it while its `layout` prop glides it to each new spot. The
// side effects owned here are the thinking-beat timer and the AI narrative call
// that the final beat blocks on.
export function Quiz() {
  const prefersReducedMotion = useReducedMotion();
  const [{ step, answers }, dispatch] = useReducer(quizFlowReducer, INITIAL_FLOW);
  const narrative = useNarrative();
  // The final beat's clock anchor, set at the card's exit-complete: the blob's
  // charge cycles and the reveal quantization below both count from it.
  const [beatStart, setBeatStart] = useState<number | null>(null);
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasUserNavigated = useRef(false);
  const startHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorHeadingRef = useRef<HTMLHeadingElement>(null);
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
  } else if (step === 'error') {
    announcement = 'We could not generate your result. Try again.';
  } else if (winner) {
    announcement = `Result: Species match, ${winner.name}`;
  }
  const hintVariants = prefersReducedMotion ? FADE : hint;

  function send(event: QuizEvent) {
    hasUserNavigated.current = true;
    dispatch(event);
  }

  // Record the answer and, on the *final* one, fire the narrative call
  // immediately — the earliest possible moment, so the request overlaps the
  // whole thinking beat and the reveal rarely has to wait past it.
  function handleAnswer(option: Option) {
    const isFinal = answers.length + 1 >= questions.length;
    send({ type: 'answer', option });
    if (isFinal) narrative.start([...answers, option]);
  }

  function handleRetry() {
    send({ type: 'retry' });
    narrative.start(answers);
  }

  function handleRetake() {
    narrative.reset();
    send({ type: 'retake' });
  }

  // Final beat: the reveal waits on the narrative AND lands on a charge-cycle
  // boundary. The blob's charge storm breathes in sin² swell cycles (silent
  // and flat at every boundary — see BLOB.charge); when the fetch settles,
  // the dispatch is scheduled for the next boundary at least one full surge
  // in, so the cycle in flight always completes — whether the result arrives
  // before the ball even lands or the loop has been breathing for ten
  // seconds. Reveal on success, fail into the error state otherwise.
  useEffect(() => {
    if (!isFinalThinkingBeat || beatStart === null) return;
    if (narrative.status !== 'ready' && narrative.status !== 'error') return;
    const event: QuizEvent =
      narrative.status === 'ready' ? { type: 'advance' } : { type: 'fail' };
    const elapsed = performance.now() - beatStart;
    const wait = prefersReducedMotion
      ? 0
      : Math.max(
          FINAL_BEAT_INTRO_MS + CHARGE_CYCLE_MS,
          FINAL_BEAT_INTRO_MS +
            Math.ceil((elapsed - FINAL_BEAT_INTRO_MS) / CHARGE_CYCLE_MS) * CHARGE_CYCLE_MS,
        ) - elapsed;
    const timer = setTimeout(() => dispatch(event), Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [isFinalThinkingBeat, beatStart, narrative.status, prefersReducedMotion]);

  // Per-beat latch: clear the anchor whenever we're not in a beat so the next
  // one (including a retry) starts fresh.
  useEffect(() => {
    if (step !== 'thinking') setBeatStart(null);
  }, [step]);

  useEffect(() => {
    if (!hasUserNavigated.current || step === 'thinking') return;

    const target =
      step === 'start'
        ? startHeadingRef.current
        : step === 'quiz'
          ? questionHeadingRef.current
          : step === 'error'
            ? errorHeadingRef.current
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
          charging={isFinalThinkingBeat}
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
            // A card just finished exiting into a beat. Non-final beats wind up
            // on a fixed dwell; the final beat instead anchors the charge clock
            // and lets the gating effect above schedule the reveal on a cycle
            // boundary once the narrative resolves. (Retry re-enters here when
            // the error card exits.)
            if (step !== 'thinking') return;
            clearTimeout(thinkTimer.current);
            if (isFinalThinkingBeat) {
              setBeatStart(performance.now());
            } else {
              const dwell = prefersReducedMotion ? REDUCED_THINK_DWELL_MS : THINK_DWELL_MS;
              thinkTimer.current = setTimeout(() => dispatch({ type: 'advance' }), dwell);
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
              onAnswer={handleAnswer}
            />
          )}
          {step === 'result' && winner && (
            <ResultCard
              key="result"
              species={winner}
              narrative={narrative.narrative ?? undefined}
              headingRef={resultHeadingRef}
              onRetake={handleRetake}
            />
          )}
          {step === 'error' && (
            <ResultError
              key="error"
              headingRef={errorHeadingRef}
              onRetry={handleRetry}
              onRetake={handleRetake}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
