import { rollD6, roll2D6, getDM, getSuccessChance, getEffectiveTarget } from '../dice';

describe('rollD6', () => {
  it('returns a value between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD6();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('returns an integer', () => {
    const result = rollD6();
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('roll2D6', () => {
  it('returns a value between 2 and 12', () => {
    for (let i = 0; i < 100; i++) {
      const result = roll2D6();
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  it('returns an integer', () => {
    const result = roll2D6();
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('getDM', () => {
  it.each([
    [0, -3],
    [1, -2],
    [2, -2],
    [3, -1],
    [4, -1],
    [5, -1],
    [6, 0],
    [7, 0],
    [8, 0],
    [9, 1],
    [10, 1],
    [11, 1],
    [12, 2],
    [13, 2],
    [14, 2],
    [15, 3],
    [20, 3],
  ])('getDM(%i) returns %i', (score, expected) => {
    expect(getDM(score)).toBe(expected);
  });
});

describe('getSuccessChance', () => {
  it.each([
    [2, 100],
    [3, 97],
    [4, 92],
    [5, 83],
    [6, 72],
    [7, 58],
    [8, 42],
    [9, 28],
    [10, 17],
    [11, 8],
    [12, 3],
  ])('getSuccessChance(%i) returns %i%%', (target, expected) => {
    expect(getSuccessChance(target)).toBe(expected);
  });

  it('returns 100 for targets <= 2', () => {
    expect(getSuccessChance(1)).toBe(100);
    expect(getSuccessChance(0)).toBe(100);
    expect(getSuccessChance(-1)).toBe(100);
  });

  it('returns 0 for targets > 12', () => {
    expect(getSuccessChance(13)).toBe(0);
    expect(getSuccessChance(15)).toBe(0);
  });
});

describe('getEffectiveTarget', () => {
  it('subtracts DM from base target', () => {
    expect(getEffectiveTarget(8, 1)).toBe(7);
    expect(getEffectiveTarget(8, -1)).toBe(9);
    expect(getEffectiveTarget(6, 0)).toBe(6);
  });

  it('clamps to 2-12 range', () => {
    expect(getEffectiveTarget(5, 10)).toBe(2);
    expect(getEffectiveTarget(10, -5)).toBe(12);
  });
});
