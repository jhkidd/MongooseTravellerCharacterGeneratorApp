import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM, roll2D6 } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction } from '../../engine/state-machine';

interface GraduationRollStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function GraduationRollStep({ onAdvance }: GraduationRollStepProps) {
  const { character } = useCharacter();
  const [result, setResult] = useState<{ total: number; success: boolean; roll: number } | null>(null);
  const dm = getDM(character.characteristics.INT);
  const target = 7;

  return (
    <div>
      <ChamferedHeader>Graduation</ChamferedHeader>
      <p>Roll INT {target}+ to graduate successfully from your education term.</p>
      <SuccessChance baseTarget={target} dm={dm} label="Graduation" />

      {!result ? (
        <button type="button" onClick={() => {
          const roll = roll2D6();
          const total = roll + dm;
          setResult({ roll, total, success: total >= target });
        }} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Roll for Graduation
        </button>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p>
            Rolled {result.roll}
            {dm !== 0 && ` ${dm > 0 ? '+' : '−'} ${Math.abs(dm)}`}
            {' = '}
            {result.total}
            {result.success ? ' — Graduated!' : ' — Did not graduate.'}
          </p>
          <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
