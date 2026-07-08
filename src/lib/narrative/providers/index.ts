// narrative/providers/index.ts
// Selects the configured provider behind the neutral interface. Local/dev/test
// can omit AI_PROVIDER and get the deterministic mock; production must choose a
// provider explicitly so a deploy cannot accidentally look "AI-powered" while
// still running the mock. An unknown id fails loudly rather than silently
// mocking.

import type { NarrativeProvider } from '../types';
import { anthropicProvider } from './anthropic';
import { mockProvider } from './mock';

export function getNarrativeProvider(): NarrativeProvider {
  const configured = process.env.AI_PROVIDER?.trim();
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('AI_PROVIDER must be set in production.');
  }

  const id = configured || 'mock';
  switch (id) {
    case 'mock':
      return mockProvider;
    case 'anthropic':
      return anthropicProvider;
    default:
      throw new Error(`Unknown AI_PROVIDER: "${id}"`);
  }
}
