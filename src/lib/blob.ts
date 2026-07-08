// ─────────────────────────────────────────────────────────────────────────────
// Energy-ball shape engine — pure math, no DOM. Blob.tsx drives this once per
// frame and writes the returned path into an <svg>. The design brief: chaotic
// energy forced into a ball. An invisible force has full control; the energy
// visibly fights it and always loses.
//
// The vocabulary, every visible number tunable in BLOB below:
//
//   waves     — fast shallow shimmer; each wave's amplitude rides its own slow
//               bursty envelope (mod), so activity simmers irregularly instead
//               of looping — constant-amplitude periodic ripple is exactly what
//               read as goo
//   breathe   — whole-ball pulse (the idle heartbeat)
//   pulse     — rare springy whole-ball swell on the start screen
//   flare     — the fight: a random lobe surges outward, containment snaps it
//               back through rest, dents it slightly inward (the force
//               overcorrecting), rings down. While a lobe pushes out the rest
//               of the shell pulls in (counter): the same energy redistributed,
//               never the ball growing
//   sag       — the weight system: a bottom bulge that POOLS ON THE EXHALE
//               (mass settles as the breath releases) plus a calm-base shimmer
//               gradient (the energy crackles at the crown; the dense mass at
//               the base barely stirs). Weight read as behavior, not just shape
//               — a static bulge alone measured ~1–2px and read as nothing
//   velocity  — travel: the shell sits `lag` behind the true center, a broad
//               wake trails it (drag), and the trailing hemisphere shimmers
//               harder (streak) — the energy sags behind the glide while the
//               leading edge stays held spherical, then sloshes forward once
//               and regroups at settle (the underdamped tracker in Blob.tsx)
//   agitation — churn charged by shoves (|Δspeed|, accumulated in Blob.tsx):
//               arriving from a glide spikes the shimmer and the flare rate,
//               then rings down — the energy roils as it regroups
//   charge    — the final-beat storm (scheduling in Blob.tsx): while the AI
//               verdict is coming, agitation is held near max, flares spawn
//               faster and bigger, and the whole ball breathes in sin² swell
//               cycles — zero amplitude AND zero slope at every cycle
//               boundary, so the reveal (which Quiz quantizes to a boundary)
//               always launches from the trough of a completed surge
//
// Set BLOB.alive = false to revert to the plain filled circle (Blob.tsx renders
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
  /**
   * Amplitude envelope: the crest heights themselves surge and die. depth is
   * the swing (±depth around the base amp); the squared-sine shaping spends
   * most of its time low and spikes high, so activity arrives in irregular
   * simmers. Speeds incommensurate across waves so the surface never repeats.
   */
  mod: { speed: number; depth: number; phase: number };
}

/** A localized escape attempt — one lobe of energy surging against the shell. */
export interface BlobFlare {
  /** Perimeter direction the lobe pushes toward (radians, SVG space). */
  dir: number;
  /** Angular half-width of the bulge (radians). */
  width: number;
  /** Radial scale of the fight — the first visible crest reaches ~0.57 × amp. */
  amp: number;
  /** Seconds since the flare fired. */
  elapsed: number;
}

