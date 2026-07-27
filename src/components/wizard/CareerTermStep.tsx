import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { Phase } from '../../engine/state-machine';
import { getDM } from '../../engine/dice';
import { ChoicePanel } from '../shared/ChoicePanel';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { DiceCheckRoll } from '../ui/Dice3D/DiceCheckRoll';
import { tryLoadCareer, getQualificationDMs } from './career-flow-utils';
import type { DiceCheckDM, DiceCheckResult } from '../ui/Dice3D/DiceCheckRoll';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface CareerTermStepProps {
  phase: Phase;
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function CareerTermStep({ phase, context, onAdvance }: CareerTermStepProps) {
  const { character } = useCharacter();
  const [survivalResult, setSurvivalResult] = useState<DiceCheckResult | null>(null);
  const [changeResult, setChangeResult] = useState<DiceCheckResult | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const assignment = career?.assignments.find((option) => option.id === context.currentAssignment) ?? null;
  const isDrifter = context.currentCareer === 'drifter' || !career;
  const survivalCheck = assignment?.survivalCheck;
  const survivalDM = survivalCheck ? getDM(character.characteristics[survivalCheck.characteristic]) : 0;

  // ASSIGNMENT_SELECTION phase
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

  // ASSIGNMENT_CHANGE_ROLL phase
  if (phase === Phase.ASSIGNMENT_CHANGE_ROLL) {
    const qualCheck = career?.qualification;
    const qualDM = qualCheck ? getDM(character.characteristics[qualCheck.characteristic]) : 0;
    const changeDMs = useMemo(() => getQualificationDMs(qualCheck, character, context), [qualCheck, character, context]);

    if (!qualCheck) {
      return (
        <div>
          <ChamferedHeader>Change Assignment</ChamferedHeader>
          <p>Transfer approved automatically.</p>
          <button type="button" onClick={() => onAdvance({ type: 'ROLL_SUCCESS' })} style={{ padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      );
    }

    return (
      <div>
        <ChamferedHeader>Change Assignment</ChamferedHeader>
        <p>
          Attempting to transfer to a new assignment within {career?.name ?? 'your career'}.
          {context.pendingAssignmentChange && ` Target: ${context.pendingAssignmentChange}`}
        </p>
        <SuccessChance baseTarget={qualCheck.target} dm={qualDM} label="Transfer" />

        {!changeResult ? (
          <DiceCheckRoll
            target={qualCheck.target}
            dms={changeDMs}
            label="Transfer"
            characteristic={qualCheck.characteristic}
            onResult={setChangeResult}
          />
        ) : (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: changeResult.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
              {changeResult.success ? 'Transfer approved!' : 'Transfer denied, staying in current assignment.'}
            </p>
            <button
              type="button"
              onClick={() => onAdvance({ type: changeResult.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })}
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

  const survivalDMs: DiceCheckDM[] = [];
  if (survivalDM !== 0) {
    survivalDMs.push({ label: `${survivalCheck.characteristic} DM`, value: survivalDM });
  }

  return (
    <div>
      <ChamferedHeader>
        {career?.name ?? 'Career'} — {assignment.name}
      </ChamferedHeader>
      <p>{assignment.description}</p>
      <SuccessChance baseTarget={survivalCheck.target} dm={survivalDM} label="Survival" />

      {!survivalResult ? (
        <DiceCheckRoll
          target={survivalCheck.target}
          dms={survivalDMs}
          label="Survival"
          characteristic={survivalCheck.characteristic}
          onResult={setSurvivalResult}
        />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: survivalResult.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
            {survivalResult.success ? 'Survived!' : 'Mishap!'}
          </p>
          <button
            type="button"
            onClick={() => onAdvance({ type: survivalResult.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            {survivalResult.success ? 'Continue to Events' : 'Continue to Mishap'}
          </button>
        </div>
      )}
    </div>
  );
}
