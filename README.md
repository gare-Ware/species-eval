# Alien Species Evaluator

A personality-quiz web app. Answer a short multiple-choice quiz and get matched to one of a
handful of alien species, with a personalized "you as this species" result.

## How it works

- **Scoring is deterministic.** Each answer option awards weighted points to one or more
  species; the highest total across all answers wins, with ties broken by species declaration
  order so retakes are reproducible.
- **AI writes the narrative only.** A single server-side API route recomputes the result from
  the submitted answer IDs and asks the configured narrative provider for the personalized
  writeup. AI never picks the species.
- **12 species are authored, 5 are active.** The live roster is controlled by
  `ACTIVE_SPECIES_IDS` in `src/data/species.ts`; scoring ignores points for inactive species.

No database, no auth, no persistence — everything runs client-side except `POST /api/result`.
Local dev defaults to the deterministic mock narrative provider. Production requires an
explicit `AI_PROVIDER` (`mock` or `anthropic`) so a mock deploy is always intentional; the
Anthropic adapter uses `ANTHROPIC_API_KEY` and defaults to `ANTHROPIC_MODEL=claude-haiku-4-5`.

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
  lib/          flow · scoring · narrative providers/prompting · motion · slowmo
  components/   Quiz orchestrator · StartScreen / QuestionCard / ResultCard · Blob / Starscape / SpeciesGlyph
tests/e2e/      Playwright smoke tests for behavior contracts, not visual snapshots
```

Quiz content is plain typed TypeScript — a `SpeciesId` union types every option's `scores`
map, so a mistyped species id fails compilation.
