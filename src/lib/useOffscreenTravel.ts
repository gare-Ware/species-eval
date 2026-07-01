'use client';

import { useEffect, useState } from 'react';

// One viewport height is the distance that carries any element in the centered
// column from its resting spot to fully off-screen — up for the header, down for
// the hint and question cards. Every element's resting edge is by definition
// within the viewport, so a full viewport of travel always clears the near edge
// on *any* display, where a fixed pixel offset only clears some (a header tuned to
// leave a laptop stops mid-screen on a large monitor). main's overflow-clip hides
// the off-screen leg.
//
// SSR and the first client render use FALLBACK so the markup matches and Motion's
// initial transforms don't trip a hydration mismatch (the header + hint are in the
// server-rendered landing screen). The real height takes over in the effect, well
// before any interaction-driven exit runs, and tracks resize thereafter.
const FALLBACK = 900;

export function useOffscreenTravel() {
  const [travel, setTravel] = useState(FALLBACK);
  useEffect(() => {
    const update = () => setTravel(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return travel;
}
