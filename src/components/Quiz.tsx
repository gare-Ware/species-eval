'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import { scoreQuiz } from '@/lib/scoring';
import { SLOWMO } from '@/lib/slowmo';
import { fadeSlide } from '@/lib/motion';
import { Starscape } from './Starscape';
import { Blob } from './Blob';
import type { Step } from './Blob';
import { StartScreen } from './StartScreen';
import { QuestionCard } from './QuestionCard';
import { ResultCard } from './ResultCard';

// The "thinking beat": once the answered card has left and the blob has enlarged +
// recentered, hold the empty centered blob this long before winding up the next
// question. Scaled by SLOWMO so the dev slow-mo toggle stretches it too.
const THINK_DWELL_MS = 350;

// The bottom hint rides the same restrained rise/sink as the question cards.
const hint = fadeSlide('below');

// Single client orchestrator: holds the flow state and choreographs one
// continuous scene. The blob never unmounts — headline and step content animate
// around it (AnimatePresence), and its `layout` prop glides it to each new spot.
export function Quiz() {
  const [step, setStep] = useState<Step>('start');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Option[]>([]);
  // Holds the pending wind-up while the blob "thinks". Cleared on unmount.
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(thinkTimer.current), []);

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

  function reset(nextStep: Step) {
    setStep(nextStep);
    setIndex(0);
    setAnswers([]);
  }

  // Route every answer through the centered 'thinking' beat: the answered card
  // leaves the content presence (exits downward) and the blob enlarges in place.
  // advance() then winds up the next question — see the content onExitComplete.
  function handleAnswer(option: Option) {
    // The answered card stays in the DOM (popped out of flow) for its short exit
    // fade and its buttons are still clickable — ignore late clicks so a fast
    // double-tap can't record two answers.
    if (step !== 'quiz') return;
    setAnswers([...answers, option]);
    setStep('thinking');
  }

  // Wind up out of the thinking beat. Derives the target from answers.length
  // (already includes the just-answered option), so no separate pending state.
  function advance() {
    if (answers.length >= questions.length) {
      setStep('result');
    } else {
      setIndex(answers.length);
      setStep('quiz');
    }
  }

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

        <Blob step={step} species={winner} onBegin={() => reset('quiz')} />

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
              thinkTimer.current = setTimeout(advance, THINK_DWELL_MS * SLOWMO);
            }
          }}
        >
          {step === 'quiz' && (
            <QuestionCard
              key={questions[index].id}
              question={questions[index]}
              index={index}
              total={questions.length}
              onAnswer={handleAnswer}
            />
          )}
          {step === 'result' && winner && (
            <ResultCard
              key="result"
              species={winner}
              onRetake={() => reset('start')}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
