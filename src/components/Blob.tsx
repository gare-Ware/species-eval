'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Species } from '@/data/species';
import type { Step } from '@/lib/flow';
import {
  EXIT,
  GLIDE,
  GLYPH_POP,
  GULP,
  GULP_HOP,
  GULP_HOP_KEYFRAMES,
  GULP_KEYFRAMES,
  GULP_RETURN_SIZE,
  GULP_SIZE,
  gulpReturnKeyframes,
  POP,
  PRESS_HERO,
  REDUCED_FADE,
} from '@/lib/motion';
import { BLOB, blobPath, pulseSwell, type BlobDeform } from '@/lib/blob';
import { SLOWMO } from '@/lib/slowmo';
import { SpeciesGlyph } from './SpeciesGlyph';

interface BlobProps {
  step: Step;
  /** The winning species — only set during the result step. */
  species: Species | null;
  /** Between questions, shrink at center before the next card pulls the blob up. */
  returnToQuizSize?: boolean;
  onBegin: () => void;
}

// The one persistent element: never unmounts, only changes size (animate) and
// position (layout) — the continuity that makes the flow read as one scene.
// 'thinking' is the enlarged between-question size.
const SIZE: Record<Step, number> = { start: 152, quiz: 64, thinking: 120, result: 168 };
// Between-question return stations (swell → hold under the hop → shrink);
// their times/eases live with GULP_RETURN_SIZE in motion.ts so the pairing is
// a one-screen edit.
const THINKING_RETURN_SIZE = gulpReturnKeyframes(SIZE.quiz, SIZE.thinking);

// The wobbling perimeter needs room beyond the nominal circle: the SVG box is
// 200% of the button, and the viewBox reserves the same 2× in unit space.
// Worst case stacks full churn + piled flares + a hard glide: 1 + boosted
// waves + breathe + pulse + sag + flare cap + maxDrag + maxLag ≈ 1.93 —
// blob.test.ts pins the shape inside this box. (The gulp scales the whole
// button, SVG included, so it can't push the shape out.)
const OVERDRAW = 2;

// SSR/initial shape (t=0, at rest) — the frame loop takes over on mount.
const REST_PATH = blobPath(0);

const within = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

