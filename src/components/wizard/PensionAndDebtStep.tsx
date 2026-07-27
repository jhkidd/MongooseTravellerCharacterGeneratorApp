import { useCharacter } from '../../context/CharacterContext';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction } from '../../engine/state-machine';

interface PensionAndDebtStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function PensionAndDebtStep({ onAdvance }: PensionAndDebtStepProps) {
  const { character } = useCharacter();
  const totalTerms = character.currentTerm;
  const hasPension = totalTerms >= 5;

  return (
    <div>
      <ChamferedHeader>Pension &amp; Finances</ChamferedHeader>
      {hasPension ? (
        <p>
          With {totalTerms} terms of service, your Traveller qualifies for a pension.
          Pension payouts will be expanded in a future update.
        </p>
      ) : (
        <p>
          With {totalTerms} term(s) of service, your Traveller does not qualify for a pension
          (requires 5+ terms).
        </p>
      )}
      <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Medical debt tracking will be added in a future update.
      </p>
      <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
        Continue to Character Sheet
      </button>
    </div>
  );
}
