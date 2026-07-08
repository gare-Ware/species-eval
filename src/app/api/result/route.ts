// app/api/result/route.ts
// The one server route: holds the AI key server-side, recomputes the winner
// from the client's answer selections, and returns a personalized narrative.
//
// By design there is NO silent fallback to the authored description here: if the
// provider fails we surface an error (502) and the client reveals an honest
// error state. A generic description dressed up as "your result" would undercut
// the whole personalized payoff.

import { NextResponse } from 'next/server';
import { getNarrativeProvider } from '@/lib/narrative/providers';
import { buildNarrativeInput, InvalidNarrativeRequest } from '@/lib/narrative/reconstruct';
import type { NarrativeResponse } from '@/lib/narrative/types';
import { validateNarrative } from '@/lib/narrative/validate';

// The Anthropic SDK needs the Node runtime, not edge.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  let input;
  try {
    input = buildNarrativeInput(body);
  } catch (err) {
    if (err instanceof InvalidNarrativeRequest) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  try {
    const provider = getNarrativeProvider();
    const raw = await provider.generateResultNarrative(input);
    const narrative = validateNarrative(raw);
    return NextResponse.json({ narrative } satisfies NarrativeResponse);
  } catch (err) {
    console.error('[api/result] narrative generation failed', err);
    return NextResponse.json({ error: 'Could not generate a result narrative.' }, { status: 502 });
  }
}
