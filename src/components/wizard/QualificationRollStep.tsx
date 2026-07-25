import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { roll2D6 } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getQualificationDM, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface QualificationRollStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function QualificationRollStep({ context, onAdvance }: QualificationRollStepProps) {
  const { character } = useCharacter();
  const [result, setResult] = useState<{ roll: number; success: boolean; total: number } | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const qualification = career?.qualification ?? null;
  const dm = getQualificationDM(qualification, character, context);

  function handleRoll() {
    if (!qualification) {
      return;
    }

    const roll = roll2D6();
    const total = roll + dm;
    setResult({ roll, total, success: total >= qualification.target });
  }

  function handleContinue() {
    if (!result) {
      return;
    }

    onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' });
  }

  if (!career || !qualification) {
    return (
      <div>
        <ChamferedHeader>Qualification</ChamferedHeader>
        <p>No qualification roll is required for this career.</p>
        <button type="button" onClick={() => onAdvance({ type: 'ROLL_SUCCESS' })}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>Qualification: {career.name}</ChamferedHeader>
      <div style={{ marginBottom: '1rem' }}>
        <p>Roll {qualification.characteristic} {qualification.target}+ to qualify.</p>
        <SuccessChance baseTarget={qualification.target} dm={dm} label="Qualification" />
      </div>

      {!result && (
        <button type="button" onClick={handleRoll} style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>
          Roll for Qualification
        </button>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <p>
            Rolled {result.roll}
            {dm !== 0 && ` ${dm > 0 ? '+' : '−'} ${Math.abs(dm)}`}
            {' = '}
            {result.total}
            {result.success ? ' — Qualified!' : ' — Failed to qualify.'}
          </p>
          <button type="button" onClick={handleContinue} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
