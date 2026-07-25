import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM, roll2D6 } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface AdvancementStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function AdvancementStep({ context, onAdvance }: AdvancementStepProps) {
  const { character } = useCharacter();
  const [result, setResult] = useState<{ roll: number; total: number; success: boolean } | null>(null);
  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const assignment = career?.assignments.find((option) => option.id === context.currentAssignment)
    ?? career?.assignments[0]
    ?? null;
  const advancementCheck = assignment?.advancementCheck;
  const dm = (advancementCheck ? getDM(character.characteristics[advancementCheck.characteristic]) : 0)
    + context.pendingAdvancementDM;

  function handleRoll() {
    if (!advancementCheck) {
      onAdvance({ type: 'ROLL_FAILURE' });
      return;
    }

    const roll = roll2D6();
    const total = roll + dm;
    setResult({ roll, total, success: total >= advancementCheck.target });
  }

  if (context.autoPromote) {
    return (
      <div>
        <ChamferedHeader>Advancement</ChamferedHeader>
        <p style={{ color: 'var(--color-success-text)' }}>
          This term grants an automatic promotion or commission.
        </p>
        <button type="button" onClick={() => onAdvance({ type: 'ROLL_SUCCESS' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>Advancement</ChamferedHeader>
      {advancementCheck ? (
        <div>
          <p>Roll {advancementCheck.characteristic} {advancementCheck.target}+ to advance.</p>
          {context.pendingAdvancementDM !== 0 && (
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Term bonus: {context.pendingAdvancementDM > 0 ? '+' : ''}{context.pendingAdvancementDM} DM
            </p>
          )}
          <SuccessChance baseTarget={advancementCheck.target} dm={dm} label="Advancement" />
        </div>
      ) : (
        <p>No advancement roll is available for this assignment.</p>
      )}

      {!result && (
        <button type="button" onClick={handleRoll} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Roll for Advancement
        </button>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: result.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
            Rolled {result.roll}
            {dm !== 0 && ` ${dm > 0 ? '+' : '−'} ${Math.abs(dm)}`}
            {' = '}
            {result.total}
            {result.success ? ' — Promoted!' : ' — No promotion this term.'}
          </p>
          <button type="button" onClick={() => onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
