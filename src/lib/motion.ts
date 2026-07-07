import type { Transition, Variants } from 'motion/react';
import { slow, slowMs } from './slowmo';

// ─────────────────────────────────────────────────────────────────────────────
// Motion identity — the app's entire vocabulary: named springs, interaction
// affordances, enter/exit variants, and cross-component choreography beats.
// Components use these tokens; raw { stiffness, damping } literals live only here.
//
// Personality: "premium with a little life" — calm, decisive springs, with
// overshoot rationed by moment: a small bounce where the blob swallows
// (GULP_SIZE), the big one (POP) reserved for the result reveal.
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

// Thinking-beat gulp: the blob "swallows" the answer as it enlarges into the
// thinking size. A fast vertical squash (anticipation) releases into the size
// swell plus a stretch overshoot (follow-through). Keyframes, not a spring:
// squash → stretch → settle needs three stations inside ~¼s. Axis-asymmetric
// on purpose — a gulp is vertical — but transient, so it reads as character,
// not goo (the shape engine deliberately never holds an oval).
//
// STAGING (measured, not guessed): the step change also sends the ball on a
// ~250px layout glide as the answered card leaves, touching down ~230–250ms
// in. Playing the gulp at the step change renders fine but reads as nothing —
// travel + 88% growth drown a ±10% scale wiggle. Worse (measured via per-frame
// path traces): a squash that overlaps the flight CANCELS the shape engine's
// travel sag — scaleY 0.87 against a ~1.15-tall trailing stretch nets out to
// ~1.0, so the ball just looks inert mid-glide. So the flight belongs to the
// sag alone, the squash BOTTOMS at touchdown (delay + 75ms ≈ the ~250ms
// settle) — stretch-in-flight releasing into squash-on-landing is the
// contrast that makes both read — and only then does the swell start. One
// voice at a time: travel (sag) → squash → swell.
export const GULP_DELAY = 0.18;
const GULP_GROW_DELAY = GULP_DELAY + 0.07;
const GULP_SWELL_SECONDS = 0.18; // clean grow to thinking size, no size overshoot
const GULP_HOP_DELAY = GULP_GROW_DELAY + GULP_SWELL_SECONDS; // hop launches as the swell lands
const GULP_HOP_RISE_SECONDS = 0.14;
const GULP_HOP_FALL_SECONDS = 0.18;
const GULP_HOP_SECONDS = GULP_HOP_RISE_SECONDS + GULP_HOP_FALL_SECONDS;
const GULP_SHRINK_SECONDS = 0.17;
// The shrink starts this far before the hop's descent finishes, so the float
// down melts into the deflate with no rest at the bottom.
const GULP_SHRINK_OVERLAP = 0.09;
const GULP_SHRINK_DELAY = GULP_HOP_DELAY + GULP_HOP_SECONDS - GULP_SHRINK_OVERLAP;
// The size track: swell → hold (under the hop) → shrink, ending the beat.
const GULP_RETURN_SECONDS = GULP_SHRINK_DELAY - GULP_GROW_DELAY + GULP_SHRINK_SECONDS;
const GULP_RETURN_BUFFER = 0.04;
export const GULP_KEYFRAMES: { scaleX: number[]; scaleY: number[] } = {
  scaleX: [1, 1.07, 0.97, 1],
  scaleY: [1, 0.87, 1.06, 1],
};
export const GULP: Transition = slow({
  delay: GULP_DELAY,
  duration: 0.25,
  times: [0, 0.3, 0.65, 1],
  ease: ['easeOut', 'easeInOut', 'easeOut'],
});
// The thinking-size enlargement, held back until the squash bottoms out
// (GULP's first station lands at delay + 0.3 × duration ≈ delay + 75ms).
// Deliberately underdamped: the ball springs up to size and lands with one
// small life-like bounce (~12% overshoot ≈ 7px at thinking size). POP's
// little sibling — same stiffness family, more damping, so the result reveal
// keeps the biggest bounce in the app.
export const GULP_SIZE: Transition = slow({
  type: 'spring',
  stiffness: 380,
  damping: 22,
  delay: GULP_GROW_DELAY,
});
// Between questions, the blob finishes its thought before the next card enters,
// and the springy bounce is POSITION, not size. During the thinking beat the
// ball is the only thing in the vertically centered column, so a size wiggle
// moves both edges symmetrically around a pinned center — a stationary throb
// that reads as stutter, not a bounce (measured: center held within 0.3px while
// the edges fluttered ±6px). So each channel speaks once: the size swells clean
// to the thinking size, holds while the ball HOPS (y keyframes below — the
// whole ball rises and floats back down), then shrinks back to the quiz size
// still centered, the deflate overlapping the descent. The next step change is
// position-only, so the glide up chains straight off the return.
export function gulpReturnKeyframes(quizSize: number, thinkingSize: number): number[] {
  return [quizSize, thinkingSize, thinkingSize, quizSize];
}
export const GULP_RETURN_SIZE: Transition = slow({
  delay: GULP_GROW_DELAY,
  duration: GULP_RETURN_SECONDS,
  times: [0, GULP_SWELL_SECONDS / GULP_RETURN_SECONDS, 1 - GULP_SHRINK_SECONDS / GULP_RETURN_SECONDS, 1],
  ease: ['easeOut', 'linear', 'easeInOut'],
});
// The hop floats, it doesn't land: easeOut up to a hanging apex, then an
// easeInOut float back down that arrives at rest with ~zero velocity. No
// ballistic easeIn drop and no rebound — those read as ground contact (and
// hand the velocity-reactive shape engine an impact to squash against, which
// is where the "micro hops on landing" came from). The shrink starts
// GULP_SHRINK_OVERLAP before the descent finishes, so the float melts straight
// into the deflate and the whole beat reads as one continuous glide.
export const GULP_HOP_KEYFRAMES: { y: number[] } = { y: [0, -12, 0] };
export const GULP_HOP: Transition = slow({
  delay: GULP_HOP_DELAY,
  duration: GULP_HOP_SECONDS,
  times: [0, GULP_HOP_RISE_SECONDS / GULP_HOP_SECONDS, 1],
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

// Thinking beat: hold on the empty centered blob between questions long enough
// for the swell → hop → shrink to finish before the next card winds up (a
// setTimeout in Quiz, hence ms). The gulp clocks run from the step change but
// the timer starts at the card's exit-complete (~EXIT_SECONDS later), so the
// exit is subtracted here — without that the ball froze ~300ms at quiz size
// before the glide up. GULP_RETURN_BUFFER is the one breath between the
// landing and the wind-up; raise it to hold the small centered ball longer.
export const THINK_DWELL_MS = slowMs(
  (GULP_GROW_DELAY + GULP_RETURN_SECONDS - EXIT_SECONDS + GULP_RETURN_BUFFER) * 1000,
);
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
