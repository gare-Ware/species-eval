// Fixed full-viewport star field behind the quiz. Pure markup + CSS animation
// (see globals.css) — cheap, and exempt from the React render cycle entirely.
// Positions are generated from a seeded PRNG at module scope so the server and
// client render identical markup (no hydration mismatch, no useEffect dance).
//
// Tunables (the flat-2D "parallax" is the size→drift coupling: bigger stars
// read as nearer, so they travel farther):
const STAR_COUNT = 700;
const SIZE_BASE = 1; // px — smallest star
const SIZE_RANGE = 2.4; // px — added via rand², so most stars stay fine
const DRIFT_BASE = 14; // px — how far the smallest stars float
const DRIFT_PER_PX = 16; // px of extra travel per px of star size
const DRIFT_SECONDS: [number, number] = [7, 16]; // one leg of the float
const TWINKLE_SECONDS: [number, number] = [2.5, 6.5];

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

const STARS = Array.from({ length: STAR_COUNT }, () => {
  const size = SIZE_BASE + rand() * rand() * SIZE_RANGE;
  const driftDistance = DRIFT_BASE + size * DRIFT_PER_PX;
  const driftAngle = rand() * Math.PI * 2;
  return {
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    size,
    opacity: 0.14 + rand() * 0.5,
    twinkle: `${(TWINKLE_SECONDS[0] + rand() * (TWINKLE_SECONDS[1] - TWINKLE_SECONDS[0])).toFixed(2)}s`,
    drift: `${(DRIFT_SECONDS[0] + rand() * (DRIFT_SECONDS[1] - DRIFT_SECONDS[0])).toFixed(2)}s`,
    delay: `${(-rand() * 12).toFixed(2)}s`,
    dx: `${(Math.cos(driftAngle) * driftDistance).toFixed(1)}px`,
    dy: `${(Math.sin(driftAngle) * driftDistance).toFixed(1)}px`,
  };
});

export function Starscape() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--o': star.opacity,
            '--twinkle': star.twinkle,
            '--drift': star.drift,
            '--delay': star.delay,
            '--dx': star.dx,
            '--dy': star.dy,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
