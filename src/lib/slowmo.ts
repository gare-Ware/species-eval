import type { Transition } from 'motion/react';

// Dev-only slow motion for eyeballing transitions. SLOWMO = 1 is OFF (slow() is a
// no-op). Bump it to stretch every wrapped transition in time while preserving its
// shape: springs are scaled so their damping ratio is unchanged (same overshoot /
// settle character, just slower), tweens/delays/staggers are multiplied directly.
//
// Usage: wrap a transition — `transition={slow({ type: 'spring', ... })}` — or a
// raw millisecond beat — `slowMs(350)` — for setTimeout-driven choreography.
// Reset to 1 before committing. The wrappers are harmless at 1, so they can stay.
export const SLOWMO: number = 1; // 1 = real time · 5 ≈ the ~2s slow-mo for analysis

const TIME_KEYS = new Set([
  'duration',
  'delay',
  'delayChildren',
  'staggerChildren',
  'repeatDelay',
]);

function scale(value: unknown, k: number): unknown {
  if (Array.isArray(value)) return value.map((v) => scale(v, k));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      if (typeof v === 'number') {
        // Stretch time by k. For springs, stiffness/k² + damping/k keeps the
        // damping ratio constant, so the curve is identical — just k× slower.
        if (TIME_KEYS.has(key)) out[key] = v * k;
        else if (key === 'stiffness') out[key] = v / (k * k);
        else if (key === 'damping') out[key] = v / k;
        else out[key] = v;
      } else {
        out[key] = scale(v, k); // recurse into nested per-value transitions
      }
    }
    return out;
  }
  return value;
}

export function slow(transition: Transition): Transition {
  return SLOWMO === 1 ? transition : (scale(transition, SLOWMO) as Transition);
}

// For timer-driven beats (setTimeout durations) that live outside a Transition
// object, so choreography held in plain milliseconds stretches with the toggle
// too — no component multiplies by SLOWMO itself.
export function slowMs(ms: number): number {
  return ms * SLOWMO;
}
