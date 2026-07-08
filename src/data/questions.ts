// questions.ts
// Canonical source for the quiz questions — typed data, so a mistyped SpeciesId
// in `scores` fails compilation (`satisfies` preserves literal inference).
// Each chosen option awards weighted points to one or more species; highest
// tally wins (lib/scoring.ts). Options award a primary 2, with an occasional
// secondary 1 where two species genuinely overlap.
//
// Four options per question against five active species: each question one
// species sits out its primary and instead rides a secondary 1 on the option
// it genuinely shares (the sit-out rotates so no species is starved — mantids
// absorb the sixth slot). Reachability is pinned by integrity.test.ts: every
// species' best-option path must still win.

import type { SpeciesId } from './species';

export interface Option {
  id: string;
  label: string;
  scores: Partial<Record<SpeciesId, number>>;
}

export interface Question {
  id: string;
  prompt: string;
  options: Option[];
}

export const questions = [
  {
    id: 'group-project',
    prompt: 'A new group project kicks off. What role do you slide into?',
    options: [
      { id: 'operator', label: 'I grab the to-do list and just start working through it.', scores: { grays: 2 } },
      { id: 'observer', label: 'I hang back, read how everyone interacts, and step in where I fit.', scores: { nordics: 2, hybrids: 1 } },
      { id: 'director', label: 'I make sure everyone knows who is steering this — me.', scores: { reptilians: 2 } },
      { id: 'strategist', label: 'I map the whole thing out and decide the smartest way to do it.', scores: { mantids: 2, grays: 1 } },
    ],
  },
  {
    id: 'hard-decision',
    prompt: 'How do you make a genuinely hard decision?',
    options: [
      { id: 'execute', label: 'Run the steps, weigh the cost, execute. Feelings stay out of it.', scores: { grays: 2, mantids: 1 } },
      { id: 'ethics', label: 'I think about who it affects and what the right thing is.', scores: { nordics: 2 } },
      { id: 'advantage', label: 'I pick whatever leaves me in the strongest position.', scores: { reptilians: 2 } },
      { id: 'read-room', label: 'It depends entirely on the situation — I read it and adapt.', scores: { hybrids: 2, nordics: 1 } },
    ],
  },
  {
    id: 'at-a-party',
    prompt: 'At a party, where do people find you?',
    options: [
      { id: 'edge-observer', label: 'On the edge of the room, taking in the whole scene.', scores: { nordics: 2 } },
      { id: 'center-stage', label: 'At the center, holding court and steering the conversation.', scores: { reptilians: 2 } },
      { id: 'intense-corner', label: 'In a quiet corner, deep in one precise, intense conversation.', scores: { mantids: 2, grays: 1 } },
      { id: 'drifter', label: 'Drifting between groups — fitting in everywhere and nowhere.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'ideal-work',
    prompt: 'Your ideal kind of work is...',
    options: [
      { id: 'clear-tasks', label: 'Clear tasks, done well, no surprises.', scores: { grays: 2 } },
      { id: 'guardian', label: 'Guiding people and looking out for them.', scores: { nordics: 2 } },
      { id: 'authority', label: 'Running the show, with real authority.', scores: { reptilians: 2, mantids: 1 } },
      { id: 'variety', label: 'Something different every day that keeps me on my toes.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'unsettling',
    prompt: 'What do people find faintly unsettling about you?',
    options: [
      { id: 'unbothered', label: 'How calm and unbothered I stay, no matter what.', scores: { grays: 2 } },
      { id: 'already-knows', label: 'That I seem to already know how things end.', scores: { nordics: 2, reptilians: 1 } },
      { id: 'sees-through', label: 'That I see straight through the problem — and through them.', scores: { mantids: 2 } },
      { id: 'unplaceable', label: 'They can never quite place me.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'guiding-principle',
    prompt: 'Pick the principle you actually live by.',
    options: [
      { id: 'do-work', label: 'Do the work. Get it done.', scores: { grays: 2 } },
      { id: 'win', label: 'Win, and stay ahead.', scores: { reptilians: 2 } },
      { id: 'optimize', label: 'Understand everything; optimize accordingly.', scores: { mantids: 2 } },
      { id: 'endure', label: 'Adapt. Endure. Leave it better than you found it.', scores: { hybrids: 2, nordics: 1 } },
    ],
  },
] satisfies Question[];
