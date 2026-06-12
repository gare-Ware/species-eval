'use client';

import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Option, Question } from '@/data/questions';

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  onAnswer: (option: Option) => void;
}

// Vertical rise + fade: the outgoing question drifts up toward the blob, the
// next one rises in from below. The orchestrator keys this component by question
// id inside <AnimatePresence mode="wait">, so exit fully plays before enter.
const card: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 480,
      damping: 40,
      staggerChildren: 0.05,
    },
  },
  exit: { opacity: 0, y: -28, transition: { duration: 0.18, ease: 'easeIn' } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 480, damping: 38 },
  },
};

export function QuestionCard({ question, index, total, onAnswer }: QuestionCardProps) {
  return (
    <motion.section
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
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <motion.h2 variants={item} className="text-2xl font-semibold sm:text-3xl">
        {question.prompt}
      </motion.h2>

      <ul className="flex flex-col gap-3">
        {question.options.map((option) => (
          <motion.li key={option.label} variants={item}>
            <motion.button
              type="button"
              onClick={() => onAnswer(option)}
              whileHover={{ scale: 1.012 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              className="w-full rounded-xl border border-foreground/10 bg-foreground/[0.04] px-5 py-4 text-left transition-colors hover:border-foreground/35 hover:bg-foreground/[0.08]"
            >
              {option.label}
            </motion.button>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
