import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSpecies } from '@/data/species';
import type { NarrativeInput } from '../types';

// Mock the SDK's default export: a class whose messages.create is our spy.
const createMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: createMock };
  },
}));

import { DEFAULT_ANTHROPIC_MODEL, anthropicProvider, getAnthropicModel } from './anthropic';

const input: NarrativeInput = {
  species: getSpecies('grays'),
  profile: { grays: 8, nordics: 0, reptilians: 0, mantids: 2, hybrids: 0 },
  answers: [
    { prompt: 'A new group project kicks off.', choice: 'I grab the to-do list and just start.' },
    { prompt: 'Pick the principle you live by.', choice: 'Do the work. Get it done.' },
  ],
};

describe('anthropicProvider', () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
  });

  it('sends the built prompt and returns the joined, trimmed text', async () => {
    createMock.mockResolvedValue({
      content: [
        { type: 'text', text: '  You are unmistakably Grays.' },
        { type: 'thinking', thinking: 'ignored' },
        { type: 'text', text: ' Quietly on shift.  ' },
      ],
    });

    const text = await anthropicProvider.generateResultNarrative(input);
    expect(text).toBe('You are unmistakably Grays. Quietly on shift.');

    expect(createMock).toHaveBeenCalledOnce();
    const params = createMock.mock.calls[0][0];
    expect(params.model).toBe(DEFAULT_ANTHROPIC_MODEL);
    expect(params.max_tokens).toBeGreaterThan(0);
    // The shared prompt is passed through: winner in the system prompt, the
    // reader's answers in the user turn.
    expect(params.system).toContain('Grays');
    expect(params.messages[0]).toMatchObject({ role: 'user' });
    expect(params.messages[0].content).toContain(input.answers[0].choice);
  });

  it('allows ANTHROPIC_MODEL to override the default model', async () => {
    process.env.ANTHROPIC_MODEL = 'claude-test-model';
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'Custom model reply.' }] });

    expect(getAnthropicModel()).toBe('claude-test-model');
    await anthropicProvider.generateResultNarrative(input);

    expect(createMock.mock.calls[0][0].model).toBe('claude-test-model');
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(anthropicProvider.generateResultNarrative(input)).rejects.toThrow(
      /ANTHROPIC_API_KEY/,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it('throws when the model returns no text', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'thinking', thinking: 'x' }] });
    await expect(anthropicProvider.generateResultNarrative(input)).rejects.toThrow(/empty/i);
  });
});
