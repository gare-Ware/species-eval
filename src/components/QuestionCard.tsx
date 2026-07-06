'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Option, Question } from '@/data/questions';
import {
  CONFIRM_HOLD_MS,
  fadeSlide,
  PICKED,
  PRESS_ROW,
  SETTLE,
  SNAPPY,
  UNPICKED,
} from '@/lib/motion';

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  onAnswer: (option: Option) => void;
}

// Rises in from below, sinks back out (fadeSlide) — the card never travels far.
// The blob's travel is its own layout projection (see Blob).
const card = fadeSlide('below');

// forwardRef: popLayout pins the exiting card through this ref (see StartScreen).
export const QuestionCard = forwardRef<HTMLElement, QuestionCardProps>(function QuestionCard(
  { question, index, total, onAnswer },
  ref,
) {
  // Confirm beat: the chosen row inverts + pops and the rest dim immediately;
  // onAnswer is deferred by CONFIRM_HOLD_MS so the pick registers before the
  // exit begins. Local state — the card remounts per question (keyed in Quiz).
  const [picked, setPicked] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  function pick(option: Option) {
    if (picked) return;
    setPicked(option.label);
    holdTimer.current = setTimeout(() => onAnswer(option), CONFIRM_HOLD_MS);
  }

  return (
    <motion.section
      ref={ref}
      className="flex w-full flex-col gap-6"
      variants={card}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
        <span>
          Question {index + 1} of {total}
        </span>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="h-full rounded-full bg-foreground/60"
            initial={{ width: `${(index / total) * 100}%` }}
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={SETTLE}
          />
        </div>
      </div>

      <h2 className="text-2xl font-semibold sm:text-3xl">{question.prompt}</h2>

      {/* pointer-events-none during the hold: the choice is made, so hover and
          further taps go quiet while the confirm plays. */}
      <ul className={`flex flex-col gap-3 ${picked ? 'pointer-events-none' : ''}`}>
        {question.options.map((option) => {
          const isPicked = picked === option.label;
          return (
            <li key={option.label}>
              <motion.button
                type="button"
                onClick={() => pick(option)}
                {...PRESS_ROW}
                animate={picked ? (isPicked ? PICKED : UNPICKED) : undefined}
                transition={SNAPPY}
                className={`w-full rounded-xl border px-5 py-4 text-left transition-colors ${
                  isPicked
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground/10 bg-foreground/[0.04] hover:border-foreground/35 hover:bg-foreground/[0.08]'
                }`}
              >
                {option.label}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
});
