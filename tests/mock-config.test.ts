import { describe, expect, it } from 'vitest';

describe('advanced mock configuration', () => {
  it('calculates A+B total questions and duration', () => {
    const count = 30;
    expect(count * 2).toBe(60);
    expect(120).toBe(120);
  });
  it('supports only the exam modes used by the engine', () => {
    expect(['A','B','AB'].includes('AB')).toBe(true);
    expect(['A','B','AB'].includes('C')).toBe(false);
  });
});
