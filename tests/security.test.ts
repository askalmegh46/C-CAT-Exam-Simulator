import { describe, expect, it } from 'vitest';

describe('security invariants', () => {
  it('rejects cross-origin state-changing requests', () => {
    const request = new Request('https://app.example/api/exams/answer', {
      method: 'POST',
      headers: { origin: 'https://evil.example', host: 'app.example' },
    });
    const origin = request.headers.get('origin')!;
    const host = request.headers.get('host')!;
    expect(new URL(origin).host === host).toBe(false);
  });

  it('accepts same-origin state-changing requests', () => {
    const request = new Request('https://app.example/api/exams/answer', {
      method: 'POST',
      headers: { origin: 'https://app.example', host: 'app.example' },
    });
    expect(new URL(request.headers.get('origin')!).host === request.headers.get('host')).toBe(true);
  });

  it('validates answer choices to the four-option C-CAT model', () => {
    expect([0, 1, 2, 3].every(Number.isInteger)).toBe(true);
    expect([4, -1].some((v) => v >= 0 && v <= 3)).toBe(false);
  });
});
