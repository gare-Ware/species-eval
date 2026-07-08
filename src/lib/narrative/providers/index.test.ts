import { afterEach, describe, expect, it, vi } from 'vitest';
import { getNarrativeProvider } from './index';
import { anthropicProvider } from './anthropic';
import { mockProvider } from './mock';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getNarrativeProvider', () => {
  it('defaults to the mock provider outside production when AI_PROVIDER is unset', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getNarrativeProvider()).toBe(mockProvider);
  });

  it('requires an explicit provider in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => getNarrativeProvider()).toThrow(/AI_PROVIDER must be set/);
  });

  it('returns the mock provider for AI_PROVIDER=mock', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_PROVIDER', 'mock');
    expect(getNarrativeProvider()).toBe(mockProvider);
  });

  it('returns the anthropic provider for AI_PROVIDER=anthropic', () => {
    vi.stubEnv('AI_PROVIDER', 'anthropic');
    expect(getNarrativeProvider()).toBe(anthropicProvider);
  });

  it('throws for an unknown provider id', () => {
    vi.stubEnv('AI_PROVIDER', 'nope');
    expect(() => getNarrativeProvider()).toThrow(/Unknown AI_PROVIDER/);
  });
});
