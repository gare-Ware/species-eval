// narrative/providers/index.ts
// Selects the configured provider behind the neutral interface. Defaults to the
// mock so the app runs with no key. `anthropic` is added in its own feature
// branch — until then, asking for it fails loudly rather than silently mocking.

import type { NarrativeProvider } from '../types';
import { mockProvider } from './mock';

export function getNarrativeProvider(): NarrativeProvider {
  const id = process.env.AI_PROVIDER ?? 'mock';
  switch (id) {
    case 'mock':
      return mockProvider;
    default:
      throw new Error(`Unknown AI_PROVIDER: "${id}"`);
  }
}
