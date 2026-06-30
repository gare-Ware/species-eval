'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { Option, Question } from '@/data/questions';
import { slow } from '@/lib/slowmo';
import { GLIDE } from '@/lib/motion';

interface QuestionCardProps {
  question: Question;
  index: number; // 0-based
  total: number;
  onAnswer: (option: Option) => void;
}

// Every card enters from one full viewport below its resting spot and exits the
// same way, so it always travels from / to *fully* off-screen — a fixed offset
// can't, since the card rests near the middle of the column and the distance to
// the bottom edge grows with viewport height (a too-small offset made tall
// screens see the card pop into view at the bottom, then glide up). One viewport
// is a safe over-reach: wherever the card rests, +100vh clears the fold. main's
// overflow-clip hides the off-screen leg.
function useOffscreenTravel() {
  const [travel, setTravel] = useState(() =>
    typeof window === 'undefined' ? 900 : window.innerHeight,
  );
  useEffect(() => {
    const onResize = () => setTravel(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return travel;
}

export function QuestionCard({ question, index, total, onAnswer }: QuestionCardProps) {
  const travel = useOffscreenTravel();

  // OUTER shell: the only element that occupies column height, and the only thing
  // that drives the persistent blob's vertical glide. Its height ramps 0→auto on
  // enter and back to 0 on exit; since the column is vertically centered, that
  // reflow re-centers the column every frame and the blob (sitting above the gap)
  // glides with it — up as the card grows in, down as it collapses out. Driving
  // the blob through real flow like this is reliable; Motion's layout projection
  // wasn't catching this re-center on its own.
  //
  // Ramping (rather than reserving full height instantly) is also what keeps the
  // page from scrolling: the card's full height only lands as the blob finishes
  // shrinking, so blob + card never overflow the viewport mid-transition the way
  // a big start-blob beside a full-height card would. The card content slides in
  // over the top of this via its own transform (see `card`) and spills past the
  // shell's bottom while it travels — clipped off-screen by main's overflow-clip.
  const shell: Variants = {
    hidden: { height: 0 },
    // Critically damped (ratio ≈ 1), NOT the underdamped GLIDE: a height spring
    // with overshoot would dip past the target and bounce, bobbing the blob on
    // arrival. No overshoot → the blob just eases to its spot and stays.
    show: { height: 'auto', transition: slow({ type: 'spring', stiffness: 320, damping: 36 }) },
    exit: { height: 0, transition: slow({ type: 'spring', stiffness: 320, damping: 36 }) },
  };

  // INNER card: the visible block slides in whole from off the bottom and back off
  // on exit, both on the shared GLIDE — the same spring the blob rides, so card
  // and blob travel together. Opacity holds through the slide and fades only at
  // the tail (a safety net for short viewports), so it reads as sliding off, not
  // dissolving.
  const card: Variants = {
    hidden: { opacity: 1, y: travel },
    show: { opacity: 1, y: 0, transition: GLIDE },
    exit: {
      opacity: 0,
      y: travel,
      transition: { ...GLIDE, opacity: slow({ delay: 0.3, duration: 0.18 }) },
    },
  };

  return (
    // -mt-10 cancels the column's gap-10 between the blob and this card; the same
    // spacing is restored as pt-10 *inside* the section, so it lives in the shell's
    // animated height. That way the gap collapses with the height on exit and
    // there's no residual 40px to vanish — and jolt the blob ~20px — when the card
    // finally unmounts.
    <motion.div
      className="-mt-10 w-full"
      variants={shell}
      initial="hidden"
      animate="show"
      exit="exit"
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

        <h2 className="text-2xl font-semibold sm:text-3xl">{question.prompt}</h2>

        <ul className="flex flex-col gap-3">
          {question.options.map((option) => (
            <li key={option.label}>
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
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  );
}
