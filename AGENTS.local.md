# AGENTS.md

## Project
Alien Species Evaluator — a personality-quiz web app. The user answers a short
multiple-choice quiz and gets matched to one of a handful of alien species, with an
AI-generated personalized result. 

## Stack
- Next.js (App Router) · React · TypeScript
- Motion (motion.dev) for animation
- Styling: Tailwind
- Package manager: npm
- AI: single server-side call for the result narrative — Anthropic API

## Architecture & key decisions
- **Client-side app with one server route.** Everything runs client-side except a single
  API route that holds the AI key server-side and returns the result narrative. No database,
  no auth, no persistence in v1.
- **Scoring is deterministic, not AI.** Each answer option awards weighted points to one or
  more species (`scores` keyed by `SpeciesId`). Tally across all answers; highest total wins;
  ties break by species declaration order (reproducible across retakes). The full tally is
  the "answer profile."
- **AI generates the result narrative only.** The API route receives the winning species plus
  the answer profile and returns a personalized "you as this species" writeup. AI never selects
  the species in v1.
- **Data lives in typed TS files:** `species.ts`, `questions.ts`. A `SpeciesId` union
  types every `scores` map so a mistyped id fails compilation. Use `satisfies` to preserve
  literal inference. Once these files exist they are the canonical source for the contracts below.

## Type contracts (seed — the TS files are canonical once created)
```ts
type SpeciesId = /* union of the species ids */;

interface Species {
  id: SpeciesId;
  name: string;
  tagline: string;
  description: string;        // prose; may contain markdown
  traits: string[];
}

interface Option { label: string; scores: Partial<Record<SpeciesId, number>>; }
interface Question { id: string; prompt: string; options: Option[]; }
```

