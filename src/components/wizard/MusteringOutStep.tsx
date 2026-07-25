import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { rollD6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface MusteringOutStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

const FALLBACK_CASH: Record<number, number> = {
  1: 1000,
  2: 2000,
  3: 5000,
  4: 5000,
  5: 10000,
  6: 10000,
  7: 20000,
};

export function MusteringOutStep({ context, onAdvance }: MusteringOutStepProps) {
  const { character, dispatch } = useCharacter();
  const [rolls, setRolls] = useState<number[]>([]);
  const benefitRolls = Math.max(1, character.currentTerm);
  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const cashTable = career?.musteringOut.cash ?? FALLBACK_CASH;

  function handleRollBenefit() {
    const rawRoll = rollD6();
    const adjustedRoll = Math.max(1, Math.min(7, rawRoll + character.benefitDMs));
    const amount = cashTable[adjustedRoll] ?? FALLBACK_CASH[adjustedRoll] ?? 0;

    setRolls((current) => [...current, adjustedRoll]);
    dispatch({ type: 'ADD_CASH', amount });
  }

  return (
    <div>
      <ChamferedHeader>Mustering Out</ChamferedHeader>
      <p>
        You have completed {character.currentTerm} term(s) and are mustering out from {getCareerDisplayName(context.currentCareer)}.
      </p>
      <p>Cash so far: Cr{character.cash.toLocaleString()}</p>
      <p>Benefit rolls remaining: {Math.max(0, benefitRolls - rolls.length)}</p>

      <button
        type="button"
        onClick={handleRollBenefit}
        disabled={rolls.length >= benefitRolls}
        style={{ margin: '0.5rem 0', padding: '0.5rem 1.5rem' }}
      >
        Roll Cash Benefit
      </button>

      {rolls.length > 0 && (
        <p>Cash rolls: {rolls.join(', ')}</p>
      )}

      <button
        type="button"
        onClick={() => onAdvance({ type: 'CONTINUE' })}
        style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}
      >
        Finish Mustering Out
      </button>
    </div>
  );
}
