'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { fadeSlide, stagger } from '@/lib/motion';

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

// Per-line peel stagger. 0 = the lines settle in and out in unison (the staggered
// version read as too lopsided — the bottom lines moved well before the top one
// did). Bump this (e.g. 0.05) to bring the line-by-line peel back; exit keeps
// staggerDirection -1 so that peel runs bottom-up and clears the blob first.
const STAGGER = 0;

// The whole stack settles down from just above on enter and drifts back up on
// exit — a short offset + fade (see fadeSlide), not a full-screen slide. On the
// shared GLIDE, so header and blob travel together on the start↔quiz peel.
const line: Variants = fadeSlide('above');

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } },
  exit: { transition: stagger(0, STAGGER, -1) },
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
      {/* The poster headline is drawn as SVG text (below) with no accessible name,
          so this carries the real heading for screen readers and search engines. */}
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
