import { describe, expect, it } from 'vitest';
import { parseInlineMarkdown } from './inlineMarkdown';

describe('parseInlineMarkdown', () => {
  it('parses safe inline emphasis', () => {
    expect(parseInlineMarkdown('Almost *off*, still human.')).toEqual([
      { kind: 'text', text: 'Almost ' },
      { kind: 'emphasis', text: 'off' },
      { kind: 'text', text: ', still human.' },
    ]);
  });

  it('treats unmatched markers as text', () => {
    expect(parseInlineMarkdown('A lonely * marker')).toEqual([
      { kind: 'text', text: 'A lonely * marker' },
    ]);
  });

  it('keeps escaped markers literal', () => {
    expect(parseInlineMarkdown('Use \\* as a star.')).toEqual([
      { kind: 'text', text: 'Use * as a star.' },
    ]);
  });
});
