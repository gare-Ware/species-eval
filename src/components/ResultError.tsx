'use client';

import { forwardRef } from 'react';
import type { Ref } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { EXIT, OFFSET, PRESS, REDUCED_FADE, REVEAL_CASCADE, SETTLE } from '@/lib/motion';

interface ResultErrorProps {
  /** Re-fire the narrative request (back into the blocking beat). */
  onRetry: () => void;
  /** Start the whole quiz over. */
  onRetake: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}

// The honest failure state: the reveal blocks on the AI, and when it can't
// deliver we say so rather than passing off the generic description as "your
// result". Base palette (no species takeover) — this isn't a match.
const container: Variants = {
  hidden: {},
  show: { transition: REVEAL_CASCADE },
  exit: { opacity: 0, y: OFFSET, transition: EXIT },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: SETTLE },
};

const reducedContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: REDUCED_FADE },
  exit: { opacity: 0, transition: REDUCED_FADE },
};

const reducedItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: REDUCED_FADE },
};

export const ResultError = forwardRef<HTMLElement, ResultErrorProps>(function ResultError(
  { onRetry, onRetake, headingRef },
  ref,
) {
  const prefersReducedMotion = useReducedMotion();
  const containerVariants = prefersReducedMotion ? reducedContainer : container;
  const itemVariants = prefersReducedMotion ? reducedItem : item;

  return (
    <motion.section
      ref={ref}
      aria-labelledby="result-error-title"
      className="flex w-full flex-col items-center gap-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="flex flex-col items-center gap-2">
        <motion.p
          variants={itemVariants}
          className="font-mono text-xs uppercase tracking-[0.35em] text-foreground/50"
        >
          Transmission error
        </motion.p>
        <motion.h1
          id="result-error-title"
          ref={headingRef}
          tabIndex={-1}
          variants={itemVariants}
          className="text-4xl text-foreground focus:outline-none sm:text-5xl"
          style={{ fontWeight: 'var(--display-weight)' }}
        >
          The signal broke up
        </motion.h1>
        <motion.p variants={itemVariants} className="text-lg text-foreground/75">
          Your reading didn&rsquo;t come through.
        </motion.p>
      </div>

      <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3">
        <motion.button
          type="button"
          onClick={onRetry}
          {...(prefersReducedMotion ? {} : PRESS)}
          className="rounded-full border border-foreground/20 bg-foreground/16 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-foreground/50 hover:bg-foreground/24"
        >
          Try again
        </motion.button>
        <motion.button
          type="button"
          onClick={onRetake}
          {...(prefersReducedMotion ? {} : PRESS)}
          className="rounded-full border border-foreground/15 bg-foreground/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-foreground/40 hover:bg-foreground/16"
        >
          Start over
        </motion.button>
      </motion.div>
    </motion.section>
  );
});
