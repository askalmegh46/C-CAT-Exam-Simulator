import { describe, expect, it } from 'vitest';

function calculateScore(correct: number, wrong: number) {
  return correct * 3 - wrong;
}

function examDurationMinutes(mode: 'A' | 'B' | 'AB') {
  return mode === 'AB' ? 120 : 60;
}

describe('C-CAT scoring rules', () => {
  it('awards +3 for correct and -1 for wrong', () => {
    expect(calculateScore(10, 2)).toBe(28);
  });

  it('does not subtract unanswered questions', () => {
    expect(calculateScore(10, 0)).toBe(30);
  });

  it('uses 60 minutes for A and B', () => {
    expect(examDurationMinutes('A')).toBe(60);
    expect(examDurationMinutes('B')).toBe(60);
  });

  it('uses 120 minutes for the combined exam', () => {
    expect(examDurationMinutes('AB')).toBe(120);
  });
});
