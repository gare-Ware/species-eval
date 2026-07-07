import { describe, expect, it } from 'vitest';
import { BLOB, BLOB_AT_REST, blobPath, blobPoints, soften } from './blob';

// The Blob SVG reserves 1.5× the nominal radius (OVERDRAW in Blob.tsx); the
// shape must stay inside that no matter what velocity the frame loop feeds in.
const OVERDRAW = 1.5;

const HARD_DEFORM = { lag: 99, drag: 99, dir: Math.PI / 3 };

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

  it('clamps extreme velocity deformation inside the SVG overdraw box', () => {
    for (const [x, y] of blobPoints(3.2, HARD_DEFORM)) {
      expect(Math.hypot(x, y)).toBeLessThan(OVERDRAW);
    }
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