export function Blob({ step, species, returnToQuizSize = false, onBegin }: BlobProps) {
  const prefersReducedMotion = useReducedMotion();
  const interactive = step === 'start';
  const alive = BLOB.alive && !prefersReducedMotion;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Mirrors for the frame loop (it mounts once and must read current state):
  // the surprise pulse only fires on the idle start screen, never while the
  // pointer is engaged — hover/press feedback must stay the loudest scale cue.
  const stepRef = useRef(step);
  const engagedRef = useRef(false);
  useEffect(() => {
    stepRef.current = step;
    // The button disables off the start screen, so a hover that rides into
    // `begin` never gets its onHoverEnd — clear the flag on every step change.
    engagedRef.current = false;
  }, [step]);

  // The life loop: advance the surface waves and read the button's real
  // on-screen center each frame — Motion's springs move it, we just measure —
  // so velocity (and therefore squash/stretch + mass lag) reflects the actual
  // glide, hover lift, and press dip. Direct setAttribute writes; no re-renders.
  useEffect(() => {
    if (!alive) return;
    const el = buttonRef.current;
    const path = pathRef.current;
    if (!el || !path) return;

    let raf = 0;
    let last: number | undefined;
    let cx = 0;
    let cy = 0;
    let sx = 0; // spring-tracked velocity (what the shape actually follows)
    let sy = 0;
    let jx = 0; // the tracker's own rate of change
    let jy = 0;
    let t = Math.random() * 100; // desync the waves across mounts
    // Surprise-pulse schedule (t-space, so it stretches with slow-mo). The
    // engine's pulseSwell is pure; the randomness lives only here.
    let pulseAt = -Infinity;
    let nextPulseAt = t + within(BLOB.pulse.firstGap);
    // Escape-attempt schedule + churn (engine math is pure; randomness and
    // accumulation live only here, like the pulse).
    const flares: { dir: number; width: number; amp: number; at: number }[] = [];
    let nextFlareAt = t + within(BLOB.flare.gap);
    let agitation = 0;
    let prevSpeed = 0;

    const tick = (now: number) => {
      const rect = el.getBoundingClientRect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;

      if (last !== undefined) {
        // The slow()/slowMs wrappers can't wrap a continuous clock, so this is
        // the one place that reads SLOWMO directly: waves and follow-through
        // stretch with the toggle, and measured speed (already slowed by the
        // scaled springs) is compensated so the deformation looks identical.
        const dt = Math.min((now - last) / 1000, 0.1) / SLOWMO; // clamp tab-switch gaps
        t += dt;
        // The deformation chases the measured velocity as an underdamped
        // spring (BLOB.response/springDamping): it snaps toward the travel
        // shape, overshoots once as the blob stops — the mass sloshing
        // forward — and rings back to circular. Substepped so the stiff
        // spring stays stable across slow frames.
        const tx = (x - cx) / Math.max(dt, 1e-6);
        const ty = (y - cy) / Math.max(dt, 1e-6);
        const w = BLOB.response;
        const zw2 = 2 * BLOB.springDamping * w;
        for (let rem = dt; rem > 0; rem -= 0.008) {
          const h = Math.min(rem, 0.008);
          jx += (w * w * (tx - sx) - zw2 * jx) * h;
          jy += (w * w * (ty - sy) - zw2 * jy) * h;
          sx += jx * h;
          sy += jy * h;
        }
        const speed = Math.hypot(sx, sy);

        // Fire a pulse when its window opens and the ball is idle on the start
        // screen; otherwise push the window back and try again later. A ring
        // in flight just keeps ringing across a step change — it's spent in
        // under a second and the continuity reads better than a cut.
        if (t >= nextPulseAt) {
          if (stepRef.current === 'start' && !engagedRef.current) {
            pulseAt = t;
            nextPulseAt = t + within(BLOB.pulse.gap);
          } else {
            nextPulseAt = t + within(BLOB.pulse.firstGap);
          }
        }

        // Churn: shoves charge it, tau rings it down. Arrival from a glide is
        // the big shove — the surface roils as the ball regroups, then settles.
        agitation = Math.min(
          1,
          agitation * Math.exp(-dt / BLOB.agitation.tau) +
            Math.abs(speed - prevSpeed) * BLOB.agitation.gain,
        );
        prevSpeed = speed;

        // Escape attempts fire on every step — they're the ball's substance,
        // not a UI cue, so no idle gate (contrast the pulse above, which
        // competes with pointer scale feedback). Churn shortens the gap: the
        // energy fights hardest right after being dragged around.
        if (t >= nextFlareAt) {
          flares.push({
            dir: Math.random() * 2 * Math.PI,
            width: within(BLOB.flare.width),
            amp: within(BLOB.flare.amp),
            at: t,
          });
          nextFlareAt = t + within(BLOB.flare.gap) * (1 - BLOB.agitation.flareRate * agitation);
        }
        while (flares.length && (t - flares[0].at) * BLOB.flare.decay > 8) flares.shift();

        // dir needs no low-speed gate: soften() in lib/blob.ts scales the
        // deform smoothly to zero, so where the direction gets noisy (the
        // tracker ringing through zero at settle) it has no amplitude to show.
        const deform: BlobDeform = {
          lag: speed * BLOB.lag,
          drag: speed * BLOB.drag,
          dir: Math.atan2(sy, sx),
          swell: pulseSwell(t - pulseAt),
          agitation,
          flares: flares.map((f) => ({ dir: f.dir, width: f.width, amp: f.amp, elapsed: t - f.at })),
        };
        path.setAttribute('d', blobPath(t, deform));
      }
      cx = x;
      cy = y;
      last = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [alive]);

  // The thinking-beat gulp: squash-and-stretch keyframes on the scale channels.
  // Between questions, the size runs a centered swell→hold→shrink while the
  // ball hops on the y channel (the "bounce" is position — rationale in
  // motion.ts), so the next quiz step is position-only; on the final answer,
  // the blob stays large and hands off to the result pop. Off the thinking
  // step every channel pins back to rest (scale 1, y 0), so an interrupted
  // gulp can never strand the ball squashed or lifted.
  const gulping = step === 'thinking' && !prefersReducedMotion;
  const returning = gulping && returnToQuizSize;

  return (
    <motion.button
      ref={buttonRef}
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
      animate={{
        width: returning ? THINKING_RETURN_SIZE : SIZE[step],
        height: returning ? THINKING_RETURN_SIZE : SIZE[step],
        y: returning ? GULP_HOP_KEYFRAMES.y : 0,
        ...(gulping ? GULP_KEYFRAMES : { scaleX: 1, scaleY: 1 }),
      }}
      // Size: the result rides POP (the reveal bounce); everything else the calm
      // GLIDE. Position: pinned to the shared GLIDE so blob and chrome travel on
      // one spring.
      transition={{
        ...(step === 'result' ? POP : GLIDE),
        layout: GLIDE,
        ...(gulping
          ? {
              scaleX: GULP,
              scaleY: GULP,
              width: returning ? GULP_RETURN_SIZE : GULP_SIZE,
              height: returning ? GULP_RETURN_SIZE : GULP_SIZE,
              ...(returning ? { y: GULP_HOP } : {}),
            }
          : {}),
      }}
      whileHover={interactive && !prefersReducedMotion ? PRESS_HERO.whileHover : undefined}
      whileTap={interactive && !prefersReducedMotion ? PRESS_HERO.whileTap : undefined}
      // Engagement flags for the surprise pulse (see the stepRef effect above).
      onHoverStart={() => (engagedRef.current = true)}
      onHoverEnd={() => (engagedRef.current = false)}
      onTapStart={() => (engagedRef.current = true)}
      onTapCancel={() => (engagedRef.current = false)}
      className={`relative shrink-0 rounded-full @container-size enabled:cursor-pointer ${
        alive ? '' : 'bg-accent transition-colors duration-(--theme-fade)'
      }`}
    >
      {/* The energy ball: a unit circle deformed per-frame by lib/blob.ts.
          Fallback (reduced motion or BLOB.alive=false) is the button's own
          bg-accent disc above. */}
      {alive && (
        <svg
          aria-hidden
          viewBox={`${-OVERDRAW} ${-OVERDRAW} ${2 * OVERDRAW} ${2 * OVERDRAW}`}
          className="pointer-events-none absolute h-[200%] w-[200%]"
          style={{ left: '-50%', top: '-50%' }}
        >
          <path
            ref={pathRef}
            d={REST_PATH}
            className="fill-accent transition-[fill] duration-(--theme-fade)"
          />
        </svg>
      )}

      <span className="absolute inset-0 grid place-items-center">
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
      </span>
    </motion.button>
  );
}
