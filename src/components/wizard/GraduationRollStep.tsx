import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { DiceCheckRoll } from '../ui/Dice3D/DiceCheckRoll';
import type { DiceCheckDM, DiceCheckResult } from '../ui/Dice3D/DiceCheckRoll';
import type { PhaseAction } from '../../engine/state-machine';

interface GraduationRollStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function GraduationRollStep({ onAdvance }: GraduationRollStepProps) {
  const { character, dispatch } = useCharacter();
  const [result, setResult] = useState<DiceCheckResult | null>(null);
  const dm = getDM(character.characteristics.INT);
  const target = 7;

  const dms: DiceCheckDM[] = [];
  if (dm !== 0) {
    dms.push({ label: 'INT DM', value: dm });
  }

  function handleResult(r: DiceCheckResult) {
    setResult(r);
  }

  function handleContinue() {
    dispatch({ type: 'INCREMENT_AGE', years: 4 });
    onAdvance({ type: 'CONTINUE' });
  }

  return (
    <div>
      <ChamferedHeader>Graduation</ChamferedHeader>
      <SuccessChance baseTarget={target} dm={dm} label="Graduation" />

      {!result ? (
        <DiceCheckRoll
          target={target}
          dms={dms}
          label="Graduation"
          characteristic="INT"
          onResult={handleResult}
        />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: result.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
            {result.success ? 'Graduated!' : 'Did not graduate.'}
          </p>
          <button type="button" onClick={handleContinue} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
