import { describe, expect, it } from 'vitest';
import { BLOB, BLOB_AT_REST, blobPath, blobPoints, flareSwell, pulseSwell, soften } from './blob';

// The Blob SVG reserves 2× the nominal radius (OVERDRAW in Blob.tsx); the
// shape must stay inside that no matter what the frame loop feeds in.
const OVERDRAW = 2;

// First crest of the flare envelope — the peak of the escape attempt.
const FLARE_CREST = Math.PI / 2 / BLOB.flare.omega;

// Everything at once, stacked adversarially: extreme velocity, the pulse at
// max, full churn, and three max-amp flares piled on one direction (the soft
// cap is what keeps that survivable).
const HARD_DEFORM = {
  lag: 99,
  drag: 99,
  dir: Math.PI / 3,
  swell: BLOB.pulse.amp,
  agitation: 1,
  flares: [0, 1, 2].map(() => ({
    dir: Math.PI / 3,
    width: BLOB.flare.width[1],
    amp: BLOB.flare.amp[1],
    elapsed: FLARE_CREST,
  })),
};

describe('blobPoints', () => {
  it('samples the configured number of perimeter points', () => {
    expect(blobPoints(0, BLOB_AT_REST)).toHaveLength(BLOB.points);
  });

  it('stays near the unit circle at rest', () => {
    for (const t of [0, 1.7, 42.3]) {
      for (const [x, y] of blobPoints(t, BLOB_AT_REST)) {
        const r = Math.hypot(x, y);
        expect(r).toBeGreaterThan(0.8);
        expect(r).toBeLessThan(1.2);
      }
    }
  });

  it('clamps extreme deformation inside the SVG overdraw box', () => {
    for (const t of [0, 1.1, 3.2, 7.9, 12.4, 33.3]) {
      for (const [x, y] of blobPoints(t, HARD_DEFORM)) {
        expect(Math.hypot(x, y)).toBeLessThan(OVERDRAW);
      }
    }
  });

  it('visibly sags behind a glide, even at short-glide speeds (the travel read)', () => {
    // Regression guard on tuning, not just bounds: the trailing edge must
    // extend well past rest while the leading edge never leads — the first
    // caps measured "correct" at 2–3px and read as nothing. Two speeds: the
    // slow one is what the ~250px between-question drop actually reaches
    // (tracked), where the sag must still show.
    for (const [speed, minRear] of [[1600, 1.3], [2500, 1.4]] as const) {
      const deform = { lag: speed * BLOB.lag, drag: speed * BLOB.drag, dir: -Math.PI / 2 }; // gliding up
      const pts = blobPoints(0, deform);
      const rear = Math.max(...pts.map(([, y]) => y)); // +y = behind an upward glide
      const front = Math.min(...pts.map(([, y]) => y));
      expect(rear).toBeGreaterThan(minRear); // wake + lag: a visible fraction of the radius
      expect(Math.abs(front)).toBeLessThanOrEqual(1.1); // the held leading edge stays ~spherical
    }
  });

  it('tightens the rest of the shell while a flare pushes out (conservation)', () => {
    // The counter term overcorrects (counter > 1): the mean radius must DROP
    // while a lobe is out — the fight redistributes energy, it never grows.
    const flare = { dir: 0, width: 0.8, amp: BLOB.flare.amp[1], elapsed: FLARE_CREST };
    const mean = (pts: [number, number][]) =>
      pts.reduce((s, [x, y]) => s + Math.hypot(x, y), 0) / pts.length;
    const withFlare = mean(blobPoints(2, { ...BLOB_AT_REST, flares: [flare] }));
    const without = mean(blobPoints(2, BLOB_AT_REST));
    expect(withFlare).toBeLessThan(without);
  });

  it('still bulges outward at the flare direction (the escape is visible)', () => {
    const flare = { dir: 0, width: 0.8, amp: BLOB.flare.amp[1], elapsed: FLARE_CREST };
    const at = (pts: [number, number][]) => Math.hypot(...pts[0]); // point 0 sits at theta 0
    const withFlare = at(blobPoints(2, { ...BLOB_AT_REST, flares: [flare] }));
    const without = at(blobPoints(2, BLOB_AT_REST));
    expect(withFlare).toBeGreaterThan(without);
  });
});

