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

  // ASSIGNMENT_SELECTION phase — choose which assignment to enter
  if (phase === Phase.ASSIGNMENT_SELECTION) {
    if (isDrifter) {
      return (
        <div>
          <ChamferedHeader>Drifter Assignment</ChamferedHeader>
          <p>Choose how you drift through this term.</p>
          <ChoicePanel
            prompt="Choose your drifter lifestyle."
            options={career ? career.assignments.map((option) => ({
              label: option.name,
              description: option.description,
            })) : [
              { label: 'Barbarian', description: 'Living off the land on primitive worlds.' },
              { label: 'Wanderer', description: 'Travelling from place to place.' },
              { label: 'Scavenger', description: 'Picking through the remains of civilisation.' },
            ]}
            onSelect={(index) => {
              const id = career ? career.assignments[index].id : ['barbarian', 'wanderer', 'scavenger'][index];
              onAdvance({ type: 'SELECT_ASSIGNMENT', assignmentId: id });
            }}
          />
        </div>
      );
    }

    return (
      <div>
        <ChamferedHeader>{career.name} — Choose Assignment</ChamferedHeader>
        <ChoicePanel
          prompt={`Choose your ${career.name.toLowerCase()} assignment for this career.`}
          options={career.assignments.map((option) => ({
            label: option.name,
            description: option.description,
          }))}
          onSelect={(index) => onAdvance({ type: 'SELECT_ASSIGNMENT', assignmentId: career.assignments[index].id })}
        />
      </div>
    );
  }

  // ASSIGNMENT_CHANGE_ROLL phase — attempting to switch assignment in a flexible career
  if (phase === Phase.ASSIGNMENT_CHANGE_ROLL) {
    const qualCheck = career?.qualification;
    const qualDM = qualCheck ? getDM(character.characteristics[qualCheck.characteristic]) : 0;

    function handleChangeRoll() {
      if (!qualCheck) {
        onAdvance({ type: 'ROLL_SUCCESS' });
        return;
      }
      const roll = roll2D6();
      const total = roll + qualDM;
      setResult({ roll, total, success: total >= qualCheck.target });
    }

    return (
      <div>
        <ChamferedHeader>Change Assignment</ChamferedHeader>
        <p>
          Attempting to transfer to a new assignment within {career?.name ?? 'your career'}.
          {context.pendingAssignmentChange && ` Target: ${context.pendingAssignmentChange}`}
        </p>

        {!result && qualCheck && (
          <div>
            <p>Qualification: {qualCheck.characteristic} {qualCheck.target}+</p>
            <SuccessChance baseTarget={qualCheck.target} dm={qualDM} label="Transfer" />
            <button type="button" onClick={handleChangeRoll} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
              Roll for Transfer
            </button>
          </div>
        )}

        {result && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: result.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
              Rolled {result.roll}
              {qualDM !== 0 && ` ${qualDM > 0 ? '+' : '−'} ${Math.abs(qualDM)}`}
              {' = '}
              {result.total}
              {result.success ? ' — Transfer approved!' : ' — Transfer denied, staying in current assignment.'}
            </p>
            <button
              type="button"
              onClick={() => onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })}
              style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  // SURVIVAL_ROLL phase
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

  function handleSurvivalRoll() {
    if (!survivalCheck) {
      onAdvance({ type: 'ROLL_SUCCESS' });
      return;
    }

    const roll = roll2D6();
    const total = roll + survivalDM;
    setResult({ roll, total, success: total >= survivalCheck.target });
  }
}
