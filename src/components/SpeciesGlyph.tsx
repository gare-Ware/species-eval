import type { SpeciesId } from '@/data/species';

// Filler species portraits for the reveal — minimal line glyphs drawn in
// currentColor so they pick up whatever the blob's text color is. Real artwork
// can replace this component without touching the blob or result layout.
// Glyphs exist for the active v1 roster; everything else gets the saucer.

const GLYPHS: Partial<Record<SpeciesId, React.ReactNode>> = {
  grays: (
    <>
      <path d="M50 14 C70 14 82 30 82 47 C82 66 65 86 50 86 C35 86 18 66 18 47 C18 30 30 14 50 14 Z" />
      <ellipse cx="37" cy="50" rx="11" ry="5.5" transform="rotate(24 37 50)" fill="currentColor" stroke="none" />
      <ellipse cx="63" cy="50" rx="11" ry="5.5" transform="rotate(-24 63 50)" fill="currentColor" stroke="none" />
    </>
  ),
  nordics: (
    <>
      <circle cx="50" cy="50" r="30" />
      <path d="M26 40 C34 26 66 26 74 40" />
      <path d="M36 54 q 6 6 12 0" />
      <path d="M52 54 q 6 6 12 0" />
    </>
  ),
  reptilians: (
    <>
      <path d="M12 50 Q50 22 88 50 Q50 78 12 50 Z" />
      <ellipse cx="50" cy="50" rx="6" ry="17" fill="currentColor" stroke="none" />
    </>
  ),
  mantids: (
    <>
      <path d="M50 26 L80 44 L50 84 L20 44 Z" />
      <path d="M40 24 Q32 12 24 9" />
      <path d="M60 24 Q68 12 76 9" />
      <ellipse cx="39" cy="47" rx="8" ry="4.5" transform="rotate(30 39 47)" fill="currentColor" stroke="none" />
      <ellipse cx="61" cy="47" rx="8" ry="4.5" transform="rotate(-30 61 47)" fill="currentColor" stroke="none" />
    </>
  ),
  hybrids: (
    <>
      <path d="M50 14 C68 14 80 28 80 46 C80 64 66 84 50 84 C34 84 20 64 20 46 C20 28 32 14 50 14 Z" />
      <path d="M50 14 V84" strokeDasharray="3 7" />
      <ellipse cx="35" cy="48" rx="10" ry="5" transform="rotate(22 35 48)" fill="currentColor" stroke="none" />
      <circle cx="65" cy="48" r="5" />
    </>
  ),
};

const SAUCER = (
  <>
    <ellipse cx="50" cy="56" rx="36" ry="13" />
    <path d="M30 48 C32 32 68 32 70 48" />
    <circle cx="35" cy="58" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="50" cy="61" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="65" cy="58" r="2.5" fill="currentColor" stroke="none" />
  </>
);

export function SpeciesGlyph({ id, className }: { id: SpeciesId; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[id] ?? SAUCER}
    </svg>
  );
}
