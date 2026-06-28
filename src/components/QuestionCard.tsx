'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Option, Question } from '@/data/questions';
import { slow } from '@/lib/slowmo';
import { GLIDE } from '@/lib/motion';

// How far below its resting spot a between-question card starts/ends — far enough
// to sit off the bottom of the viewport, so it glides on and off screen rather
// than fading in place. (The first card unfurls from height 0 instead.)
const CARD_TRAVEL = 560;

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  onAnswer: (option: Option) => void;
  /**
   * First card only (start→quiz): unfurl from height 0 so the column grows in
   * step with the blob shrinking — the committed reveal. Later cards instead
   * glide in as a block from off the bottom (see `card`), since each arrives out
   * of the centered 'thinking' beat (Quiz).
   */
  reveal?: boolean;
}

export function QuestionCard({ question, index, total, onAnswer, reveal = false }: QuestionCardProps) {
  // Clip only while the first card unfurls from height 0, so the option buttons'
  // hover scale isn't cropped at the card edges once it's settled.
  const [clip, setClip] = useState(reveal);

  // OUTER shell: the only element that occupies column height. Animating its
  // height is what re-centers the whole (vertically centered) column, so the
  // persistent blob glides — *down* as this collapses on exit, in step with the
  // card sliding off. Driving the blob through real flow (a CSS reflow per frame)
  // is reliable; Motion's layout projection wasn't catching this re-center, since
  // the blob sits *above* the gap and only moves because the column re-centers.
  const shell: Variants = {
    hidden: { height: reveal ? 0 : 'auto' },
    show: {
      height: 'auto',
      transition: reveal
        ? slow({ type: 'spring', stiffness: 480, damping: 40 })
        : { duration: 0 },
    },
    // Critically damped (ratio ≈ 1), NOT the underdamped GLIDE: springing the
    // height to 0 with overshoot makes it dip past 0 and bounce back a touch,
    // which re-grows the shell for a frame and bobs the blob on arrival — a
    // settle that scales with the collapse distance, so it varies per question.
    // No overshoot → the blob just eases down to center and stays.
    exit: { height: 0, transition: slow({ type: 'spring', stiffness: 320, damping: 36 }) },
  };

  // INNER card: the visible block. The first card's children stagger up + fade as
  // the shell unfurls; later cards slide in whole from off the bottom on the
  // shared GLIDE (no fade). Every card slides fully off the bottom on exit, while
  // the shell above collapses — the two read as one downward motion.
  const card: Variants = {
    hidden: reveal ? { opacity: 1, y: 0 } : { opacity: 1, y: CARD_TRAVEL },
    show: {
      opacity: 1,
      y: 0,
      transition: reveal
        ? slow({ staggerChildren: 0.05, delayChildren: 0.12 })
        : GLIDE,
    },
    // Opacity holds through the slide, fading only at the tail (safety for short
    // viewports) — so it reads as sliding off, not dissolving.
    exit: {
      opacity: 0,
      y: CARD_TRAVEL,
      transition: { ...GLIDE, opacity: slow({ delay: 0.3, duration: 0.18 }) },
    },
  };

  // First card's children fade + rise (staggered by `card`); later cards' content
  // is already visible and just rides the block slide.
  const item: Variants = {
    hidden: reveal ? { opacity: 0, y: 14 } : { opacity: 1, y: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: slow({ type: 'spring', stiffness: 480, damping: 38 }),
    },
  };

  return (
    // -mt-10 cancels the column's gap-10 between the blob and this card; the same
    // spacing is restored as pt-10 *inside* the section, so it lives in the
    // shell's animated height. That way the gap collapses with the height on exit
    // and there's no residual 40px to vanish — and jolt the blob ~20px — when the
    // card finally unmounts.
    <motion.div
      className={`-mt-10 w-full${clip ? ' overflow-hidden' : ''}`}
      variants={shell}
      initial="hidden"
      animate="show"
      exit="exit"
      // Release the unfurl clip once the first card settles, so the buttons' hover
      // scale isn't cropped at the card edges for the life of the question.
      onAnimationComplete={() => setClip(false)}
    >
      <motion.section className="flex w-full flex-col gap-6 pt-10" variants={card}>
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
    </motion.div>
  );
}
