// Fixed full-viewport star field behind the quiz. Pure markup + CSS animation
// (see globals.css) — cheap, and exempt from the React render cycle entirely.
// Positions are generated from a seeded PRNG at module scope so the server and
// client render identical markup (no hydration mismatch, no useEffect dance).

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

const STARS = Array.from({ length: 40 }, () => ({
  left: `${(rand() * 100).toFixed(2)}%`,
  top: `${(rand() * 100).toFixed(2)}%`,
  size: 1 + rand() * 1.8,
  opacity: 0.12 + rand() * 0.45,
  twinkle: `${(3 + rand() * 4).toFixed(2)}s`,
  drift: `${(10 + rand() * 14).toFixed(2)}s`,
  delay: `${(-rand() * 10).toFixed(2)}s`,
}));

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
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
