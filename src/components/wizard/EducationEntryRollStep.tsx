import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM, roll2D6 } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction } from '../../engine/state-machine';

interface EducationEntryRollStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function EducationEntryRollStep({ onAdvance }: EducationEntryRollStepProps) {
  const { character } = useCharacter();
  const [result, setResult] = useState<{ total: number; success: boolean; roll: number } | null>(null);
  const dm = getDM(character.characteristics.EDU);
  const target = 6;

  return (
    <div>
      <ChamferedHeader>Education Entry</ChamferedHeader>
      <p>Roll EDU {target}+ to succeed in your chosen pre-career education.</p>
      <SuccessChance baseTarget={target} dm={dm} label="Entry" />

      {!result ? (
        <button type="button" onClick={() => {
          const roll = roll2D6();
          const total = roll + dm;
          setResult({ roll, total, success: total >= target });
        }} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Roll for Entry
        </button>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p>
            Rolled {result.roll}
            {dm !== 0 && ` ${dm > 0 ? '+' : '−'} ${Math.abs(dm)}`}
            {' = '}
            {result.total}
            {result.success ? ' — Accepted!' : ' — Rejected.'}
          </p>
          <button type="button" onClick={() => onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
