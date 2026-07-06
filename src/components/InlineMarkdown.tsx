import { Fragment } from 'react';
import { parseInlineMarkdown } from '@/lib/inlineMarkdown';

export function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {parseInlineMarkdown(text).map((segment, index) =>
        segment.kind === 'emphasis' ? (
          <em key={index}>{segment.text}</em>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
