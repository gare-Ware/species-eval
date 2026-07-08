// narrative/providers/index.ts
// Selects the configured provider behind the neutral interface. Defaults to the
// mock so the app runs with no key; `anthropic` is the real AI adapter. An
// unknown id fails loudly rather than silently mocking.

import type { NarrativeProvider } from '../types';
import { anthropicProvider } from './anthropic';
import { mockProvider } from './mock';

export function getNarrativeProvider(): NarrativeProvider {
  const id = process.env.AI_PROVIDER ?? 'mock';
  switch (id) {
    case 'mock':
      return mockProvider;
    case 'anthropic':
      return anthropicProvider;
    default:
      throw new Error(`Unknown AI_PROVIDER: "${id}"`);
  }
}
