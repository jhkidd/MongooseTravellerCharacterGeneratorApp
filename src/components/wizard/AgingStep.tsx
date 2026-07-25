import { Phase } from '../../engine/state-machine';
import { useCharacter } from '../../context/CharacterContext';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface AgingStepProps {
  phase: Phase;
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function AgingStep({ phase, context, onAdvance }: AgingStepProps) {
  const { character } = useCharacter();
  const nextAge = character.age + 4;
  const needsAgingRoll = nextAge >= 34;

  if (phase === Phase.RANK_BONUS) {
    return (
      <div>
        <ChamferedHeader>Promotion Benefit</ChamferedHeader>
        <p>You advanced this term. Rank-specific bonuses will be expanded in a future pass.</p>
        <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  if (phase === Phase.TERM_NARRATIVE) {
    return (
      <div>
        <ChamferedHeader>Term Summary</ChamferedHeader>
        <p>
          Term {context.currentTerm} in {context.currentCareer ?? 'your current path'} is complete.
        </p>
        <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>End of Term</ChamferedHeader>
      <p>Age advancing to {nextAge}.</p>
      {needsAgingRoll && (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Aging effects begin at 34 and will be expanded in a future update.
        </p>
      )}
      <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
        Continue
      </button>
    </div>
  );
}
