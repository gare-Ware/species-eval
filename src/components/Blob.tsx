'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Species } from '@/data/species';
import type { Step } from '@/lib/flow';
import { BREATHE, EXIT, GLIDE, GLYPH_POP, POP, PRESS_HERO, REDUCED_FADE } from '@/lib/motion';
import { SpeciesGlyph } from './SpeciesGlyph';

interface BlobProps {
  step: Step;
  /** The winning species — only set during the result step. */
  species: Species | null;
  onBegin: () => void;
}

// The one persistent element: never unmounts, only changes size (animate) and
// position (layout) — the continuity that makes the flow read as one scene.
// 'thinking' is the enlarged between-question size.
const SIZE: Record<Step, number> = { start: 152, quiz: 64, thinking: 120, result: 168 };

export function Blob({ step, species, onBegin }: BlobProps) {
  const prefersReducedMotion = useReducedMotion();
  const interactive = step === 'start';

  return (
    <motion.button
      // Position-only projection: size is the explicit width/height animate, so
      // `layout` handles just position. Step re-renders drive the glides; the
      // *down* glide between questions comes from the leaving card collapsing
      // the column, which projection re-centers under the blob.
      layout="position"
      type="button"
      aria-label={interactive ? 'Begin the quiz' : undefined}
      aria-hidden={!interactive}
      disabled={!interactive}
      onClick={interactive ? onBegin : undefined}
      animate={{ width: SIZE[step], height: SIZE[step] }}
      // Size: the result rides POP (the reveal bounce); everything else the calm
      // GLIDE. Position: pinned to the shared GLIDE so blob and chrome travel on
      // one spring.
      transition={{
        ...(step === 'result' ? POP : GLIDE),
        layout: GLIDE,
      }}
      whileHover={interactive && !prefersReducedMotion ? PRESS_HERO.whileHover : undefined}
      whileTap={interactive && !prefersReducedMotion ? PRESS_HERO.whileTap : undefined}
      className="relative shrink-0 rounded-full bg-accent transition-colors duration-(--theme-fade) [container-type:size] enabled:cursor-pointer"
    >
      {/* Inner layer: the breathing loop stays off the step-driven button springs. */}
      <motion.span
        className="absolute inset-0 grid place-items-center"
        {...(prefersReducedMotion ? {} : BREATHE)}
      >
        <AnimatePresence mode="wait">
          {step === 'result' && species ? (
            <motion.span
              key={species.id}
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -10 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
              // Second reveal beat: the "?" clears on EXIT and the glyph pops in
              // on GLYPH_POP (timeline in motion.ts).
              transition={prefersReducedMotion ? REDUCED_FADE : GLYPH_POP}
              className="grid h-[58cqw] w-[58cqw] place-items-center text-background"
            >
              <SpeciesGlyph id={species.id} className="h-full w-full" />
            </motion.span>
          ) : (
            <motion.span
              key="question-mark"
              exit={
                prefersReducedMotion
                  ? { opacity: 0, transition: REDUCED_FADE }
                  : { scale: 0.5, opacity: 0, transition: EXIT }
              }
              className="font-extrabold text-background"
              style={{ fontSize: '54cqw', lineHeight: 1 }}
            >
              ?
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </motion.button>
  );
}
