import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { getDM, rollD6 } from '../../../engine/dice';
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
  /** When true, results are draggable in-place. */
  draggable?: boolean;
  /** Indices of results that have been consumed (assigned elsewhere). */
  consumedIndices?: Set<number>;
  /** Called when a result starts being dragged. */
  onResultDragStart?: (index: number, event: DragEvent<HTMLDivElement>) => void;
}

const BASE_SETTLE_DELAY = 800;
const STAGGER_PER_PAIR = 200;

export function DiceGroup({
  count,
  onResult,
  label,
  autoRoll = false,
  draggable: draggableResults = false,
  consumedIndices,
  onResultDragStart,
}: DiceGroupProps) {
  const [results, setResults] = useState<DiceResult[] | null>(null);
  const [rolling, setRolling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settledPairs, setSettledPairs] = useState<Set<number>>(new Set());
  const settledCountRef = useRef(0);
  const pairSettleCountRef = useRef<number[]>([]);
  const resultsRef = useRef<DiceResult[] | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const handleRoll = useCallback(() => {
    const newResults: DiceResult[] = [];

    for (let i = 0; i < count; i++) {
      const die1 = rollD6();
      const die2 = rollD6();
      newResults.push({ die1, die2, total: die1 + die2 });
    }

    resultsRef.current = newResults;
    setResults(newResults);
    setRolling(true);
    setSettled(false);
    setSettledPairs(new Set());
    settledCountRef.current = 0;
    pairSettleCountRef.current = new Array(count).fill(0);
  }, [count]);

  useEffect(() => {
    if (autoRoll) {
      handleRoll();
    }
  }, [autoRoll, handleRoll]);

  // Stable per-pair settle handlers that won't cause Dice3D useEffect to re-run
  const pairSettledHandlers = useMemo(() => {
    return Array.from({ length: count }, (_, pairIndex) => () => {
      pairSettleCountRef.current[pairIndex] += 1;
      if (pairSettleCountRef.current[pairIndex] >= 2) {
        setSettledPairs((prev) => new Set(prev).add(pairIndex));
      }

      settledCountRef.current += 1;
      const totalDice = (resultsRef.current?.length ?? 0) * 2;
      if (settledCountRef.current >= totalDice) {
        setRolling(false);
        setSettled(true);

        if (resultsRef.current) {
          onResultRef.current(resultsRef.current);
        }
      }
    });
  }, [count]);

  function handleDragStart(index: number, event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData('text/plain', index.toString());
    event.dataTransfer.effectAllowed = 'move';
    onResultDragStart?.(index, event);
  }

  function getDmClass(total: number): string {
    const dm = getDM(total);
    if (dm === 0) return '';
    const sign = dm > 0 ? 'plus' : 'minus';
    return ` dice-group__result--dm-${sign}${Math.abs(dm)}`;
  }

  return (
    <div className="dice-group">
      {label && <div className="dice-group__label">{label}</div>}

      {results && (
        <div className="dice-group__pairs">
          {results.map((result, i) => {
            const isConsumed = consumedIndices?.has(i) ?? false;
            const isPairSettled = settledPairs.has(i);
            const isDraggable = draggableResults && settled && !isConsumed;
            const showResult = isPairSettled && !isConsumed;

            return (
              <div
                key={i}
                className={`dice-group__pair${isConsumed ? ' dice-group__pair--consumed' : ''}`}
              >
                <Dice3D
                  targetValue={result.die1}
                  rolling={rolling}
                  settleDelay={BASE_SETTLE_DELAY + i * STAGGER_PER_PAIR}
                  onSettled={pairSettledHandlers[i]}
                />
                <Dice3D
                  targetValue={result.die2}
                  rolling={rolling}
                  settleDelay={BASE_SETTLE_DELAY + i * STAGGER_PER_PAIR + 100}
                  onSettled={pairSettledHandlers[i]}
                />
                <span className={`dice-group__equals${showResult ? '' : ' dice-group__equals--hidden'}`}>=</span>
                <div className={`dice-group__result-glow${showResult ? getDmClass(result.total) : ''}`}>
                  <div
                    className={`dice-group__result${showResult ? ' dice-group__result--revealed' : ' dice-group__result--hidden'}${isDraggable ? ' dice-group__result--draggable' : ''}`}
                    draggable={isDraggable}
                    onDragStart={isDraggable ? (e) => handleDragStart(i, e) : undefined}
                  >
                    <span className="dice-group__result-value">{result.total}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!settled && (
        <button
          type="button"
          className="dice-group__roll-btn"
          onClick={handleRoll}
          disabled={rolling}
        >
          {rolling ? 'Rolling...' : 'Roll'}
        </button>
      )}
    </div>
  );
}
