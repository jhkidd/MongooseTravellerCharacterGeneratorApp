import { useCallback, useEffect, useState } from 'react';
import { rollD6 } from '../../../engine/dice';
import { Dice3D } from './Dice3D';
import './DiceGroup.css';

export interface DiceResult {
  die1: number;
  die2: number;
  total: number;
}

interface DiceGroupProps {
  /** Number of pairs to roll (e.g. 6 for characteristic generation). */
  count: number;
  /** Called with all results once every die has settled. */
  onResult: (results: DiceResult[]) => void;
  /** Optional heading label. */
  label?: string;
  /** If true, roll immediately on mount. */
  autoRoll?: boolean;
}

const BASE_SETTLE_DELAY = 800;
const STAGGER_PER_PAIR = 200;

export function DiceGroup({
  count,
  onResult,
  label,
  autoRoll = false,
}: DiceGroupProps) {
  const [results, setResults] = useState<DiceResult[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [settledCount, setSettledCount] = useState(0);

  const handleRoll = useCallback(() => {
    const newResults: DiceResult[] = [];

    for (let i = 0; i < count; i++) {
      const die1 = rollD6();
      const die2 = rollD6();
      newResults.push({ die1, die2, total: die1 + die2 });
    }

    setResults(newResults);
    setRolling(true);
    setSettledCount(0);
  }, [count]);

  useEffect(() => {
    if (autoRoll) {
      handleRoll();
    }
  }, [autoRoll, handleRoll]);

  const handleSettled = useCallback(() => {
    setSettledCount((prev) => {
      const next = prev + 1;

      if (next >= (results?.length ?? 0) * 2) {
        setRolling(false);

        if (results) {
          onResult(results);
        }
      }

      return next;
    });
  }, [onResult, results]);

  return (
    <div className="dice-group">
      {label && <div className="dice-group__label">{label}</div>}

      {results && (
        <div className="dice-group__pairs">
          {results.map((result, i) => (
            <div key={i} className="dice-group__pair">
              <Dice3D
                targetValue={result.die1}
                rolling={rolling}
                settleDelay={BASE_SETTLE_DELAY + i * STAGGER_PER_PAIR}
                onSettled={handleSettled}
              />
              <Dice3D
                targetValue={result.die2}
                rolling={rolling}
                settleDelay={BASE_SETTLE_DELAY + i * STAGGER_PER_PAIR + 100}
                onSettled={handleSettled}
              />
              <span className="dice-group__equals">=</span>
              <div className="dice-group__result">
                <span className="dice-group__result-value">{result.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="dice-group__roll-btn"
        onClick={handleRoll}
        disabled={rolling}
      >
        {rolling ? 'Rolling...' : 'Roll'}
      </button>
    </div>
  );
}
