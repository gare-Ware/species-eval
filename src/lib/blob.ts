// ─────────────────────────────────────────────────────────────────────────────
// Energy-ball shape engine — pure math, no DOM. Blob.tsx drives this once per
// frame and writes the returned path into an <svg>. The shape is a sphere of
// radius 1 (unit space), read as energy rather than goo:
//
//   waves    — fast, shallow shimmer around the perimeter (energy = high
//              frequency / low amplitude; goo = slow and deep — tune that way)
//   breathe  — the whole-ball pulse (the dominant idle read)
//   sag      — a light resting bottom bulge, so the ball still has weight
//   velocity — the ball moves FROM ITS CENTER: the shell shifts a touch behind
//              the true center (lag) and a focused wake trails it (tail). The
//              leading edge stays spherical — there is deliberately no
//              symmetric stretch term, which is what read as "oval goo".
//
// Every number that changes what you see lives in BLOB below. Set
// BLOB.alive = false to revert to the plain filled circle (Blob.tsx renders
// a plain bg-accent disc and skips the frame loop entirely).
// ─────────────────────────────────────────────────────────────────────────────

export interface BlobWave {
  /** How many crests around the perimeter. */
  lobes: number;
  /** Crest height as a fraction of the radius. */
  amp: number;
  /** Travel speed in radians/second (negative = counter-rotating). */
  speed: number;
  /** Starting offset so the waves don't align at t=0. */
  phase: number;
}

export const BLOB = {
  /** Master switch: false = plain circle, no rAF loop. */
  alive: true,

  /** Perimeter samples. More = smoother, slower. 24–40 is the useful range. */
  points: 28,

  /**
   * Surface shimmer. Energy character lives in the speed:amp ratio — fast and
   * shallow crackles like a contained field; slow it down and deepen it and
   * the same math turns back into goo. Keep total amp under ~0.035.
   */
  waves: [
    { lobes: 5, amp: 0.013, speed: 2.2, phase: 0.0 },
    { lobes: 7, amp: 0.008, speed: -3.4, phase: 2.1 },
    { lobes: 9, amp: 0.005, speed: 4.8, phase: 4.4 },
  ] as BlobWave[],

  /** Whole-ball pulse: radius swings ±amp over period seconds — the idle heartbeat. */
  breathe: { amp: 0.032, period: 2.8 },

  /** Resting weight: a light bottom bulge so the sphere still sits in gravity. */
  sag: 0.03,

  /**
   * Center-of-gravity lag, per px/s of travel: the whole shell shifts this far
   * BEHIND the button's true center, so motion visibly originates at the core
   * and the front edge never leads. maxLag (fraction of radius) is a SOFT cap
   * (see soften()), approached asymptotically. Tuning constraint: keep the
   * slope shallow enough that saturation lands near PEAK glide speed
   * (~2000–3500 px/s). If the cap engages far below that, the shape rides
   * every glide pinned at max and releases it all in the last few frames as
   * the tracker rings through zero — a visible snap right at settle.
   */
  lag: 1 / 20000,
  maxLag: 0.07,

  /** Trailing wake per px/s, soft-capped by maxDrag; tailShape focuses it (higher = narrower tail). */
  drag: 1 / 16000,
  maxDrag: 0.09,
  tailShape: 3,

  /**
   * Deformation spring: the shape chases velocity as an underdamped spring.
   * response = natural frequency in rad/s (higher = snaps back to spherical
   * sooner); springDamping = damping ratio (<1 overshoots once — the mass
   * sloshes forward as the blob stops, then rings down; 1 = no overshoot).
   */
  response: 24,
  springDamping: 0.55,
};

export type BlobConfig = typeof BLOB;

/** Velocity-derived deformation for one frame (already smoothed by the caller). */
export interface BlobDeform {
  /** Shell offset behind the center along `dir`, soft-capped by maxLag. */
  lag: number;
  /** Trailing wake, soft-capped by maxDrag. */
  drag: number;
  /** Direction of travel in radians (SVG space: +y is down). */
  dir: number;
}

export const BLOB_AT_REST: BlobDeform = { lag: 0, drag: 0, dir: 0 };

/**
 * Soft saturation for the velocity deforms: identity slope at 0 (so lag/drag
 * keep their per-px/s meaning at low speed), asymptotic to `max` — the deform
 * never sits pinned on a hard clamp only to release with a corner when the
 * glide ends. Monotone, smooth, always < max.
 */
export function soften(raw: number, max: number): number {
  return max * Math.tanh(raw / max);
}

/** Perimeter points at time t (seconds), in unit space (rest radius 1). */
export function blobPoints(t: number, deform: BlobDeform, cfg: BlobConfig = BLOB): [number, number][] {
  const breathe = cfg.breathe.amp * Math.sin((2 * Math.PI * t) / cfg.breathe.period);
  const lag = soften(deform.lag, cfg.maxLag);
  const drag = soften(deform.drag, cfg.maxDrag);
  const ux = Math.cos(deform.dir);
  const uy = Math.sin(deform.dir);

  const pts: [number, number][] = [];
  for (let i = 0; i < cfg.points; i++) {
    const theta = (i / cfg.points) * 2 * Math.PI;
    let r = 1 + breathe;
    for (const w of cfg.waves) r += w.amp * Math.sin(w.lobes * theta + w.speed * t + w.phase);

    // Gravity: bulge concentrated at the bottom (+y in SVG space), with a
    // small global shrink so the sag reads as mass shifting, not growing.
    const down = Math.max(0, Math.sin(theta));
    r += cfg.sag * (down * down - 0.35);

    // Trailing wake: extra radius focused on the side facing away from travel
    // (tailShape sharpens the falloff so it reads as a wake, not a bulge).
    const trail = Math.max(0, -(Math.cos(theta) * ux + Math.sin(theta) * uy));
    r += drag * trail ** cfg.tailShape;

    // The sphere stays a sphere; the whole shell just sits `lag` behind the
    // true center, so the core visibly leads and the shell follows.
    pts.push([r * Math.cos(theta) - lag * ux, r * Math.sin(theta) - lag * uy]);
  }
  return pts;
}

/** Closed smooth path through the points (Catmull-Rom → cubic Béziers). */
export function toPath(pts: [number, number][]): string {
  const n = pts.length;
  const f = (v: number) => v.toFixed(4);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + " Z";
}

/** One-call frame shape: path string for time t under the given deformation. */
export function blobPath(t: number, deform: BlobDeform = BLOB_AT_REST, cfg: BlobConfig = BLOB): string {
  return toPath(blobPoints(t, deform, cfg));
}