export const BLOB = {
  /** Master switch: false = plain circle, no rAF loop. */
  alive: true,

  /** Perimeter samples. More = smoother, slower. 24–40 is the useful range. */
  points: 28,

  /**
   * Surface shimmer. Energy character lives in the speed:amp ratio — fast and
   * shallow crackles like a contained field; slow it down and deepen it and
   * the same math turns back into goo. Keep total base amp under ~0.035 (the
   * envelopes and churn multiply on top — the overdraw test pins the ceiling).
   */
  waves: [
    { lobes: 5, amp: 0.016, speed: 2.2, phase: 0.0, mod: { speed: 0.7, depth: 0.6, phase: 1.3 } },
    { lobes: 7, amp: 0.01, speed: -3.4, phase: 2.1, mod: { speed: 1.1, depth: 0.7, phase: 4.2 } },
    { lobes: 9, amp: 0.007, speed: 4.8, phase: 4.4, mod: { speed: 1.7, depth: 0.8, phase: 0.6 } },
  ] as BlobWave[],

  /** Whole-ball pulse: radius swings ±amp over period seconds — the idle heartbeat. */
  breathe: { amp: 0.028, period: 2.8 },

  /**
   * Surprise pulse: a springy whole-ball swell fired at random intervals on the
   * start screen (scheduling lives in Blob.tsx so this module stays
   * deterministic). Envelope: exponentially damped sine — the first crest
   * reaches ~⅔ of amp, rings once below rest, and is spent within a second.
   * Rare on purpose (Comeau: rare = surprise, frequent = needy), and its peak
   * (~+4.5% radius) sits deliberately under the hover lift (PRESS_HERO +8%),
   * so pointer feedback always outranks ambient whimsy.
   */
  pulse: {
    amp: 0.07, // envelope scale — first visible crest ≈ 0.66 × amp
    omega: 14, // ring frequency (rad/s) — higher = springier
    decay: 4, // envelope die-off (1/s) — higher = spent sooner
    gap: [7, 13] as [number, number], // seconds between pulses (uniform random)
    firstGap: [3, 6] as [number, number], // sooner, so short visits still see one
  },

  /**
   * Escape attempts. Each flare is a lobe with a damped-sine radial envelope
   * (flareSwell): a fast surge outward — the escape — snapped back through
   * rest into a shallow inward dent — the containment overcorrecting — then
   * rung down. Frequent on purpose: unlike the pulse this is the ball's
   * substance, not a UI cue, so the fight should read as near-constant.
   * Scheduling (random dir/width/amp, spawn cadence) lives in Blob.tsx.
   */
  flare: {
    amp: [0.05, 0.11] as [number, number], // per-event radial scale
    width: [0.55, 0.95] as [number, number], // angular half-width (radians)
    omega: 9, // fight frequency: crest ~0.17s, dent ~0.5s, spent ~1s
    decay: 3.2, // envelope die-off (1/s)
    gap: [0.9, 2.4] as [number, number], // seconds between spawns at idle
    /**
     * Direction bias (sampling lives in Blob.tsx): flares erupt where the
     * energy already is. At rest they favor the crown — the dense mass at the
     * base doesn't erupt downward — and during travel they chase the wake,
     * where the streak says the energy is streaming. Triangular spread around
     * the bias center; wider = looser aim, ~π = almost uniform.
     */
    bias: {
      travel: 300, // tracked px/s above which the wake, not the sky, is the target
      spread: [1.2, 2.2] as [number, number], // radians around the center: [traveling, at rest]
    },
    /** Soft cap (soften()) on the summed outward push, so stacked flares can't spike. */
    maxTotal: 0.12,
    /**
     * Conservation, overcorrected: the rest of the shell pulls in by counter ×
     * the flare's mean outward push. 1 = volume-preserving; 2 reads as the
     * force clamping down harder than the escape deserved.
     */
    counter: 2,
  },

  /**
   * Resting weight, read through behavior rather than a fixed bulge:
   *   amp     — bottom bulge scale (the mass pooled at the base)
   *   breathe — fraction of amp swung by the breath phase: the bulge grows as
   *             the ball exhales (mass settling) and eases as it inhales —
   *             conservation, so the weight reads as the SAME energy sinking
   *   calm    — shimmer damping at the base (0–1): the crown crackles, the
   *             dense base barely stirs. The contrast is the legible part.
   */
  sag: { amp: 0.05, breathe: 0.6, calm: 0.5 },

  /**
   * Churn. Blob.tsx accumulates |Δspeed| × gain into a 0–1 level that decays
   * over tau seconds; here it multiplies the shimmer (waveGain) — and back in
   * Blob.tsx it shortens the flare gap (flareRate): the energy fights hardest
   * right after being dragged around. Arrival from a glide is the big shove —
   * the ball visibly roils as it regroups, then settles back to a simmer.
   * kick: instant charge injected by pointer engagement (Blob.tsx) — the
   * energy bristles when a hand approaches the containment; press pushes
   * harder. Transient and shimmer-only, so the sustained hover scale stays
   * the loudest cue (the ambient-vs-interactive ranking).
   */
  agitation: { gain: 1 / 2600, tau: 0.55, waveGain: 0.7, flareRate: 0.55, kick: { hover: 0.3, press: 0.5 } },

  /**
   * Final-beat charge (Blob.tsx drives it while Quiz holds the reveal): the
   * fight escalates while the verdict is coming. Everything is existing
   * vocabulary turned up — no new physics:
   *   period   — seconds per swell cycle. Quiz reveals only on a boundary
   *              (see motion.ts CHARGE_CYCLE_MS), so keep them in sync via
   *              this one number.
   *   ramp     — seconds from the beat's step change to full storm. The ramp
   *              runs THROUGH the descent — agitation and flare violence build
   *              in flight, so the ball lands already storming and the first
   *              thump hits at touchdown (the swell/thump cycles themselves
   *              still start at touchdown, keeping the boundary grid intact)
   *   swell    — whole-ball breathing amplitude per cycle (sin² hump: silent
   *              and flat at both ends, so any boundary is a clean cut)
   *   pulse    — the thump: a springy pulseSwell ring fired at every cycle
   *              start, × the idle pulse's amp. Rung down well inside one
   *              period (decay 4 → spent ~0.7s in), so boundaries stay
   *              silent; the thump punches at the cycle start, the hump
   *              swells mid-cycle — THUMP, swell, THUMP is the storm rhythm.
   *              Their crests are temporally separated, so combined swell
   *              never exceeds the idle pulse bound (~0.065 < pulse.amp).
   *   agitation— churn floor at full charge (shimmer + flare rate ride it;
   *              fed into the real accumulator so it decays naturally through
   *              the reveal pop instead of snapping off)
   *   flareAmp — flare amplitude multiplier at full charge
   *   flareGap — extra spawn-gap cut at full charge (× (1 − this))
   */
  charge: { period: 1.1, ramp: 0.55, swell: 0.055, pulse: 3, agitation: 1, flareAmp: 3, flareGap: 0.55 },

  /** Travel streak: extra trailing-hemisphere shimmer, ∝ normalized wake. */
  streak: 0.8,
  /** Hard ceiling on the combined shimmer multiplier (churn + streak). */
  maxBoost: 2,

  /**
   * Center-of-gravity lag, per px/s of travel: the whole shell shifts this far
   * BEHIND the button's true center, so motion visibly originates at the core
   * and the front edge never leads. maxLag (fraction of radius) is a SOFT cap
   * (see soften()), approached asymptotically. Tuning constraint: keep the
   * slope set so raw ≈ max around PEAK glide speed (~2000–3500 px/s). If the
   * cap engages far below that, the shape rides every glide pinned at max and
   * releases it all in the last few frames as the tracker rings through zero —
   * a visible snap right at settle. Sized to be SEEN: ~11–14% of radius at
   * peak (the first 6%/9% caps measured correct and read as nothing).
   */
  lag: 1 / 12000,
  maxLag: 0.16,

  /**
   * Trailing wake per px/s, soft-capped by maxDrag — the visible "energy sags
   * behind, then regroups". The slope is tuned against the SHORT glide (the
   * ~250px between-question drop only reaches ~1600 px/s tracked), so the
   * sag reads there too, not just on the long start→quiz travel: ~27% of
   * radius at 1600, ~35% at the big-glide peak. tailShape focuses it (higher
   * = narrower); 2 = a broad wake across the whole back half, mass dragging
   * rather than a needle.
   */
  drag: 1 / 5000,
  maxDrag: 0.42,
  tailShape: 2,

  /**
   * Deformation spring: the shape chases velocity as an underdamped spring.
   * response = natural frequency in rad/s (higher = snaps back to spherical
   * sooner); springDamping = damping ratio (<1 overshoots once — the mass
   * sloshes forward as the blob stops, then rings down; 1 = no overshoot).
   * response also low-passes short glides: the between-question flight is a
   * ~200ms speed pulse, and below ~24 the tracker clips too much of its peak
   * for the sag to show.
   */
  response: 28,
  springDamping: 0.55,
};

