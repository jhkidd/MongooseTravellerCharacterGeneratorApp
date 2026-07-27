import { useCallback, useMemo, useRef, useState } from 'react';
import { rollD6 } from '../../../engine/dice';
import { Dice3D } from './Dice3D';
import './DiceCheckRoll.css';

export interface DiceCheckDM {
  label: string;
  value: number;
}

export interface DiceCheckResult {
  die1: number;
  die2: number;
  raw: number;
  total: number;
  success: boolean;
}

interface DiceCheckRollProps {
  /** Target number to meet or exceed (e.g. 8 for "8+"). */
  target: number;
  /** Itemised list of all DMs applying to this roll. */
  dms: DiceCheckDM[];
  /** Roll label, e.g. "Survival", "Qualification". */
  label: string;
  /** Characteristic abbreviation shown in the check description, e.g. "END". */
  characteristic?: string;
  /** Called when the player clicks Continue after seeing the result. */
  onResult: (result: DiceCheckResult) => void;
}

const SETTLE_DELAY_1 = 800;
const SETTLE_DELAY_2 = 900;
const REVEAL_DELAY = 400;

export function DiceCheckRoll({
  target,
  dms,
  label,
  characteristic,
  onResult,
}: DiceCheckRollProps) {
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<{ die1: number; die2: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const settledCountRef = useRef(0);

  const totalDM = useMemo(() => dms.reduce((sum, dm) => sum + dm.value, 0), [dms]);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const handleSettle = useCallback(() => {
    settledCountRef.current += 1;
    if (settledCountRef.current >= 2) {
      setTimeout(() => setRevealed(true), REVEAL_DELAY);
    }
  }, []);

  function handleRoll() {
    const die1 = rollD6();
    const die2 = rollD6();
    setDice({ die1, die2 });
    setRolling(true);
    setRevealed(false);
    settledCountRef.current = 0;
  }

  function handleContinue() {
    if (!dice) return;
    const raw = dice.die1 + dice.die2;
    const total = raw + totalDM;
    onResultRef.current({
      die1: dice.die1,
      die2: dice.die2,
      raw,
      total,
      success: total >= target,
    });
  }

  const raw = dice ? dice.die1 + dice.die2 : 0;
  const total = raw + totalDM;
  const success = total >= target;

  return (
    <div className="dice-check">
      {/* Check description */}
      <p className="dice-check__description">
        {label}: {characteristic && `${characteristic} `}{target}+
      </p>

      {/* Itemised DM list */}
      {dms.length > 0 && (
        <ul className="dice-check__dm-list">
          {dms.map((dm, i) => (
            <li key={i} className={`dice-check__dm-item${dm.value >= 0 ? ' dice-check__dm-item--positive' : ' dice-check__dm-item--negative'}`}>
              {dm.label}: {dm.value >= 0 ? '+' : ''}{dm.value}
            </li>
          ))}
          {dms.length > 1 && (
            <li className="dice-check__dm-total">
              Total DM: {totalDM >= 0 ? '+' : ''}{totalDM}
            </li>
          )}
        </ul>
      )}

      {/* Dice area */}
      {dice && (
        <div className="dice-check__dice-area">
          <Dice3D
            targetValue={dice.die1}
            rolling={rolling}
            settleDelay={SETTLE_DELAY_1}
            onSettled={handleSettle}
          />
          <Dice3D
            targetValue={dice.die2}
            rolling={rolling}
            settleDelay={SETTLE_DELAY_2}
            onSettled={handleSettle}
          />
        </div>
      )}

      {/* Roll button */}
      {!dice && (
        <button
          type="button"
          className="dice-check__roll-btn"
          onClick={handleRoll}
        >
          Roll
        </button>
      )}

      {/* Result reveal */}
      {revealed && dice && (
        <div className={`dice-check__result${success ? ' dice-check__result--success' : ' dice-check__result--failure'}`}>
          <span className="dice-check__result-breakdown">
            {raw}
            {totalDM !== 0 && (
              <span className="dice-check__result-dm">
                {' '}{totalDM > 0 ? '+' : '\u2212'}{' '}{Math.abs(totalDM)}{' = '}{total}
              </span>
            )}
          </span>
          <span className="dice-check__result-label">
            {success ? 'Success!' : 'Failed.'}
          </span>
        </div>
      )}

      {/* Continue button */}
      {revealed && (
        <button
          type="button"
          className="dice-check__continue-btn"
          onClick={handleContinue}
        >
          Continue
        </button>
      )}
    </div>
  );
}
