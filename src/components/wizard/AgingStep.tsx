import { useEffect, useRef } from 'react';
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
  const { character, dispatch } = useCharacter();
  const ageApplied = useRef(false);

  // Must be called unconditionally (rules of hooks)
  useEffect(() => {
    if (phase !== Phase.AGING_CHECK) return;
    if (ageApplied.current) return;
    ageApplied.current = true;
    dispatch({ type: 'INCREMENT_AGE', years: 4 });
  }, [phase, dispatch]);

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

  const newAge = character.age;
  const needsAgingRoll = newAge >= 34;

  return (
    <div>
      <ChamferedHeader>Aging</ChamferedHeader>
      <p>Your Traveller ages to {newAge}.</p>
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
