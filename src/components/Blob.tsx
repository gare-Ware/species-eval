'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { Species } from '@/data/species';
import { slow } from '@/lib/slowmo';
import { GLIDE } from '@/lib/motion';
import { SpeciesGlyph } from './SpeciesGlyph';

export type Step = 'start' | 'quiz' | 'thinking' | 'result';

interface BlobProps {
  step: Step;
  /** The winning species — only set during the result step. */
  species: Species | null;
  onBegin: () => void;
}

// One persistent element across every step — it never unmounts, it just changes
// size (animate) and position (layout, when siblings come and go). That
// continuity is what makes the flow read as one scene instead of separate pages.
// `thinking` is the between-question beat: the card empties out and the blob
// enlarges + recenters here, so differing question heights never jump (see Quiz).
const SIZE: Record<Step, number> = { start: 152, quiz: 64, thinking: 120, result: 168 };

export function Blob({ step, species, onBegin }: BlobProps) {
  const interactive = step === 'start';

  return (
    <motion.button
      // Position-only layout glide: size is the explicit width/height animate
      // below, so the projection only handles position (its GLIDE is shared with
      // the start-chrome). This drives the blob on the step re-renders — start↔
      // quiz↔result and the wind-up *up* out of the thinking beat. The *down*
      // glide between questions is driven instead by the leaving card collapsing
      // its height (QuestionCard), which re-centers the column under the blob —
      // projection alone wasn't catching that re-center (blob sits above the gap).
      layout="position"
      type="button"
      aria-label={interactive ? 'Begin the quiz' : undefined}
      disabled={!interactive}
      onClick={interactive ? onBegin : undefined}
      animate={{ width: SIZE[step], height: SIZE[step] }}
      // Size: lower damping on the result reveal gives the size jump a springy
      // overshoot — that bounce *is* the "blob pulses" beat of the reveal.
      // Position: the `layout` glide is pinned to the shared GLIDE so the blob
      // and the start-chrome (headline, hint) travel on the same spring.
      transition={{
        ...slow({ type: 'spring', stiffness: 320, damping: step === 'result' ? 16 : 26 }),
        layout: GLIDE,
      }}
      whileHover={interactive ? { scale: 1.06 } : undefined}
      whileTap={interactive ? { scale: 0.93 } : undefined}
      className="relative shrink-0 rounded-full bg-accent transition-colors duration-700 [container-type:size] enabled:cursor-pointer"
    >
      {/* Breathing lives on an inner layer so the infinite loop never fights the
          step-driven size/position animations on the button itself. */}
      <motion.span
        className="absolute inset-0 grid place-items-center"
        animate={{ scale: [1, 1.045, 1] }}
        transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
      >
        <AnimatePresence mode="wait">
          {step === 'result' && species ? (
            <motion.span
              key={species.id}
              initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.25 }}
              className="grid h-[58cqw] w-[58cqw] place-items-center text-background"
            >
              <SpeciesGlyph id={species.id} className="h-full w-full" />
            </motion.span>
          ) : (
            <motion.span
              key="question-mark"
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15 } }}
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
