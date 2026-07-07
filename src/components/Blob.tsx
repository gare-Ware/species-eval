'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Species } from '@/data/species';
import type { Step } from '@/lib/flow';
import { EXIT, GLIDE, GLYPH_POP, POP, PRESS_HERO, REDUCED_FADE } from '@/lib/motion';
import { BLOB, blobPath } from '@/lib/blob';
import { SLOWMO } from '@/lib/slowmo';
import { SpeciesGlyph } from './SpeciesGlyph';

interface BlobProps {
  step: Step;
  /** The winning species — only set during the result step. */
  species: Species | null;
  onBegin: () => void;
}

// The one persistent element: never unmounts, only changes size (animate) and
// position (layout) — the continuity that makes the flow read as one scene.
// 'thinking' is the enlarged between-question size.
const SIZE: Record<Step, number> = { start: 152, quiz: 64, thinking: 120, result: 168 };

// The wobbling perimeter needs room beyond the nominal circle: the SVG box is
// 150% of the button, and the viewBox reserves the same 1.5× in unit space.
// Worst case from lib/blob.ts: 1 + waves + breathe + sag + maxDrag + maxLag
// ≈ 1.24 — blob.test.ts pins the shape inside this box.
const OVERDRAW = 1.5;

// SSR/initial shape (t=0, at rest) — the frame loop takes over on mount.
const REST_PATH = blobPath(0);

export function Blob({ step, species, onBegin }: BlobProps) {
  const prefersReducedMotion = useReducedMotion();
  const interactive = step === 'start';
  const alive = BLOB.alive && !prefersReducedMotion;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

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
        path.setAttribute(
          'd',
          blobPath(t, {
            lag: speed * BLOB.lag,
            drag: speed * BLOB.drag,
            dir: speed > 1 ? Math.atan2(sy, sx) : 0,
          }),
        );
      }
      cx = x;
      cy = y;
      last = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [alive]);

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
      animate={{ width: SIZE[step], height: SIZE[step] }}
      // Size: the result rides POP (the reveal bounce); everything else the calm
      // GLIDE. Position: pinned to the shared GLIDE so blob and chrome travel on
      // one spring.
      transition={{
        ...(step === 'result' ? POP : GLIDE),
        layout: GLIDE,
      }}
      whileHover={interactive && !prefersReducedMotion ? PRESS_HERO.whileHover : undefined}
      whileTap={interactive && !prefersReducedMotion ? PRESS_HERO.whileTap : undefined}
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
          className="pointer-events-none absolute h-[150%] w-[150%]"
          style={{ left: '-25%', top: '-25%' }}
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
