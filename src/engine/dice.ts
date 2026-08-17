/** Roll a single D6 (1–6). */
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** Roll 2D6 (2–12). */
export function roll2D6(): number {
  return rollD6() + rollD6();
}

/** Roll a D3 (1–3), per the Traveller convention of a D6 halved and rounded up. */
export function rollD3(): number {
  return Math.ceil(rollD6() / 2);
}

/**
 * Mongoose Traveller 2e Dice Modifier table.
 * Score 0 → -3, 1-2 → -2, 3-5 → -1, 6-8 → 0, 9-11 → +1, 12-14 → +2, 15+ → +3
 */
export function getDM(score: number): number {
  if (score <= 0) return -3;
  if (score <= 2) return -2;
  if (score <= 5) return -1;
  if (score <= 8) return 0;
  if (score <= 11) return 1;
  if (score <= 14) return 2;
  return 3;
}

/**
 * Cumulative probability of rolling `target` or higher on 2D6.
 * Returns a rounded percentage (0–100).
 */
const WAYS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

export function getSuccessChance(target: number): number {
  if (target <= 2) return 100;
  if (target > 12) return 0;
  let ways = 0;
  for (let i = target; i <= 12; i++) {
    ways += WAYS[i];
  }
  return Math.round((ways / 36) * 100);
}

/**
 * Calculate the effective target number after applying DM.
 * effectiveTarget = baseTarget - dm, clamped to [2, 12].
 */
export function getEffectiveTarget(baseTarget: number, dm: number): number {
  return Math.max(2, Math.min(12, baseTarget - dm));
}
