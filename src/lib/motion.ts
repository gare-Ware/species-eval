import type { Transition, Variants } from 'motion/react';
import { BLOB } from './blob';
import { slow, slowMs } from './slowmo';

// ─────────────────────────────────────────────────────────────────────────────
// Motion identity — the app's entire vocabulary: named springs, interaction
// affordances, enter/exit variants, and cross-component choreography beats.
// Components use these tokens; raw { stiffness, damping } literals live only here.
//
// Personality: "premium with a little life" — calm, decisive springs, with
// overshoot rationed by moment: a small burst where the blob swallows the
// answer (BURST), the big one (POP) reserved for the result reveal.
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
//   PRESS_HERO — the blob: the primary invitation, so a touch more. Sized to
//                outrank the blob's ambient surprise pulse (BLOB.pulse peaks
//                ~+4.5%): pointer feedback must stay the loudest scale cue.
//   PRESS_ROW  — full-width rows: scaling a wide element reads as jumpy, so
//                hover stays a CSS color shift and only the tap dips
export const PRESS = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } as const;
export const PRESS_HERO = { whileHover: { scale: 1.08 }, whileTap: { scale: 0.94 } } as const;
export const PRESS_ROW = { whileTap: { scale: 0.99 } } as const;

// Thinking-beat burst: the blob "swallows" the answer in one continuous
// gesture. The SIZE channel grows quiz→thinking on the shared GLIDE spring
// *during* the descent (travel and growth are one motion, same curve as the
// position spring, so they can never desync), then the ball flexes at the
// bottom: a uniform scale burst past the thinking size paired with one hop
// on the y channel — peak together, land together, one gesture. The shrink
// back to quiz size isn't staged here at all: it rides the next step change,
// deflating DURING the ascent. Grow-on-the-way-down, burst, shrink-on-the-
// way-up — no channel ever waits for another, which is what makes the beat
// read as fluid instead of staged.
//
// (The old squash-and-stretch gulp staged size/squash/hop serially at the
// bottom — measured rationale in git history. The burst replaces it: uniform
// scale can't cancel the shape engine's travel sag the way an axis squash
// did, so it no longer needs to be sequenced around the flight.)
//
// The hop still floats rather than lands: easeOut to a hanging apex, easeInOut
// back down to ~zero arrival velocity. No ballistic drop — ground contact
// would hand the velocity-reactive shape engine an impact to squash against.
export const BURST_DELAY = 0.42; // fires at touchdown: the GLIDE descent settles ~0.4s in
const BURST_SECONDS = 0.32;
const BURST_BUFFER = 0.04; // one breath after the landing before the wind-up
export const BURST_KEYFRAMES: { scale: number[]; y: number[] } = {
  scale: [1, 1.16, 1],
  y: [0, -14, 0],
};
export const BURST: Transition = slow({
  delay: BURST_DELAY,
  duration: BURST_SECONDS,
  times: [0, 0.45, 1],
  ease: ['easeOut', 'easeInOut'],
});

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

// ─── Type voice ──────────────────────────────────────────────────────────────
// Variable-weight entrance for the display face (Fraunces' wght axis): display
// type starts at INK_FROM and "inks in" to the resting --display-weight as it
// lands. INK settles just after the position spring — that late channel is the
// follow-through that reads as elasticity. On the SVG headline, textLength
// re-justifies every frame, so the lighter start also reads as the line
// tightening into the measure. Damping keeps overshoot under a weight unit:
// the axis clamps at 900, and a real overshoot would flat-line there mid-ring.
// Content voice only — never animate the mono label weight.
export const INK_FROM = 560;
export const INK: Transition = slow({ type: 'spring', stiffness: 120, damping: 20 });

// Resting display weight, read from the --display-weight token so the CSS knob
// stays the single source of truth. SSR/first paint falls back to the authored
// default (keep in sync with globals.css).
let displayWeightCache: number | undefined;
export function displayWeight(): number {
  if (typeof window === 'undefined') return 900;
  displayWeightCache ??=
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--display-weight')) ||
    900;
  return displayWeightCache;
}

// ─── Choreography beats ──────────────────────────────────────────────────────
// Cross-component timing, kept together so retuning a sequence is a one-screen edit.

// Confirm hold: how long the picked answer stays on screen before the card's
// exit begins (QuestionCard defers onAnswer by this).
export const CONFIRM_HOLD_MS = slowMs(500);
export const REDUCED_CONFIRM_HOLD_MS = 150;

// Thinking beat: hold on the enlarged centered blob just long enough for the
// burst+hop to land before the next step winds up (a setTimeout in Quiz, hence
// ms). The burst clocks run from the step change but the timer starts at the
// card's exit-complete (~EXIT_SECONDS later), so the exit is subtracted here.
// BURST_BUFFER is the one breath between the landing and the wind-up; the
// shrink itself belongs to the next step's ascent, not to this dwell.
export const THINK_DWELL_MS = slowMs(
  (BURST_DELAY + BURST_SECONDS + BURST_BUFFER - EXIT_SECONDS) * 1000,
);
export const REDUCED_THINK_DWELL_MS = 0;

// Final thinking beat: no fixed dwell — the blob charges (BLOB.charge: flare
// storm + sin² swell cycles) while the narrative call is in flight, and the
// reveal is QUANTIZED to a swell-cycle boundary so the charge always finishes
// the surge it started, no matter when the fetch settles. Both clocks anchor
// at the ball's touchdown: the charge cycles start there (BURST_DELAY after
// the step change), and Quiz's timer starts at the card's exit-complete
// (EXIT_SECONDS after the same step change) — hence the subtraction. The
// reveal fires at INTRO + k × CYCLE for the smallest k ≥ 1 not yet passed:
// at least one full surge, and always released from the trough, where the
// swell is silent and flat (any residual churn decays through the pop).
export const FINAL_BEAT_INTRO_MS = slowMs((BURST_DELAY - EXIT_SECONDS) * 1000);
export const CHARGE_CYCLE_MS = slowMs(BLOB.charge.period * 1000);

// Result reveal timeline, budgeted to land inside ~1.5s (arrival moments buy
// theater, but the whole load choreography stays under the guardrail): the
// blob pops to size (POP, in Blob) → the "?" clears on EXIT and the glyph pops
// in ~0.4s after the step change (GLYPH_POP's delay runs from glyph mount,
// i.e. after the "?" exit) → the card cascade starts walking down the moment
// the glyph launches (concurrent, not serialized) — six items × 0.08s stagger
// puts the last one in flight at ~0.8s and settled (SETTLE) by ~1.2s.
export const GLYPH_POP: Transition = slow({ ...POP_SPRING, delay: 0.18 });
export const REVEAL_CASCADE: Transition = stagger(EXIT_SECONDS + 0.18, 0.08);

// ─── Ambient ─────────────────────────────────────────────────────────────────
// The blob's idle life (breathing pulse, surface waves, weight + velocity
// physics) lives in lib/blob.ts — it runs on its own rAF loop off the React
// render cycle, so it never fights the step-driven size/position springs.
