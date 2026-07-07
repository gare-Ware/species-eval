// ─────────────────────────────────────────────────────────────────────────────
// Living-blob shape engine — pure math, no DOM. Blob.tsx drives this once per
// frame and writes the returned path into an <svg>. The shape is a circle of
// radius 1 (unit space) deformed by four ingredients:
//
//   waves    — layered traveling ripples around the perimeter (the "energy
//              held in by force" look; incommensurate speeds so it never loops)
//   breathe  — a slow whole-ball pulse (replaces the old BREATHE scale token)
//   sag      — a resting bottom-heavy bulge, so the ball reads as having weight
//   velocity — squash/stretch along the direction of travel plus a trailing
//              bulge, so the mass visibly lags and settles when the blob glides
//
// Every number that changes what you see lives in BLOB below. Set
// BLOB.alive = false to revert to the plain filled circle (Blob.tsx renders
// the old bg-accent disc and skips the frame loop entirely).
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

  /** Surface ripples. Keep total amp under ~0.04 so idle stays visibly circular. */
  waves: [
    { lobes: 3, amp: 0.014, speed: 0.9, phase: 0.0 },
    { lobes: 5, amp: 0.009, speed: -1.5, phase: 2.1 },
    { lobes: 7, amp: 0.006, speed: 2.3, phase: 4.4 },
  ] as BlobWave[],

  /** Whole-ball pulse: radius swings ±amp over period seconds. */
  breathe: { amp: 0.028, period: 3.4 },

  /** Resting weight: extra radius at the bottom (gravity's fingerprint). */
  sag: 0.045,

  /** Squash/stretch per px/s of travel (elongates along the motion vector). */
  stretch: 1 / 3200,

  /** Trailing bulge per px/s (the mass that lags behind the direction of travel). */
  drag: 1 / 2000,

  /**
   * Separate caps (fractions of radius) keep the travel shape "a circle with
   * sagging mass": stretch is pinned low so the ball never goes oval, while
   * the trailing bulge is allowed roughly twice as much.
   */
  maxStretch: 0.055,
  maxDrag: 0.1,

  /**
   * Deformation spring: the shape chases velocity as an underdamped spring.
   * response = natural frequency in rad/s (higher = snaps back to circular
   * sooner); springDamping = damping ratio (<1 overshoots once — the mass
   * sloshes forward as the blob stops, then rings down; 1 = no overshoot).
   */
  response: 20,
  springDamping: 0.6,
};

export type BlobConfig = typeof BLOB;

/** Velocity-derived deformation for one frame (already smoothed by the caller). */
export interface BlobDeform {
  /** Elongation along `dir`, clamped to maxStretch. */
  stretch: number;
  /** Trailing-side bulge, clamped to maxDrag. */
  drag: number;
  /** Direction of travel in radians (SVG space: +y is down). */
  dir: number;
}

export const BLOB_AT_REST: BlobDeform = { stretch: 0, drag: 0, dir: 0 };

/** Perimeter points at time t (seconds), in unit space (rest radius 1). */
export function blobPoints(t: number, deform: BlobDeform, cfg: BlobConfig = BLOB): [number, number][] {
  const breathe = cfg.breathe.amp * Math.sin((2 * Math.PI * t) / cfg.breathe.period);
  const stretch = Math.min(deform.stretch, cfg.maxStretch);
  const drag = Math.min(deform.drag, cfg.maxDrag);
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

    // Mass lag: extra radius on the side facing away from the travel direction.
    const trail = Math.max(0, -(Math.cos(theta) * ux + Math.sin(theta) * uy));
    r += drag * trail * trail;

    // Squash & stretch: elongate along the travel axis, thin the perpendicular
    // by the inverse so the area (the "energy") stays roughly conserved.
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const par = (x * ux + y * uy) * (1 + stretch);
    const perp = (-x * uy + y * ux) / (1 + stretch);
    pts.push([par * ux - perp * uy, par * uy + perp * ux]);
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
