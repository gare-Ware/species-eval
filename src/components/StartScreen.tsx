'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { slow } from '@/lib/slowmo';
import { GLIDE } from '@/lib/motion';

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

// Per-line peel stagger. 0 = the lines glide in and out in unison (the staggered
// version read as too lopsided — the bottom lines moved well before the top one
// did). Bump this (e.g. 0.05) to bring the line-by-line peel back; exit keeps
// staggerDirection -1 so that peel runs bottom-up and clears the blob first.
const STAGGER = 0;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.05 } },
  exit: { transition: slow({ staggerChildren: STAGGER, staggerDirection: -1 }) },
};

// forwardRef is required for AnimatePresence mode="popLayout": Motion pops the
// exiting header out of flow by measuring it through this ref. Without it Motion
// can't pop the header, so it keeps its layout space until it unmounts — and the
// content jumps to fill the gap instead of filling smoothly during the peel.
interface StartScreenProps {
  /** Viewport-relative off-screen slide distance, shared with the blob/hint/cards. */
  travel: number;
}

export const StartScreen = forwardRef<HTMLElement, StartScreenProps>(function StartScreen(
  { travel },
  ref,
) {
  // The whole stack slides down from off the top on enter and back up off the top
  // on exit, opaque (no fade) so it reads as a block sliding on/off screen rather
  // than dissolving — the tail opacity on exit is only a safety net for short
  // viewports. Both legs travel a full viewport (see useOffscreenTravel), so the
  // bottom line always clears the top edge regardless of display height. On the
  // shared GLIDE, so header and blob travel together on the start↔quiz peel and
  // the reverse retake return.
  const line: Variants = {
    hidden: { y: -travel, opacity: 1 },
    show: { y: 0, opacity: 1, transition: GLIDE },
    exit: {
      y: -travel,
      opacity: 0,
      transition: { ...GLIDE, opacity: slow({ delay: 0.3, duration: 0.18 }) },
    },
  };

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
