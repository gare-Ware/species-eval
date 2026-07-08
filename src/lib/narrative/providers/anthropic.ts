// narrative/providers/anthropic.ts
// The real AI adapter, behind the neutral NarrativeProvider interface. Reads the
// server-only ANTHROPIC_API_KEY, sends the shared prompt (built in prompt.ts),
// and returns the reading. Errors propagate to the route, which maps them to a
// 502 and the client's honest error state — there is no silent fallback here.

import Anthropic from '@anthropic-ai/sdk';
import { buildNarrativePrompt } from '../prompt';
import type { NarrativeInput, NarrativeProvider } from '../types';

// Haiku 4.5: fast and cheap for a ~130-word reading, comfortably inside the
// reveal beat. Swap this one line to change models (Haiku rejects the `effort`
// param, so don't add it here).
const MODEL = 'claude-haiku-4-5';
// The route caps the reading at NARRATIVE_MAX_CHARS (~1600 chars ≈ 400
// tokens); 512 leaves head-room while still bounding a truly runaway reply.
const MAX_TOKENS = 512;

// Lazy singleton so the module imports cleanly even when no key is set (the
// mock path never constructs this). The key is re-checked on every call.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  client ??= new Anthropic();
  return client;
}

export const anthropicProvider: NarrativeProvider = {
  id: 'anthropic',
  async generateResultNarrative(input: NarrativeInput): Promise<string> {
    const { system, user } = buildNarrativePrompt(input);

    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!text) throw new Error('Anthropic returned an empty narrative');
    return text;
  },
};
