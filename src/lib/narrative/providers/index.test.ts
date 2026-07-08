import { afterEach, describe, expect, it } from 'vitest';
import { getNarrativeProvider } from './index';
import { anthropicProvider } from './anthropic';
import { mockProvider } from './mock';

afterEach(() => {
  delete process.env.AI_PROVIDER;
});

describe('getNarrativeProvider', () => {
  it('defaults to the mock provider when AI_PROVIDER is unset', () => {
    expect(getNarrativeProvider()).toBe(mockProvider);
  });

  it('returns the mock provider for AI_PROVIDER=mock', () => {
    process.env.AI_PROVIDER = 'mock';
    expect(getNarrativeProvider()).toBe(mockProvider);
  });

  it('returns the anthropic provider for AI_PROVIDER=anthropic', () => {
    process.env.AI_PROVIDER = 'anthropic';
    expect(getNarrativeProvider()).toBe(anthropicProvider);
  });

  it('throws for an unknown provider id', () => {
    process.env.AI_PROVIDER = 'nope';
    expect(() => getNarrativeProvider()).toThrow(/Unknown AI_PROVIDER/);
  });
});
