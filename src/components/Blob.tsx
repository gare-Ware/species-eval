'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Species } from '@/data/species';
import type { Step } from '@/lib/flow';
import {
  BURST,
  BURST_DELAY,
  BURST_KEYFRAMES,
  EXIT,
  GLIDE,
  GLYPH_POP,
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
  /**
   * The final thinking beat: the narrative call is in flight and the reveal is
   * next. The ball skips the between-question burst+hop and CHARGES instead —
   * the storm in BLOB.charge — while Quiz holds the reveal for a swell-cycle
   * boundary so the surge in progress always completes.
   */
  charging?: boolean;
  onBegin: () => void;
}

// The one persistent element: never unmounts, only changes size (animate) and
// position (layout) — the continuity that makes the flow read as one scene.
// 'thinking' is the enlarged between-question size; 'error' holds that same
// size — the ball that was "thinking" for you, caught mid-thought. quiz is
// sized to the flare legibility floor: at r=44 a typical flare crest renders
// ~2px — the fight stays visible at the size the ball holds longest (the
// 4-option cards freed the vertical room).
const SIZE: Record<Step, number> = { start: 152, quiz: 88, thinking: 124, result: 168, error: 124 };

// The wobbling perimeter needs room beyond the nominal circle: the SVG box is
// 200% of the button, and the viewBox reserves the same 2× in unit space.
// Worst case stacks full churn + piled flares + a hard glide: 1 + boosted
// waves + breathe + pulse + sag + flare cap + maxDrag + maxLag ≈ 1.93 —
// blob.test.ts pins the shape inside this box. (The burst scales the whole
// button, SVG included, so it can't push the shape out.)
const OVERDRAW = 2;

// SSR/initial shape (t=0, at rest) — the frame loop takes over on mount.
const REST_PATH = blobPath(0);

const within = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

