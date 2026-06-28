'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import { scoreQuiz } from '@/lib/scoring';
import { slow } from '@/lib/slowmo';
import { GLIDE } from '@/lib/motion';
import { Starscape } from './Starscape';
import { Blob } from './Blob';
import type { Step } from './Blob';
import { StartScreen } from './StartScreen';
import { QuestionCard } from './QuestionCard';
import { ResultCard } from './ResultCard';

// Single client orchestrator: holds the flow state and choreographs one
// continuous scene. The blob never unmounts — headline and step content animate
// around it (AnimatePresence), and its `layout` prop glides it to each new spot.
export function Quiz() {
  const [step, setStep] = useState<Step>('start');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Option[]>([]);
  // Gates the landing chrome (headline + hint) on retake: held false while the
  // result glides off, then released once it's gone (see reset + onExitComplete),
  // so the result leaves before the start screen arrives instead of being shoved.
  const [landingReady, setLandingReady] = useState(true);

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
    // On retake (→ start), hold the landing chrome back until the result has
    // glided off — released in the content AnimatePresence's onExitComplete — so
    // the species card clearly leaves first, instead of being shoved down by the
    // headline and hint as they enter.
    if (nextStep === 'start') setLandingReady(false);
  }

  function handleAnswer(option: Option) {
    const next = [...answers, option];
    setAnswers(next);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setStep('result');
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
          {step === 'start' && landingReady && <StartScreen key="headline" />}
        </AnimatePresence>

        <Blob step={step} species={winner} onBegin={() => reset('quiz')} />

        {/* The hint gets its own popLayout island so its motion is independent of
            the content swap below. It's opaque and starts/ends fully off the
            bottom (mirroring the header off the top), so it reads as sliding in
            from off-screen and back out — no fade — and comes back from where it
            left. Tail-fade on exit is only a safety net for short viewports. */}
        <AnimatePresence mode="popLayout">
          {step === 'start' && landingReady && (
            <motion.p
              key="hint"
              initial={{ y: 520, opacity: 1 }}
              animate={{ y: 0, opacity: 1, transition: GLIDE }}
              exit={{ y: 520, opacity: 0, transition: { ...GLIDE, opacity: slow({ delay: 0.3, duration: 0.18 }) } }}
              className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40"
            >
              Tap to begin · {questions.length} questions
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" onExitComplete={() => setLandingReady(true)}>
          {step === 'quiz' && (
            <QuestionCard
              key={questions[index].id}
              question={questions[index]}
              index={index}
              total={questions.length}
              onAnswer={handleAnswer}
              reveal={index === 0}
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
