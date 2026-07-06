'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { fadeSlide, stagger } from '@/lib/motion';

// Poster-stacked headline. Each line is its own SVG: textLength justifies every
// line to the same measure (true magazine justification, which CSS can't do);
// the per-line font sizes keep the stretch correction small enough not to
// distort glyphs. The question mark deliberately lives in the blob, not here.
const LINES = [
  { text: 'What', fontSize: 318, height: 240, baseline: 232 },
  { text: 'Species', fontSize: 248, height: 188, baseline: 181 },
  { text: 'Are You', fontSize: 228, height: 172, baseline: 166 },
];

// Per-line peel stagger. 0 = the lines settle in and out in unison; raise it
// (e.g. 0.05) for a line-by-line peel — exit keeps staggerDirection -1 so a
// peel runs bottom-up and clears the blob first.
const STAGGER = 0;

// The stack settles down in from just above and drifts back up out — a short
// offset + fade on the shared GLIDE, so header and blob travel together.
const line: Variants = fadeSlide('above');

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } },
  exit: { transition: stagger(0, STAGGER, -1) },
};

// forwardRef: AnimatePresence mode="popLayout" measures and pins the exiting
// element through this ref; without it the header keeps its layout space until
// unmount and the content below jumps instead of filling smoothly.
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
      {/* The SVG headline has no accessible name; this carries the real heading. */}
      <h1 className="sr-only">What species are you?</h1>

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
              style={{ fontStretch: 'var(--display-stretch)' }}
            >
              {text}
            </text>
          </svg>
        </motion.div>
      ))}
    </motion.header>
  );
});
