'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type { Option } from '@/data/questions';
import { questions } from '@/data/questions';
import { getSpecies } from '@/data/species';
import { scoreQuiz } from '@/lib/scoring';
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
          {step === 'start' && <StartScreen key="headline" />}
        </AnimatePresence>

        <Blob step={step} species={winner} onBegin={() => reset('quiz')} />

        <AnimatePresence mode="wait">
          {step === 'start' && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40"
            >
              Tap to begin · {questions.length} questions
            </motion.p>
          )}
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