export function Blob({ step, species, charging = false, onBegin }: BlobProps) {
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
  const chargingRef = useRef(charging);
  // Pointer-charged churn, consumed by the loop next frame: the energy
  // bristles when a hand approaches the containment (see BLOB.agitation.kick).
  const kickRef = useRef(0);
  useEffect(() => {
    stepRef.current = step;
    chargingRef.current = charging;
    // The button disables off the start screen, so a hover that rides into
    // `begin` never gets its onHoverEnd — clear the flag on every step change.
    engagedRef.current = false;
  }, [step, charging]);

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
    // Final-beat charge clock (t-space): set on the first charging frame,
    // anchored at touchdown so the cycles start where the burst would have.
    let chargeStart: number | undefined;
    let chargeLevel = 0;
    let chargeSwell = 0;

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
        // Pointer kicks (kickRef, charged by the hover/tap handlers below) pour
        // in on top: transient shimmer only, so the sustained hover scale
        // stays the loudest cue.
        agitation = Math.min(
          1,
          agitation * Math.exp(-dt / BLOB.agitation.tau) +
            Math.abs(speed - prevSpeed) * BLOB.agitation.gain +
            kickRef.current,
        );
        kickRef.current = 0;
        prevSpeed = speed;

        // Final-beat charge: from touchdown the storm ramps in. The floor is
        // fed into the real agitation accumulator (not maxed at use), so when
        // the charge ends the churn decays naturally through the reveal pop
        // instead of snapping off. The swell breathes in sin² cycles — silent
        // and flat at every boundary, which is where Quiz cuts to the reveal,
        // so the surge in flight always completes.
        if (chargingRef.current) {
          chargeStart ??= t + BURST_DELAY;
          const into = t - chargeStart;
          // The ramp counts from the step change (into + BURST_DELAY), not
          // touchdown — the violence builds through the descent so the ball
          // lands already storming and the first thump hits on arrival.
          chargeLevel = Math.min(1, Math.max(0, (into + BURST_DELAY) / BLOB.charge.ramp));
          if (into > 0) {
            // Each cycle: a springy THUMP at the start (pulseSwell, spent well
            // before the boundary) into the sin² swell mid-cycle.
            chargeSwell =
              chargeLevel *
              (BLOB.charge.swell *
                Math.sin(Math.PI * ((into / BLOB.charge.period) % 1)) ** 2 +
                BLOB.charge.pulse * pulseSwell(into % BLOB.charge.period));
          } else {
            chargeSwell = 0;
          }
          agitation = Math.max(agitation, chargeLevel * BLOB.charge.agitation);
        } else {
          chargeStart = undefined;
          chargeLevel = 0;
          chargeSwell = 0;
        }

        // Escape attempts fire on every step — they're the ball's substance,
        // not a UI cue, so no idle gate (contrast the pulse above, which
        // competes with pointer scale feedback). Churn shortens the gap: the
        // energy fights hardest right after being dragged around. Direction is
        // biased to where the energy already is: chasing the wake during
        // travel, favoring the crown at rest — the pooled mass at the base
        // doesn't erupt downward (triangular spread around the bias center).
        if (t >= nextFlareAt) {
          const traveling = speed > BLOB.flare.bias.travel;
          const center = traveling ? Math.atan2(-sy, -sx) : -Math.PI / 2;
          const spread = BLOB.flare.bias.spread[traveling ? 0 : 1];
          flares.push({
            dir: center + (Math.random() + Math.random() - 1) * spread,
            width: within(BLOB.flare.width),
            // The charge storm fights bigger, not just more often.
            amp: within(BLOB.flare.amp) * (1 + (BLOB.charge.flareAmp - 1) * chargeLevel),
            at: t,
          });
          nextFlareAt =
            t +
            within(BLOB.flare.gap) *
              (1 - BLOB.agitation.flareRate * agitation) *
              (1 - BLOB.charge.flareGap * chargeLevel);
        }
        while (flares.length && (t - flares[0].at) * BLOB.flare.decay > 8) flares.shift();

        // dir needs no low-speed gate: soften() in lib/blob.ts scales the
        // deform smoothly to zero, so where the direction gets noisy (the
        // tracker ringing through zero at settle) it has no amplitude to show.
        const deform: BlobDeform = {
          lag: speed * BLOB.lag,
          drag: speed * BLOB.drag,
          dir: Math.atan2(sy, sx),
          swell: pulseSwell(t - pulseAt) + chargeSwell,
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

  // The thinking-beat burst: the size channel grows to the thinking size on
  // the shared GLIDE spring *during* the descent (travel and growth are one
  // motion), then BURST flexes the ball past that size — a uniform scale
  // swell paired with the one hop, one gesture at the bottom. The shrink back
  // to quiz size rides the next step change, deflating during the ascent. Off
  // the thinking step every transient channel pins back to rest (scale 1,
  // y 0), so an interrupted beat can never strand the ball swollen or lifted.
  // The FINAL beat skips the burst: the charge storm (frame loop above) owns
  // that dwell, and its swell lives in the shape engine, not the scale channel.
  const bursting = step === 'thinking' && !charging && !prefersReducedMotion;

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
        width: SIZE[step],
        height: SIZE[step],
        ...(bursting ? BURST_KEYFRAMES : { scale: 1, y: 0 }),
      }}
      // Size: the result rides POP (the reveal bounce); everything else the calm
      // GLIDE — including the thinking growth, so size and travel share one
      // spring. Position: pinned to the same GLIDE so blob and chrome never
      // desync. The burst gesture (scale + hop) has its own delayed keyframes.
      transition={{
        ...(step === 'result' ? POP : GLIDE),
        layout: GLIDE,
        ...(bursting ? { scale: BURST, y: BURST } : {}),
      }}
      whileHover={interactive && !prefersReducedMotion ? PRESS_HERO.whileHover : undefined}
      whileTap={interactive && !prefersReducedMotion ? PRESS_HERO.whileTap : undefined}
      // Engagement flags for the surprise pulse, plus the churn kick — the
      // energy bristles at an approaching hand, harder under a press. The kick
      // is shimmer-only and transient, so hover's sustained +8% scale stays
      // the loudest cue (ambient ranks under interactive on both axes).
      onHoverStart={() => {
        engagedRef.current = true;
        kickRef.current += BLOB.agitation.kick.hover;
      }}
      onHoverEnd={() => (engagedRef.current = false)}
      onTapStart={() => {
        engagedRef.current = true;
        kickRef.current += BLOB.agitation.kick.press;
      }}
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
