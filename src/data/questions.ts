// questions.ts
// Canonical source for the quiz questions. Per CLAUDE.md: typed data (not JSON);
// `satisfies` preserves literal inference and a mistyped SpeciesId in `scores`
// fails compilation.
//
// Authored as a starting point — edit prose and weights freely. Each chosen
// option awards weighted points to one or more species; the winner is the
// highest tally (see lib/scoring.ts). Options below mostly award a primary 2 with
// the occasional secondary 1 where two species genuinely overlap.

import type { SpeciesId } from './species';

export interface Option {
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
      { label: 'I grab the to-do list and just start working through it.', scores: { grays: 2 } },
      { label: 'I hang back, read how everyone interacts, and step in when something feels off.', scores: { nordics: 2, hybrids: 1 } },
      { label: 'I make sure everyone knows who is steering this — me.', scores: { reptilians: 2 } },
      { label: 'I map the whole thing out and decide the smartest way to do it.', scores: { mantids: 2, grays: 1 } },
      { label: 'I sense what the team is missing and quietly become that.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'hard-decision',
    prompt: 'How do you make a genuinely hard decision?',
    options: [
      { label: 'Run the steps, weigh the cost, execute. Feelings stay out of it.', scores: { grays: 2, mantids: 1 } },
      { label: 'I think about who it affects and what the right thing is.', scores: { nordics: 2 } },
      { label: 'I pick whatever leaves me in the strongest position.', scores: { reptilians: 2 } },
      { label: 'I model the outcomes years ahead and choose the optimal path.', scores: { mantids: 2 } },
      { label: 'It depends entirely on the situation — I read it and adapt.', scores: { hybrids: 2, nordics: 1 } },
    ],
  },
  {
    id: 'at-a-party',
    prompt: 'At a party, where do people find you?',
    options: [
      { label: 'Quietly helping the host refill drinks and tidy up.', scores: { grays: 2 } },
      { label: 'On the edge of the room, taking in the whole scene.', scores: { nordics: 2 } },
      { label: 'At the center, holding court and steering the conversation.', scores: { reptilians: 2 } },
      { label: 'In a corner, deep in one precise, intense conversation.', scores: { mantids: 2 } },
      { label: 'Drifting between groups — fitting in everywhere and nowhere.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'ideal-work',
    prompt: 'Your ideal kind of work is...',
    options: [
      { label: 'Clear tasks, done well, no surprises.', scores: { grays: 2 } },
      { label: 'Guiding people and looking out for them.', scores: { nordics: 2 } },
      { label: 'Running the show, with real authority.', scores: { reptilians: 2, mantids: 1 } },
      { label: 'Cracking the hardest problem in the room.', scores: { mantids: 2 } },
      { label: 'Something different every day that keeps me on my toes.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'unsettling',
    prompt: 'What do people find faintly unsettling about you?',
    options: [
      { label: 'How calm and unbothered I stay, no matter what.', scores: { grays: 2 } },
      { label: 'That I seem to already know how things end.', scores: { nordics: 2 } },
      { label: 'How easily I take control of a room.', scores: { reptilians: 2 } },
      { label: 'That I see straight through the problem — and through them.', scores: { mantids: 2 } },
      { label: 'They can never quite place me.', scores: { hybrids: 2 } },
    ],
  },
  {
    id: 'guiding-principle',
    prompt: 'Pick the principle you actually live by.',
    options: [
      { label: 'Do the work. Get it done.', scores: { grays: 2 } },
      { label: 'Leave things better, and do no harm.', scores: { nordics: 2 } },
      { label: 'Win, and stay ahead.', scores: { reptilians: 2 } },
      { label: 'Understand everything; optimize accordingly.', scores: { mantids: 2 } },
      { label: 'Bend, blend, endure.', scores: { hybrids: 2 } },
    ],
  },
] satisfies Question[];
