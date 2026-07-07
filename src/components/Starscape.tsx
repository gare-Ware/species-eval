'use client';

import { useEffect, useRef } from 'react';

// Fixed full-viewport star field behind the quiz, drawn on ONE canvas.
//
// Why canvas and not per-star DOM: at hundreds of stars, each animated <span>
// is its own composited layer, and the species theme takeover used to kick
// off a background-color transition on every one of them at once — hundreds
// of per-frame repaints for the length of --theme-fade, landing exactly on
// the result/retake blob glides (the only steps that recolor the theme) and
// dropping their frames. One canvas is one layer and one paint per frame at
// any star count.
//
// The species tint still rides CSS: the canvas element's own `color` is
// var(--foreground) with the --theme-fade transition, and the draw loop
// samples the computed value each frame — so the sky cross-fades on the same
// token as everything else. Star recipes come from a seeded PRNG at module
// scope, so the field is identical across mounts (only drawn client-side; the
// pre-hydration first paint is a bare sky for a beat, which the dark field
// hides).
//
// Motion rationale: stars are fixed relative to each other — per-star wander
// reads as floating particles, not a sky. The one physically honest motion is
// the OBSERVER drifting: the whole field slides in a single shared direction,
// nearer (bigger) stars sliding faster (parallax). Positions wrap at the
// edges, so the drift runs forever.
//
// Tunables:
const STAR_COUNT = 700;
const SIZE_BASE = 1; // px — smallest star
const SIZE_RANGE = 2.4; // px — added via rand², so most stars stay fine
const DRIFT_DEGREES = 195; // shared drift heading (0 = right, 90 = down; we float the opposite way)
const DRIFT_SPEED = 1.5; // px/s for the smallest stars — 0 freezes the sky (twinkle stays)
const DRIFT_SPEED_PER_PX = 2.2; // extra px/s per px of star size (the parallax depth cue)
const TWINKLE_SECONDS: [number, number] = [2.5, 6.5];
const TWINKLE_FLOOR = 0.25; // dimmest point of the twinkle, as a fraction of base opacity
const DPR_CAP = 2; // don't rasterize above 2× on ultra-dense displays

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2026);

const DRIFT_X = Math.cos((DRIFT_DEGREES * Math.PI) / 180);
const DRIFT_Y = Math.sin((DRIFT_DEGREES * Math.PI) / 180);

const STARS = Array.from({ length: STAR_COUNT }, () => {
  const size = SIZE_BASE + rand() * rand() * SIZE_RANGE;
  return {
    x: rand(), // fraction of viewport width
    y: rand(), // fraction of viewport height
    size,
    opacity: 0.14 + rand() * 0.5,
    twinkle: TWINKLE_SECONDS[0] + rand() * (TWINKLE_SECONDS[1] - TWINKLE_SECONDS[0]),
    phase: rand() * 24, // per-star time offset so nothing twinkles in unison
    speed: DRIFT_SPEED + size * DRIFT_SPEED_PER_PX, // shared heading, depth-scaled pace
  };
});

export function Starscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let lastColor = '';
    let settled = false; // reduced-motion: true once the static field is drawn

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      settled = false;
    };
    resize();
    window.addEventListener('resize', resize);
    const unsettle = () => {
      settled = false;
    };
    reduced.addEventListener('change', unsettle);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const still = reduced.matches;
      // The computed color interpolates through the CSS --theme-fade
      // transition on the canvas element itself — the takeover tint for free.
      const color = getComputedStyle(canvas).color;
      if (still && settled && color === lastColor) return;
      lastColor = color;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const t = now / 1000;
      // Wrap with a margin so stars slide fully off one edge before re-entering
      // the opposite one (no popping at the rim).
      const m = SIZE_BASE + SIZE_RANGE;
      const spanW = w + 2 * m;
      const spanH = h + 2 * m;
      for (const s of STARS) {
        const st = still ? 0 : t + s.phase;
        // Twinkle: base → base×FLOOR and back (the old CSS keyframes' shape).
        const twinkle = still
          ? 1
          : (1 + TWINKLE_FLOOR) / 2 + ((1 - TWINKLE_FLOOR) / 2) * Math.cos((2 * Math.PI * st) / s.twinkle);
        // Observer drift: constant shared-heading travel, wrapped torus-style.
        const travel = still ? 0 : st * s.speed;
        const x = (((s.x * spanW + travel * DRIFT_X) % spanW) + spanW) % spanW - m;
        const y = (((s.y * spanH + travel * DRIFT_Y) % spanH) + spanH) % spanH - m;
        ctx.globalAlpha = s.opacity * twinkle;
        ctx.beginPath();
        ctx.arc(x, y, s.size / 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      settled = true;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      reduced.removeEventListener('change', unsettle);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 text-foreground transition-colors duration-(--theme-fade)"
    />
  );
}
