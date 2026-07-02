'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';
import type { Option, Question } from '@/data/questions';
import { fadeSlide, PRESS_ROW, SETTLE, SNAPPY } from '@/lib/motion';

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  onAnswer: (option: Option) => void;
}

// The card rises in from just below and sinks back out on exit (a short offset +
// fade, see fadeSlide) — it never travels far. The persistent blob's vertical
// position is handled entirely by its own `layout` projection (see Blob): when a
// card mounts/unmounts, the centered column reflows and Motion projects the blob
// to its new resting spot on the shared GLIDE. One mechanism, no height-ramp.
const card = fadeSlide('below');

// forwardRef: the content island runs AnimatePresence mode="popLayout", which
// measures + pins the exiting card through this ref (see StartScreen for the
// full explanation of why popLayout needs it).
export const QuestionCard = forwardRef<HTMLElement, QuestionCardProps>(function QuestionCard(
  { question, index, total, onAnswer },
  ref,
) {
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

      <ul className="flex flex-col gap-3">
        {question.options.map((option) => (
          <li key={option.label}>
            <motion.button
              type="button"
              onClick={() => onAnswer(option)}
              {...PRESS_ROW}
              transition={SNAPPY}
              className="w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-5 py-4 text-left transition-colors hover:border-foreground/35 hover:bg-foreground/[0.08]"
            >
              {option.label}
            </motion.button>
          </li>
        ))}
      </ul>
    </motion.section>
  );
});
