import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { Phase } from '../../engine/state-machine';
import { getDM, roll2D6 } from '../../engine/dice';
import { ChoicePanel } from '../shared/ChoicePanel';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface CareerTermStepProps {
  phase: Phase;
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function CareerTermStep({ phase, context, onAdvance }: CareerTermStepProps) {
  const { character } = useCharacter();
  const [result, setResult] = useState<{ roll: number; total: number; success: boolean } | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const assignment = career?.assignments.find((option) => option.id === context.currentAssignment) ?? null;
  const isDrifter = context.currentCareer === 'drifter' || !career;
  const survivalCheck = assignment?.survivalCheck;
  const survivalDM = survivalCheck ? getDM(character.characteristics[survivalCheck.characteristic]) : 0;

  function handleSurvivalRoll() {
    if (!survivalCheck) {
      onAdvance({ type: 'ROLL_SUCCESS' });
      return;
    }

    const roll = roll2D6();
    const total = roll + survivalDM;
    setResult({ roll, total, success: total >= survivalCheck.target });
  }

  if (phase === Phase.CAREER_ACTIVE) {
    if (isDrifter) {
      return (
        <div>
          <ChamferedHeader>Drifter Term</ChamferedHeader>
          <p>This term you drift from job to job, taking what work you can find.</p>
          <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
            Begin Term
          </button>
        </div>
      );
    }

    return (
      <div>
        <ChamferedHeader>{career.name} Assignment</ChamferedHeader>
        <ChoicePanel
          prompt={`Choose your ${career.name.toLowerCase()} assignment for term ${context.currentTerm}.`}
          options={career.assignments.map((option) => ({
            label: option.name,
            description: option.description,
          }))}
          onSelect={(index) => onAdvance({ type: 'SELECT_ASSIGNMENT', assignmentId: career.assignments[index].id })}
        />
      </div>
    );
  }

  if (isDrifter) {
    return (
      <div>
        <ChamferedHeader>Drifter Survival</ChamferedHeader>
        <p>You scrape by and make it to the end of the term.</p>
        <button type="button" onClick={() => onAdvance({ type: 'ROLL_SUCCESS' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue to Events
        </button>
      </div>
    );
  }

  if (!assignment || !survivalCheck) {
    return (
      <div>
        <ChamferedHeader>{career?.name ?? 'Career'} Term</ChamferedHeader>
        <p>Assignment data is unavailable for this term.</p>
        <button type="button" onClick={() => onAdvance({ type: 'ROLL_SUCCESS' })}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>
        {career?.name ?? 'Career'} — {assignment.name}
      </ChamferedHeader>

      {!result && (
        <div>
          <p>{assignment.description}</p>
          <p>Survival Check: {survivalCheck.characteristic} {survivalCheck.target}+</p>
          <SuccessChance baseTarget={survivalCheck.target} dm={survivalDM} label="Survival" />
          <button type="button" onClick={handleSurvivalRoll} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
            Roll for Survival
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: result.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
            Rolled {result.roll}
            {survivalDM !== 0 && ` ${survivalDM > 0 ? '+' : '−'} ${Math.abs(survivalDM)}`}
            {' = '}
            {result.total}
            {result.success ? ' — Survived!' : ' — Mishap!'}
          </p>
          <button
            type="button"
            onClick={() => onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            {result.success ? 'Continue to Events' : 'Continue to Mishap'}
          </button>
        </div>
      )}
    </div>
  );
}
