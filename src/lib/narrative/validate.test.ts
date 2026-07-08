import { describe, expect, it } from 'vitest';
import { NARRATIVE_MAX_CHARS } from './prompt';
import { InvalidNarrative, validateNarrative } from './validate';

describe('validateNarrative', () => {
  it('returns a trimmed single-paragraph reading', () => {
    expect(validateNarrative('  You are a very tidy cosmic omen.  ')).toBe(
      'You are a very tidy cosmic omen.',
    );
  });

  it('rejects non-string and empty replies', () => {
    expect(() => validateNarrative(null)).toThrow(InvalidNarrative);
    expect(() => validateNarrative('   ')).toThrow(/empty/i);
  });

  it('rejects multi-paragraph or line-broken replies', () => {
    expect(() => validateNarrative('First sentence.\nSecond sentence.')).toThrow(
      /single paragraph/i,
    );
  });

  it('rejects heading and list formatting', () => {
    expect(() => validateNarrative('# Your reading')).toThrow(/heading or list/i);
    expect(() => validateNarrative('- You are cosmic.')).toThrow(/heading or list/i);
    expect(() => validateNarrative('1. You are cosmic.')).toThrow(/heading or list/i);
  });

  it('rejects replies beyond the character ceiling', () => {
    expect(() => validateNarrative('x'.repeat(NARRATIVE_MAX_CHARS + 1))).toThrow(/exceeded/i);
  });
});
