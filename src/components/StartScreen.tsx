'use client';

import { forwardRef } from 'react';
import type { Ref } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { FADE, fadeSlide, stagger } from '@/lib/motion';

interface StartScreenProps {
  headingRef?: Ref<HTMLHeadingElement>;
}

// Poster-stacked headline. Each line is its own SVG: textLength justifies every
// line to the same measure (true magazine justification, which CSS can't do);
// the per-line font sizes keep the stretch correction small enough not to
// distort glyphs. The question mark deliberately lives in the blob, not here.
// Metrics measured against Fraunces at weight 900/opsz 144 (flat caps 0.700em,
// round caps overshoot to 0.714em above and 0.014em below the baseline):
// fontSize puts each line's natural width ≈ 985 so textLength adds only a hair
// of tracking; baseline = 0.714em + 1; height = baseline + the below-overshoot.
// Retune if the font or --display-weight changes.
const LINES = [
  { text: 'WHAT', fontSize: 318, height: 234, baseline: 228 },
  { text: 'SPECIES', fontSize: 235, height: 174, baseline: 169 },
  { text: 'ARE YOU', fontSize: 232, height: 172, baseline: 167 },
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

const quietContainer: Variants = {
  hidden: {},
  show: {},
  exit: {},
};

// forwardRef: AnimatePresence mode="popLayout" measures and pins the exiting
// element through this ref; without it the header keeps its layout space until
// unmount and the content below jumps instead of filling smoothly.
export const StartScreen = forwardRef<HTMLElement, StartScreenProps>(function StartScreen(
  { headingRef },
  ref,
) {
  const prefersReducedMotion = useReducedMotion();
  const lineVariants = prefersReducedMotion ? FADE : line;
  const containerVariants = prefersReducedMotion ? quietContainer : container;

  return (
    <motion.header
      ref={ref}
      // Billboard sizing: wider than the reading column, capped by viewport
      // height so the start screen never scrolls — see --headline-width in
      // globals.css. shrink-0 lets it exceed the max-w-xl shell and stay centered.
      className="flex shrink-0 flex-col gap-2"
      style={{ width: 'var(--headline-width)' }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* The SVG headline has no accessible name; this carries the real heading. */}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        What species are you?
      </h1>

      <motion.p
        variants={lineVariants}
        className="mb-2 text-center font-mono text-xs uppercase tracking-[0.35em] text-foreground/40"
      >
        An alien species evaluation
      </motion.p>
      {LINES.map(({ text, fontSize, height, baseline }) => (
        <motion.div key={text} variants={lineVariants}>
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
              className="fill-foreground font-sans"
              style={{ fontStretch: 'var(--display-stretch)', fontWeight: 'var(--display-weight)' }}
            >
              {text}
            </text>
          </svg>
        </motion.div>
      ))}
    </motion.header>
  );
});
