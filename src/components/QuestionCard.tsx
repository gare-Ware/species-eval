'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Option, Question } from '@/data/questions';
import {
  CONFIRM_HOLD_MS,
  FADE,
  fadeSlide,
  PICKED,
  PRESS_ROW,
  REDUCED_CONFIRM_HOLD_MS,
  SETTLE,
  SNAPPY,
  UNPICKED,
} from '@/lib/motion';

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  headingRef?: Ref<HTMLHeadingElement>;
  onAnswer: (option: Option) => void;
}

// Rises in from below, sinks back out (fadeSlide) — the card never travels far.
// The blob's travel is its own layout projection (see Blob).
const card = fadeSlide('below');

// forwardRef: popLayout pins the exiting card through this ref (see StartScreen).
export const QuestionCard = forwardRef<HTMLElement, QuestionCardProps>(function QuestionCard(
  { question, index, total, headingRef, onAnswer },
  ref,
) {
  // Confirm beat: the chosen row inverts + pops and the rest dim immediately;
  // onAnswer is deferred by CONFIRM_HOLD_MS so the pick registers before the
  // exit begins. Local state — the card remounts per question (keyed in Quiz).
  const prefersReducedMotion = useReducedMotion();
  const [picked, setPicked] = useState<Option['id'] | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  function pick(option: Option) {
    if (picked) return;
    setPicked(option.id);
    holdTimer.current = setTimeout(
      () => onAnswer(option),
      prefersReducedMotion ? REDUCED_CONFIRM_HOLD_MS : CONFIRM_HOLD_MS,
    );
  }

  const cardVariants = prefersReducedMotion ? FADE : card;

  return (
    <motion.section
      ref={ref}
      aria-labelledby={`question-${question.id}-title`}
      className="flex w-full flex-col gap-6"
      variants={cardVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
        <span>
          Question {index + 1} of {total}
        </span>
        <div
          className="h-1 w-24 overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <motion.div
            className="h-full w-full origin-left rounded-full bg-foreground/60"
            initial={{ scaleX: index / total }}
            animate={{ scaleX: (index + 1) / total }}
            transition={SETTLE}
          />
        </div>
      </div>

      <h2
        id={`question-${question.id}-title`}
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold focus:outline-none sm:text-3xl"
      >
        {question.prompt}
      </h2>

      {/* pointer-events-none during the hold: the choice is made, so hover and
          further taps go quiet while the confirm plays. */}
      <ul className={`flex flex-col gap-3 ${picked ? 'pointer-events-none' : ''}`}>
        {question.options.map((option) => {
          const isPicked = picked === option.id;
          const pickedTarget = prefersReducedMotion ? undefined : PICKED;
          const rowTarget = picked ? (isPicked ? pickedTarget : UNPICKED) : undefined;

          return (
            <li key={option.id}>
              <motion.button
                type="button"
                onClick={() => pick(option)}
                {...(prefersReducedMotion ? {} : PRESS_ROW)}
                animate={rowTarget}
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
