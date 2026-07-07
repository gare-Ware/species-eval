import type { Transition, Variants } from 'motion/react';
import { slow, slowMs } from './slowmo';

// ─────────────────────────────────────────────────────────────────────────────
// Motion identity — the app's entire vocabulary: named springs, interaction
// affordances, enter/exit variants, and cross-component choreography beats.
// Components use these tokens; raw { stiffness, damping } literals live only here.
//
// Personality: "premium with a little life" — calm, decisive springs, with one
// springy overshoot (POP) reserved for the result reveal.
//
// Every token is pre-scaled through slow()/slowMs() at import, so the dev
// slow-mo toggle (slowmo.ts) stretches the whole app without components
// touching slow() themselves.
// ─────────────────────────────────────────────────────────────────────────────

// Shared position glide: the blob's `layout` spring and the content transitions
// ride the same curve so they never desync.
export const GLIDE: Transition = slow({ type: 'spring', stiffness: 320, damping: 26 });

// Calm settle, no overshoot — elements easing to rest (result items, progress fill).
export const SETTLE: Transition = slow({ type: 'spring', stiffness: 420, damping: 36 });

// Quick, decisive feedback — presses and small state changes.
export const SNAPPY: Transition = slow({ type: 'spring', stiffness: 600, damping: 32 });

// The one intentional overshoot — the result reveal (blob size jump + glyph pop).
const POP_SPRING = { type: 'spring', stiffness: 380, damping: 18 } as const;
export const POP: Transition = slow(POP_SPRING);

// Quick accelerating fade for exits — shorter than entrances, gets out of the way.
const EXIT_SECONDS = 0.22;
export const EXIT: Transition = slow({ duration: EXIT_SECONDS, ease: [0.3, 0, 1, 1] });

// Reduced-motion path: opacity-only, short, and no spring/layout choreography.
export const REDUCED_FADE: Transition = { duration: 0.12, ease: [0.2, 0, 0, 1] };
export const FADE: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: REDUCED_FADE },
  exit: { opacity: 0, transition: REDUCED_FADE },
};

// ─── Interaction ─────────────────────────────────────────────────────────────
// One hover/tap language for every pressable, by button shape:
//   PRESS      — compact controls (the retake pill)
//   PRESS_HERO — the blob: the primary invitation, so a touch more
//   PRESS_ROW  — full-width rows: scaling a wide element reads as jumpy, so
//                hover stays a CSS color shift and only the tap dips
export const PRESS = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } as const;
export const PRESS_HERO = { whileHover: { scale: 1.06 }, whileTap: { scale: 0.94 } } as const;
export const PRESS_ROW = { whileTap: { scale: 0.99 } } as const;

// Answer-confirm targets: the chosen row pops up a touch and holds, the rest
// dim. The chosen row's color inversion is CSS (see QuestionCard).
export const PICKED = { scale: 1.02 } as const;
export const UNPICKED = { opacity: 0.45 } as const;

// ─── Enter / exit ────────────────────────────────────────────────────────────
// Restrained content swaps: a short offset + fade, never a full-screen glide.
// `from` is the side an element enters from and exits back toward:
//   'above' → top chrome (headline) · 'below' → bottom chrome + cards
export const OFFSET = 24;

export function fadeSlide(from: 'above' | 'below'): Variants {
  const y = from === 'above' ? -OFFSET : OFFSET;
  return {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: GLIDE },
    exit: { opacity: 0, y, transition: EXIT },
  };
}

// Stagger for a parent revealing children in sequence; time keys ride slow().
export function stagger(delayChildren: number, staggerChildren: number, staggerDirection?: number): Transition {
  return slow({
    delayChildren,
    staggerChildren,
    ...(staggerDirection ? { staggerDirection } : {}),
  });
}

// ─── Choreography beats ──────────────────────────────────────────────────────
// Cross-component timing, kept together so retuning a sequence is a one-screen edit.

// Confirm hold: how long the picked answer stays on screen before the card's
// exit begins (QuestionCard defers onAnswer by this).
export const CONFIRM_HOLD_MS = slowMs(500);
export const REDUCED_CONFIRM_HOLD_MS = 150;

// Thinking beat: hold on the empty centered blob between questions before the
// next card winds up (a setTimeout in Quiz, hence ms).
export const THINK_DWELL_MS = slowMs(350);
export const REDUCED_THINK_DWELL_MS = 0;

// Result reveal timeline: the blob pops to size (POP, in Blob) → the "?" clears
// on EXIT and the glyph pops in ~0.4s after the step change (GLYPH_POP's delay
// runs from glyph mount, i.e. after the "?" exit) → the card cascade walks
// down, landing the whole sequence around the 2s mark.
export const GLYPH_POP: Transition = slow({ ...POP_SPRING, delay: 0.18 });
export const REVEAL_CASCADE: Transition = stagger(EXIT_SECONDS + 0.18 + 0.15, 0.11);

// ─── Ambient ─────────────────────────────────────────────────────────────────
// The blob's idle life (breathing pulse, surface waves, weight + velocity
// physics) lives in lib/blob.ts — it runs on its own rAF loop off the React
// render cycle, so it never fights the step-driven size/position springs.
