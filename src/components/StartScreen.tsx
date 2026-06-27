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

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  // Exit peels bottom-up (staggerDirection -1): the line nearest the blob leaves
  // FIRST, so the blob rises into already-vacated space instead of catching the
  // still-frozen line above it (top-down stagger left that line sitting there
  // ~0.12s while the blob glided up into it). The big-travel lines also outrun
  // the blob, so the header clears as the blob rises — together, no overlap.
  exit: { transition: slow({ staggerChildren: 0.04, staggerDirection: -1 }) },
};

const line: Variants = {
  // Enter from above, mirroring the upward exit — the lines drop into place from
  // off the top. The larger travel makes the entrance a visible *slide* on both
  // first load and retake; the old 30px move was so small it read as a pop/fade.
  // Coming from above also keeps the lines clear of the blob on the way in.
  hidden: { y: -200, opacity: 0 },
  // Enter on the shared GLIDE so, on the reverse flows (result/retake → start),
  // the header settles in step with the blob gliding back down — not racing
  // ahead of it (which read as "appears much earlier" than the blob).
  show: {
    y: 0,
    opacity: 1,
    transition: GLIDE,
  },
  // Slide the line clear of the viewport top on the same GLIDE the blob rides
  // up — they travel together. popLayout pops the header out of flow so the blob
  // glides up into the gap. The travel is large enough to fully leave the screen,
  // and opacity holds through the slide and only fades at the tail, so it reads
  // as sliding off, not dissolving.
  exit: {
    y: -520,
    opacity: 0,
    transition: { ...GLIDE, opacity: slow({ delay: 0.3, duration: 0.18 }) },
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
