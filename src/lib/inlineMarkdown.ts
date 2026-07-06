export type InlineMarkdownSegment =
  | { kind: 'text'; text: string }
  | { kind: 'emphasis'; text: string };

function pushSegment(
  segments: InlineMarkdownSegment[],
  kind: InlineMarkdownSegment['kind'],
  text: string,
) {
  if (!text) return;

  const last = segments[segments.length - 1];
  if (last?.kind === kind) {
    last.text += text;
    return;
  }

  segments.push({ kind, text });
}

// Deliberately tiny: species prose supports only safe inline emphasis (`*word*`).
// No HTML is accepted or emitted, so future generated copy stays inert by default.
export function parseInlineMarkdown(input: string): InlineMarkdownSegment[] {
  const segments: InlineMarkdownSegment[] = [];
  let text = '';
  let emphasis = '';
  let inEmphasis = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '\\' && next === '*') {
      if (inEmphasis) emphasis += '*';
      else text += '*';
      i += 1;
      continue;
    }

    if (char === '*') {
      if (inEmphasis) {
        if (emphasis) {
          pushSegment(segments, 'text', text);
          pushSegment(segments, 'emphasis', emphasis);
          text = '';
        } else {
          text += '**';
        }
        emphasis = '';
        inEmphasis = false;
      } else {
        pushSegment(segments, 'text', text);
        text = '';
        inEmphasis = true;
      }
      continue;
    }

    if (inEmphasis) emphasis += char;
    else text += char;
  }

  if (inEmphasis) {
    text += `*${emphasis}`;
  }

  pushSegment(segments, 'text', text);
  return segments;
}