describe('weight', () => {
  // theta = (i / points) · 2π, +y down in SVG space: bottom = points/4.
  const BOTTOM = BLOB.points / 4;
  const TOP = (3 * BLOB.points) / 4;
  const radiusAt = (pts: [number, number][], i: number) => Math.hypot(pts[i][0], pts[i][1]);

  // Waves zeroed via cfg so the structural read isn't swamped by shimmer
  // noise — the sag/breathe coupling is the system under test.
  const STRUCTURE = { ...BLOB, waves: [] as typeof BLOB.waves };

  it('rests heavier at the base through the whole breath', () => {
    for (const frac of [0, 0.25, 0.5, 0.75]) {
      const pts = blobPoints(frac * BLOB.breathe.period, BLOB_AT_REST, STRUCTURE);
      expect(radiusAt(pts, BOTTOM)).toBeGreaterThan(radiusAt(pts, TOP));
    }
  });

  it('pools on the exhale — the bulge deepens at the bottom of the breath', () => {
    // 0.75 × period = deepest exhale, 0.25 = fullest inhale. The uniform
    // breathe term cancels in the bottom−top difference; what remains is the
    // mass visibly settling as the breath releases.
    const bulge = (frac: number) => {
      const pts = blobPoints(frac * BLOB.breathe.period, BLOB_AT_REST, STRUCTURE);
      return radiusAt(pts, BOTTOM) - radiusAt(pts, TOP);
    };
    expect(bulge(0.75)).toBeGreaterThan(bulge(0.25));
  });

  it('keeps the base calm — the crown shimmers harder than the pooled mass', () => {
    // Breathe and the sag coupling zeroed via cfg: the remaining radius
    // variance over time is pure shimmer, which the calm gradient must damp
    // at the base relative to the crown.
    const SHIMMER = {
      ...BLOB,
      breathe: { ...BLOB.breathe, amp: 0 },
      sag: { ...BLOB.sag, breathe: 0 },
    };
    const std = (index: number) => {
      const samples: number[] = [];
      for (let t = 0; t < 12; t += 0.05) {
        samples.push(radiusAt(blobPoints(t, BLOB_AT_REST, SHIMMER), index));
      }
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      return Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);
    };
    expect(std(TOP)).toBeGreaterThan(1.5 * std(BOTTOM));
  });
});

describe('pulseSwell', () => {
  it('is silent before the pulse and after the ring has decayed', () => {
    expect(pulseSwell(-1)).toBe(0);
    expect(pulseSwell(1e9)).toBe(0); // stale pulse costs exactly nothing at rest
  });

  it('swells positive first and stays under the configured amp', () => {
    const first = pulseSwell(Math.PI / 2 / BLOB.pulse.omega); // first crest region
    expect(first).toBeGreaterThan(0);
    for (let e = 0; e < 3; e += 0.01) {
      expect(Math.abs(pulseSwell(e))).toBeLessThanOrEqual(BLOB.pulse.amp);
    }
  });

  it('rings: dips below rest after the first crest (the springy read)', () => {
    const dip = pulseSwell((3 * Math.PI) / 2 / BLOB.pulse.omega);
    expect(dip).toBeLessThan(0);
  });

  it('decays away smoothly instead of cutting off (no visible pop at the tail)', () => {
    // Just inside the early-out boundary the ring must already be negligible.
    const boundary = 8 / BLOB.pulse.decay;
    expect(Math.abs(pulseSwell(boundary - 1e-3))).toBeLessThan(BLOB.pulse.amp / 100);
  });
});

describe('flareSwell', () => {
  it('is silent before the flare and after the ring has decayed', () => {
    expect(flareSwell(-1)).toBe(0);
    expect(flareSwell(1e9)).toBe(0); // stale flares cost exactly nothing
  });

  it('surges positive first (the escape attempt) and stays within ±1', () => {
    expect(flareSwell(FLARE_CREST)).toBeGreaterThan(0);
    for (let e = 0; e < 3; e += 0.01) {
      expect(Math.abs(flareSwell(e))).toBeLessThanOrEqual(1);
    }
  });

  it('dips negative after the crest (containment overcorrects inward)', () => {
    const dent = flareSwell((3 * Math.PI) / 2 / BLOB.flare.omega);
    expect(dent).toBeLessThan(0);
  });
});

describe('soften', () => {
  // Soft saturation is load-bearing: a deform that could sit pinned at a hard
  // limit during a glide would release it all in a visible snap at settle.
  it('never exceeds max, even for extreme inputs', () => {
    for (const raw of [0.07, 0.5, 99]) {
      expect(soften(raw, 0.07)).toBeLessThanOrEqual(0.07);
    }
  });

  it('is monotone in the input', () => {
    let prev = -1;
    // 99 excluded: tanh saturates to exactly max in float precision there.
    for (const raw of [0, 0.01, 0.05, 0.07, 0.2, 1]) {
      const v = soften(raw, 0.07);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  it('keeps identity slope near zero so lag/drag keep their per-px/s meaning', () => {
    expect(soften(0.001, 0.07)).toBeCloseTo(0.001, 4);
  });
});

describe('blobPath', () => {
  it('emits a closed cubic path with one segment per point', () => {
    const d = blobPath(1.23);
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith(' Z')).toBe(true);
    expect(d.match(/C /g)).toHaveLength(BLOB.points);
  });

  it('is deterministic for a given time and deformation (SSR/hydration safety)', () => {
    expect(blobPath(0)).toBe(blobPath(0));
  });
});
