import { afterEach, describe, expect, it } from 'vitest';
import { questions } from '@/data/questions';
import { POST } from './route';

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/result', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

function validBody() {
  return {
    selections: questions.map((q) => ({ questionId: q.id, optionId: q.options[0].id })),
  };
}

afterEach(() => {
  delete process.env.AI_PROVIDER;
});

describe('POST /api/result', () => {
  it('returns a generated narrative for a valid payload (mock provider)', async () => {
    const res = await post(validBody());
    expect(res.status).toBe(200);
    const data = (await res.json()) as { narrative: string };
    expect(typeof data.narrative).toBe('string');
    expect(data.narrative.length).toBeGreaterThan(0);
    // Winner recomputed server-side is the Grays for options[0] everywhere.
    expect(data.narrative).toContain('Grays');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await post('{ not json');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid payload with 400', async () => {
    const res = await post({ selections: [] });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/selections/i);
  });

  it('surfaces a provider failure as 502 (no silent fallback)', async () => {
    process.env.AI_PROVIDER = 'definitely-not-a-provider';
    const res = await post(validBody());
    expect(res.status).toBe(502);
    const data = (await res.json()) as { error: string };
    expect(data.error).toMatch(/narrative/i);
  });
});
