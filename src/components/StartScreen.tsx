'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { slow } from '@/lib/slowmo';

// Poster-stacked headline. Each line is its own tiny SVG: `textLength` forces
// every line to fill the exact same measure (true magazine justification, which
// CSS alone can't do), and the per-line font sizes below are tuned so the
// stretch correction stays small enough not to distort the glyphs.
// The question mark deliberately lives in the blob, not here.
const LINES = [
  { text: 'What', fontSize: 318, height: 240, baseline: 232 },
  { text: 'Species', fontSize: 248, height: 188, baseline: 181 },
  { text: 'Are You', fontSize: 228, height: 172, baseline: 166 },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  // Exit re-staggers top-down so the stack peels away line by line.
  exit: { transition: slow({ staggerChildren: 0.05 }) },
};

const line: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 520, damping: 42 },
  },
  // Slide the line away upward. popLayout pops the header out of flow at the same
  // time, so the blob glides up to fill the gap as the line leaves. Opacity holds
  // until the tail of the slide, so it reads as "sliding away", not a crossfade.
  exit: {
    y: -160,
    opacity: 0,
    transition: slow({
      duration: 0.2,
      ease: 'easeIn',
      opacity: { delay: 0.1, duration: 0.1 },
    }),
  },
};

// forwardRef is required for AnimatePresence mode="popLayout": Motion pops the
// exiting header out of flow by measuring it through this ref. Without it Motion
// can't pop the header, so it keeps its layout space until it unmounts — and the
// content jumps to fill the gap instead of filling smoothly during the peel.
export const StartScreen = forwardRef<HTMLElement>(function StartScreen(_props, ref) {
  return (
    <motion.header
      ref={ref}
      className="flex w-full flex-col gap-2"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <motion.p
        variants={line}
        className="mb-2 text-center font-mono text-xs uppercase tracking-[0.35em] text-foreground/40"
      >
        An alien species evaluation
      </motion.p>
      {LINES.map(({ text, fontSize, height, baseline }) => (
        <motion.div key={text} variants={line}>
          <svg
            viewBox={`0 0 1000 ${height}`}
            className="block w-full"
            role="presentation"
          >
            <text
              x="0"
              y={baseline}
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              fontSize={fontSize}
              className="fill-foreground font-sans font-extrabold"
              style={{ fontStretch: '92%' }}
            >
              {text}
            </text>
          </svg>
        </motion.div>
      ))}
    </motion.header>
  );
});
