import type { Transition, Variants } from 'motion/react';
import { slow, slowMs } from './slowmo';

// ─────────────────────────────────────────────────────────────────────────────
// Motion identity
//
// The app's whole motion vocabulary lives here so components pull from a shared
// set of named springs instead of scattering raw { stiffness, damping } literals.
// Personality: "premium with a little life" — mostly calm, decisive springs, with
// exactly one springy overshoot (POP) reserved for the result reveal.
//
// Every token is pre-scaled through slow() (or slowMs()) once at import, so the
// dev slow-mo toggle (slowmo.ts) stretches the entire app in time without any
// component having to touch slow() itself.
// ─────────────────────────────────────────────────────────────────────────────

// The shared position glide — the spring the blob rides for its `layout`
// projection, and the one content transitions ride, so they always travel on the
// same curve instead of desyncing.
export const GLIDE: Transition = slow({ type: 'spring', stiffness: 320, damping: 26 });

// Calm settle, no overshoot — for elements easing to a resting spot (result-card
// items, the progress fill) where a bounce would read as fidgety.
export const SETTLE: Transition = slow({ type: 'spring', stiffness: 420, damping: 36 });

// Quick, decisive feedback — button press springs and other small state changes.
export const SNAPPY: Transition = slow({ type: 'spring', stiffness: 600, damping: 32 });

// The one intentional overshoot — the result reveal (blob size jump + glyph pop).
// Lower damping = the springy pulse that *is* the reveal beat.
const POP_SPRING = { type: 'spring', stiffness: 380, damping: 18 } as const;
export const POP: Transition = slow(POP_SPRING);

// A quick accelerating fade for exits. Exits are shorter than entrances (users
// care about what appears, not what leaves), and an ease-in "gets out of the way".
const EXIT_SECONDS = 0.22;
export const EXIT: Transition = slow({ duration: EXIT_SECONDS, ease: [0.3, 0, 1, 1] });

// ─── Interaction ─────────────────────────────────────────────────────────────
// One hover/tap language for every pressable, so buttons stop each inventing
// their own scale. Three named affordances by button shape:
//   PRESS      — compact controls (the retake pill)
//   PRESS_HERO — the blob: the primary invitation, so a touch more
//   PRESS_ROW  — full-width list rows: scaling a wide element reads as jumpy, so
//                hover is left to the color shift (CSS) and only the tap dips
export const PRESS = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } as const;
export const PRESS_HERO = { whileHover: { scale: 1.06 }, whileTap: { scale: 0.94 } } as const;
export const PRESS_ROW = { whileTap: { scale: 0.99 } } as const;

// The answer-confirm beat (zero added latency — the transition proceeds
// immediately): the chosen row pops up a touch and holds while the card exits;
// the unchosen rows dim so the pick reads as the survivor. Color inversion on
// the chosen row is CSS (see QuestionCard).
export const PICKED = { scale: 1.02 } as const;
export const UNPICKED = { opacity: 0.45 } as const;

// ─── Enter / exit ────────────────────────────────────────────────────────────
// The restrained content-swap vocabulary: a short offset + fade, NOT a full-screen
// glide. Distance stays well under the "no motion travels more than ~1/3 of the
// screen" ceiling, so a transition reads as "content arrived" rather than "scenery
// slid past". `from` is the side an element enters from and exits back toward:
//   'above' → top chrome (headline): settles down in, drifts up out
//   'below' → bottom chrome + cards: rises in, sinks out
export const OFFSET = 24;

export function fadeSlide(from: 'above' | 'below'): Variants {
  const y = from === 'above' ? -OFFSET : OFFSET;
  return {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: GLIDE },
    exit: { opacity: 0, y, transition: EXIT },
  };
}

// Stagger helper for a parent that reveals its children in sequence. Time keys are
// scaled through slow() so a staggered cascade stretches with the dev toggle too.
export function stagger(delayChildren: number, staggerChildren: number, staggerDirection?: number): Transition {
  return slow({
    delayChildren,
    staggerChildren,
    ...(staggerDirection ? { staggerDirection } : {}),
  });
}

// ─── Choreography beats ──────────────────────────────────────────────────────
// Cross-component timing: numbers that coordinate elements owned by different
// files live here, so retuning a whole sequence is a one-screen edit.

// The "thinking beat": once the answered card has left and the blob has enlarged
// + recentered, hold the empty centered blob this long before winding up the
// next question (a setTimeout in Quiz, hence milliseconds + slowMs).
export const THINK_DWELL_MS = slowMs(350);

// The staged result reveal, beat by beat:
//   1. the blob springs to full size on POP (owned by Blob);
//   2. the "?" clears on EXIT and the species glyph pops in — same POP overshoot,
//      held back by a delay so it lands as its own beat ~0.4s after the step
//      change (the glyph mounts only after the "?" finishes exiting, so its
//      delay is measured from there: EXIT_SECONDS + 0.18 ≈ 0.4);
//   3. the card cascade walks down — kicker, name, tagline, body, traits,
//      retake — landing the whole sequence around the 2s mark.
export const GLYPH_POP: Transition = slow({ ...POP_SPRING, delay: 0.18 });
export const REVEAL_CASCADE: Transition = stagger(EXIT_SECONDS + 0.18 + 0.15, 0.11);

// ─── Ambient ─────────────────────────────────────────────────────────────────
// The blob's idle breathing loop. Lives on an inner layer in Blob so the
// infinite loop never fights the step-driven size/position springs.
export const BREATHE = {
  animate: { scale: [1, 1.045, 1] },
  transition: slow({ duration: 2.4, ease: 'easeInOut', repeat: Infinity }),
};
