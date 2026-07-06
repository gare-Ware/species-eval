'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Species } from '@/data/species';
import { EXIT, OFFSET, PRESS, REVEAL_CASCADE, SETTLE } from '@/lib/motion';

interface ResultCardProps {
  species: Species;
  /**
   * Phase-3 seam: the AI route will pass a personalized writeup here; defaults
   * to the species' authored description.
   */
  narrative?: string;
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

// forwardRef: popLayout pins the exiting card through this ref (see StartScreen).
export const ResultCard = forwardRef<HTMLElement, ResultCardProps>(function ResultCard(
  { species, narrative, onRetake },
  ref,
) {
  const body = narrative ?? species.description;

  return (
    <motion.section
      ref={ref}
      className="flex w-full flex-col items-center gap-6 text-center"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="flex flex-col items-center gap-2">
        <motion.p
          variants={item}
          className="font-mono text-xs uppercase tracking-[0.35em] text-foreground/50"
        >
          You are
        </motion.p>
        <motion.h1
          variants={item}
          className="text-5xl font-extrabold uppercase text-accent sm:text-6xl"
          style={{ fontStretch: 'var(--display-stretch)' }}
        >
          {species.name}
        </motion.h1>
        <motion.p variants={item} className="text-lg text-foreground/75">
          {species.tagline}
        </motion.p>
      </div>

      <motion.p variants={item} className="leading-relaxed text-foreground/85">
        {body}
      </motion.p>

      <motion.ul variants={item} className="flex flex-wrap justify-center gap-2">
        {species.traits.map((trait) => (
          <li
            key={trait}
            className="rounded-full border border-accent/60 px-3 py-1 text-sm text-foreground/85"
          >
            {trait}
          </li>
        ))}
      </motion.ul>

      <motion.div variants={item}>
        <motion.button
          type="button"
          onClick={onRetake}
          {...PRESS}
          className="mt-2 rounded-full border border-foreground/25 px-6 py-2.5 font-medium transition-colors hover:border-foreground/60"
        >
          Take it again
        </motion.button>
      </motion.div>
    </motion.section>
  );
});