export type BlobConfig = typeof BLOB;

/** Per-frame dynamic deformation (velocity terms already smoothed by the caller). */
export interface BlobDeform {
  /** Shell offset behind the center along `dir`, soft-capped by maxLag. */
  lag: number;
  /** Trailing wake, soft-capped by maxDrag. */
  drag: number;
  /** Direction of travel in radians (SVG space: +y is down). */
  dir: number;
  /** Uniform transient radius kick — the surprise pulse (see pulseSwell). 0/absent at rest. */
  swell?: number;
  /** Active escape attempts (scheduling lives in Blob.tsx; the math here is pure). */
  flares?: BlobFlare[];
  /** 0–1 churn level (shove-charged, accumulated by the caller — see BLOB.agitation). */
  agitation?: number;
}

export const BLOB_AT_REST: BlobDeform = { lag: 0, drag: 0, dir: 0 };

/**
 * Springy radius kick `elapsed` seconds after a pulse fires — feed the result
 * into BlobDeform.swell. Damped sine: swell up, one visible dip below rest,
 * done. Pure and deterministic; when the ring has decayed to nothing it is
 * exactly 0, so a stale pulse costs nothing at rest.
 */
export function pulseSwell(elapsed: number, cfg: BlobConfig = BLOB): number {
  const { amp, omega, decay } = cfg.pulse;
  if (elapsed < 0 || elapsed * decay > 8) return 0; // not fired / fully rung down
  return amp * Math.exp(-decay * elapsed) * Math.sin(omega * elapsed);
}

