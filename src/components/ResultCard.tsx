import type { CSSProperties } from 'react';
import type { Species } from '@/data/species';

interface ResultCardProps {
  species: Species;
  /**
   * Phase 3 seam: the result narrative. Defaults to the species' authored
   * description today; the AI route will pass a personalized writeup here later
   * with no layout change.
   */
  narrative?: string;
  onRetake: () => void;
}

// Themed by the winning species' accent via a CSS variable so the AI narrative can
// drop straight into the same shell in Phase 3.
export function ResultCard({ species, narrative, onRetake }: ResultCardProps) {
  const body = narrative ?? species.description;
  const accentStyle = { '--accent': species.accent } as CSSProperties;

  return (
    <section className="flex w-full flex-col gap-6" style={accentStyle}>
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          You are
        </p>
        <h1
          className="text-4xl font-semibold sm:text-5xl"
          style={{ color: 'var(--accent)' }}
        >
          {species.name}
        </h1>
        <p className="text-lg text-white/70">{species.tagline}</p>
      </div>

      <p className="leading-relaxed text-white/80">{body}</p>

      <ul className="flex flex-wrap gap-2">
        {species.traits.map((trait) => (
          <li
            key={trait}
            className="rounded-full border px-3 py-1 text-sm text-white/80"
            style={{ borderColor: 'var(--accent)' }}
          >
            {trait}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onRetake}
        className="mt-2 self-start rounded-full border border-white/20 px-6 py-2.5 font-medium transition hover:border-white/50"
      >
        Take it again
      </button>
    </section>
  );
}
