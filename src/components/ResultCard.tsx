'use client';

import { forwardRef } from 'react';
import type { Ref } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Species } from '@/data/species';
import { EXIT, OFFSET, PRESS, REDUCED_FADE, REVEAL_CASCADE, SETTLE } from '@/lib/motion';
import { InlineMarkdown } from './InlineMarkdown';

interface ResultCardProps {
  species: Species;
  /**
   * Phase-3 seam: the AI route will pass a personalized writeup here; defaults
   * to the species' authored description.
   */
  narrative?: string;
  headingRef?: Ref<HTMLHeadingElement>;
  onRetake: () => void;
}

// The staged reveal: the blob pop + glyph swap run first (owned by Blob), then
// REVEAL_CASCADE walks this card in — timeline in motion.ts. Theme takeover is
// owned by Quiz.
const container: Variants = {
  hidden: {},
  show: { transition: REVEAL_CASCADE },
  // Retake: drift down + fade in place while the landing chrome enters around
  // it and the blob glides back to its start spot.
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

// forwardRef: popLayout pins the exiting card through this ref (see StartScreen).
export const ResultCard = forwardRef<HTMLElement, ResultCardProps>(function ResultCard(
  { species, narrative, headingRef, onRetake },
  ref,
) {
  const prefersReducedMotion = useReducedMotion();
  const body = narrative ?? species.description;
  const containerVariants = prefersReducedMotion ? reducedContainer : container;
  const itemVariants = prefersReducedMotion ? reducedItem : item;

  return (
    <motion.section
      ref={ref}
      aria-labelledby="result-title"
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
          You are
        </motion.p>
        <motion.h1
          id="result-title"
          ref={headingRef}
          tabIndex={-1}
          variants={itemVariants}
          className="text-5xl uppercase text-accent focus:outline-none sm:text-6xl"
          style={{ fontStretch: 'var(--display-stretch)', fontWeight: 'var(--display-weight)' }}
        >
          {species.name}
        </motion.h1>
        <motion.p variants={itemVariants} className="text-lg text-foreground/75">
          {species.tagline}
        </motion.p>
      </div>

      <motion.p variants={itemVariants} className="leading-relaxed text-foreground/85">
        <InlineMarkdown text={body} />
      </motion.p>

      <motion.ul variants={itemVariants} className="flex flex-wrap justify-center gap-2">
        {species.traits.map((trait) => (
          <li
            key={trait}
            className="rounded-full border border-accent/60 px-3 py-1 text-sm text-foreground/85"
          >
            {trait}
          </li>
        ))}
      </motion.ul>

      <motion.div variants={itemVariants}>
        <motion.button
          type="button"
          onClick={onRetake}
          {...(prefersReducedMotion ? {} : PRESS)}
          className="mt-2 rounded-full border border-foreground/25 px-6 py-2.5 font-medium transition-colors hover:border-foreground/60"
        >
          Take it again
        </motion.button>
      </motion.div>
    </motion.section>
  );
});