/**
 * A flare's radial envelope `elapsed` seconds after it fires, normalized to
 * ±1 (BlobFlare.amp scales it). Same damped-sine family as pulseSwell — it IS
 * the fight-and-lose curve: surge out (first crest ~0.17s), snapped back
 * through rest (~0.35s), a shallow inward dent as the force overcorrects
 * (~0.5s), rung down. Exactly 0 once decayed, so stale flares cost nothing.
 */
export function flareSwell(elapsed: number, cfg: BlobConfig = BLOB): number {
  const { omega, decay } = cfg.flare;
  if (elapsed < 0 || elapsed * decay > 8) return 0;
  return Math.exp(-decay * elapsed) * Math.sin(omega * elapsed);
}

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
  const breathePhase = Math.sin((2 * Math.PI * t) / cfg.breathe.period);
  const breathe = cfg.breathe.amp * breathePhase;
  // Weight: the bulge pools on the exhale (phase < 0) and eases on the inhale —
  // the mass visibly settles with each breath instead of sitting frozen.
  const sagAmp = cfg.sag.amp * (1 - cfg.sag.breathe * breathePhase);
  const lag = soften(deform.lag, cfg.maxLag);
  const drag = soften(deform.drag, cfg.maxDrag);
  const dragNorm = drag / cfg.maxDrag; // 0..1 travel intensity, shared by the streak
  const ux = Math.cos(deform.dir);
  const uy = Math.sin(deform.dir);

  // Per-wave amplitude envelopes, hoisted out of the point loop.
  const waveAmp = cfg.waves.map((w) => {
    const burst = (0.5 + 0.5 * Math.sin(w.mod.speed * t + w.mod.phase)) ** 2;
    return w.amp * (1 + w.mod.depth * (2 * burst - 1));
  });

  // Churn floor of the shimmer multiplier; the trailing streak adds per-point.
  const churn = 1 + cfg.agitation.waveGain * Math.min(deform.agitation ?? 0, 1);

  // Active flares with their envelopes hoisted; only the angular window runs
  // per point. Conservation: the mean outward push over the whole perimeter
  // (raised-cosine window integrates to width) is pulled back uniformly at
  // counter ×, so a fighting lobe reads as energy redistributed, never growth.
  const flares = (deform.flares ?? [])
    .map((f) => ({ ...f, env: f.amp * flareSwell(f.elapsed, cfg) }))
    .filter((f) => f.env !== 0);
  const flareMean = flares.reduce((m, f) => m + (f.env * f.width) / (2 * Math.PI), 0);

  const pts: [number, number][] = [];
  for (let i = 0; i < cfg.points; i++) {
    const theta = (i / cfg.points) * 2 * Math.PI;
    const towards = Math.cos(theta) * ux + Math.sin(theta) * uy;
    // Backward-facing hemisphere mask, shared by the wake and the streak.
    const trail = Math.max(0, -towards);
    // Downward mask (+y in SVG space), shared by the sag and the calm base.
    const down = Math.max(0, Math.sin(theta));

    let r = 1 + breathe + (deform.swell ?? 0);

    // Shimmer: churn lifts it everywhere, the streak lifts the trailing side
    // at speed (energy streams behind; the leading edge stays held spherical),
    // and the base stays calm — the crown crackles, the pooled mass barely
    // stirs. The top/bottom contrast is what makes the weight legible.
    const boost = Math.min(churn + cfg.streak * dragNorm * trail, cfg.maxBoost);
    const calm = 1 - cfg.sag.calm * down * down;
    for (let j = 0; j < cfg.waves.length; j++) {
      const w = cfg.waves[j];
      r += waveAmp[j] * boost * calm * Math.sin(w.lobes * theta + w.speed * t + w.phase);
    }

    // Gravity: bulge concentrated at the bottom, breathing with sagAmp (mass
    // pools on the exhale), with a small global shrink so the sag reads as
    // mass shifting, not growing.
    r += sagAmp * (down * down - 0.35);

    // Escape attempts: each flare is a raised-cosine lobe riding its fight
    // envelope; the summed push is soft-capped, and the counter term pulls
    // the whole shell in while any lobe is out (and lets it relax back out
    // during the inward dent — the same story with the sign flipped).
    let push = 0;
    for (const f of flares) {
      const d = Math.atan2(Math.sin(theta - f.dir), Math.cos(theta - f.dir));
      if (Math.abs(d) < f.width) push += f.env * (0.5 + 0.5 * Math.cos((Math.PI * d) / f.width));
    }
    r += soften(push, cfg.flare.maxTotal) - cfg.flare.counter * flareMean;

    // Trailing wake: extra radius focused on the side facing away from travel.
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
