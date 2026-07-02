import type { Transition, Variants } from 'motion/react';
import { slow } from './slowmo';

// ─────────────────────────────────────────────────────────────────────────────
// Motion identity
//
// The app's whole motion vocabulary lives here so components pull from a shared
// set of named springs instead of scattering raw { stiffness, damping } literals.
// Personality: "premium with a little life" — mostly calm, decisive springs, with
// exactly one springy overshoot (POP) reserved for the result reveal.
//
// Every token is pre-scaled through slow() once at import, so the dev slow-mo
// toggle (slowmo.ts) stretches the entire app in time without any component
// having to touch slow() itself.
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
export const POP: Transition = slow({ type: 'spring', stiffness: 380, damping: 18 });

// A quick accelerating fade for exits. Exits are shorter than entrances (users
// care about what appears, not what leaves), and an ease-in "gets out of the way".
export const EXIT: Transition = slow({ duration: 0.22, ease: [0.3, 0, 1, 1] });

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

// ─── Enter / exit ────────────────────────────────────────────────────────────
// The restrained content-swap vocabulary: a short offset + fade, NOT a full-screen
// glide. Distance stays well under the "no motion travels more than ~1/3 of the
// screen" ceiling, so a transition reads as "content arrived" rather than "scenery
// slid past". `from` is the side an element enters from and exits back toward:
//   'above' → top chrome (headline): settles down in, drifts up out
//   'below' → bottom chrome + cards: rises in, sinks out
const OFFSET = 24;

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
