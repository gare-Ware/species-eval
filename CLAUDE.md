# CLAUDE.md

> **Note:** `AGENTS.md` (gitignored) is a symlink to this file so Codex reads the same
> context. Don't create a separate AGENTS.md — edit this file only.

## Project
Alien Species Evaluator — a personality-quiz web app. The user answers a short
multiple-choice quiz and gets matched to one of a handful of alien species, with an
AI-generated personalized result. Human-facing overview and setup live in `README.md`.

## Commands
- Use Node 20+ and npm 10+ (`.nvmrc` pins Node 20; npm scripts preflight this).
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build (also type-checks) · `npm run start` — serve it
- `npm run lint` — ESLint · `npm run typecheck` — `tsc --noEmit`
- `npm run test` — Vitest (scoring core, flow step machine, data invariants — no UI tests yet)

## Stack
- Next.js 15 (App Router) · React 19 · TypeScript
- Motion (motion.dev) for animation
- Styling: Tailwind v4
- Package manager: npm
- AI: single server-side call for the result narrative — Anthropic API (**planned; not
  built yet** — there is no `src/app/api/` route or Anthropic dependency so far)

## Architecture & key decisions
- **Client-side app with one server route (the route is still to come).** Everything runs
  client-side; v1 adds a single API route that holds the AI key server-side and returns the
  result narrative. No database, no auth, no persistence in v1.
- **Scoring is deterministic, not AI.** Each answer option awards weighted points to one or
  more species (`scores` keyed by `SpeciesId`). Tally across all answers; highest total wins;
  ties break by species declaration order (reproducible across retakes). The full tally is
  the "answer profile."
- **AI generates the result narrative only.** The API route receives the winning species plus
  the answer profile and returns a personalized "you as this species" writeup. AI never selects
  the species in v1.
- **Data lives in typed TS files:** `src/data/species.ts` and `src/data/questions.ts` are the
  canonical source for the type contracts (`Species`, `Option`, `Question`). A `SpeciesId`
  union types every `scores` map so a mistyped id fails compilation; data is declared with
  `satisfies` to preserve literal inference.
- **Active roster:** v1 matches to 5 of the 12 authored species via `ACTIVE_SPECIES_IDS` in
  `src/data/species.ts`. The other 7 stay authored but disabled — re-enable by adding their
  ids there. Scoring ignores points for inactive species.

## Layout
- `src/data/` — species, questions (+ data-integrity tests)
- `src/lib/` — `flow` step machine · `scoring` · `motion` vocabulary + choreography beats ·
  `slowmo` dev toggle
- `src/components/` — `Quiz` orchestrator + `StartScreen`/`QuestionCard`/`ResultCard` +
  `Blob`/`Starscape`/`SpeciesGlyph`

## Theming & type
- `--base-background`/`--base-foreground` in `globals.css` are the only place the base palette
  lives. `Quiz` overrides `--foreground`/`--accent` inline for the species takeover; retake
  clears it. Components use `bg-background`/`text-foreground`/`text-accent` (+ opacity
  modifiers), never raw white/black.
- Display font: Bricolage Grotesque (variable: wght/wdth/opsz via `next/font`). Headline is
  per-line SVG `textLength` justification in `StartScreen` — tune line sizes there.
