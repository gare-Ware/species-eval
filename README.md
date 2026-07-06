# Alien Species Evaluator

A personality-quiz web app. Answer a short multiple-choice quiz and get matched to one of a
handful of alien species, with a personalized "you as this species" result.

## How it works

- **Scoring is deterministic.** Each answer option awards weighted points to one or more
  species; the highest total across all answers wins, with ties broken by species declaration
  order so retakes are reproducible.
- **AI writes the narrative only** (planned for v1, not built yet): a single server-side API
  route will call the Anthropic API to generate the result writeup. AI never picks the species.
- **12 species are authored, 5 are active.** The live roster is controlled by
  `ACTIVE_SPECIES_IDS` in `src/data/species.ts`; scoring ignores points for inactive species.

No database, no auth, no persistence — everything runs client-side except the (planned)
narrative route.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · [Motion](https://motion.dev)
· Vitest · Playwright

## Getting started

Use Node 20+ and npm 9+ (`.nvmrc` pins Node 20 for nvm users).

```bash
nvm use
npm install
npx playwright install chromium   # first time only, for npm run test:e2e
npm run dev   # → http://localhost:3000
```

## Scripts

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                            |
| `npm run build`     | Production build (also type-checks)                             |
| `npm run start`     | Serve the production build                                      |
| `npm run lint`      | ESLint                                                          |
| `npm run typecheck` | `tsc --noEmit` — verifies the `SpeciesId` scoring contracts     |
| `npm run test`      | Vitest: scoring core, flow step machine, data invariants        |
| `npm run test:e2e`  | Playwright: browser smoke tests for quiz flow and layout        |

## Project structure

```
src/
  app/          Next.js app shell, global styles, fonts
  data/         species.ts, questions.ts — typed quiz content (+ integrity tests)
  lib/          flow (step machine) · scoring · motion (animation vocabulary) · slowmo (dev toggle)
  components/   Quiz orchestrator · StartScreen / QuestionCard / ResultCard · Blob / Starscape / SpeciesGlyph
tests/e2e/      Playwright smoke tests for behavior contracts, not visual snapshots
```

Quiz content is plain typed TypeScript — a `SpeciesId` union types every option's `scores`
map, so a mistyped species id fails compilation.
