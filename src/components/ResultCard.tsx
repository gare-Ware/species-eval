'use client';

import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Species } from '@/data/species';
import { slow } from '@/lib/slowmo';

interface ResultCardProps {
  species: Species;
  /**
   * Phase 3 seam: the result narrative. Defaults to the species' authored
   * description today; the AI route will pass a personalized writeup here later
   * with no layout change.
   */
  narrative?: string;
  onRetake: () => void;
}

// The staged reveal, beat by beat: the blob has already sprung to full size and
// swapped in the species glyph (~0.4s, owned by Blob); delayChildren starts this
// cascade right after, and the stagger walks down the card — kicker, name,
// tagline, body, traits, retake — landing the whole sequence around the 2s mark.
// Theme takeover (species color via --foreground/--accent) is owned by Quiz.
const container: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.55, staggerChildren: 0.11 } },
  // Retake: glide the whole card down and off, then fade. The landing chrome is
  // held back until this finishes (see Quiz), so the result clearly leaves before
  // the start screen arrives — instead of fading in place or jumping.
  exit: {
    opacity: 0,
    y: 220,
    transition: slow({ duration: 0.35, ease: 'easeIn', opacity: { duration: 0.28 } }),
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 36 },
  },
};

export function ResultCard({ species, narrative, onRetake }: ResultCardProps) {
  const body = narrative ?? species.description;

  return (
    <motion.section
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
          style={{ fontStretch: '92%' }}
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
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="mt-2 rounded-full border border-foreground/25 px-6 py-2.5 font-medium transition-colors hover:border-foreground/60"
        >
          Take it again
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
