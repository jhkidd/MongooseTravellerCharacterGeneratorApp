import { useMemo } from 'react';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { DiceCheckRoll } from '../ui/Dice3D/DiceCheckRoll';
import { useCharacter } from '../../context/CharacterContext';
import { getQualificationDM, getQualificationDMs, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface QualificationRollStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function QualificationRollStep({ context, onAdvance }: QualificationRollStepProps) {
  const { character } = useCharacter();

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const qualification = career?.qualification ?? null;
  const dm = getQualificationDM(qualification, character, context);
  const dms = useMemo(() => getQualificationDMs(qualification, character, context), [qualification, character, context]);

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
        <SuccessChance baseTarget={qualification.target} dm={dm} label="Qualification" />
      </div>

      <DiceCheckRoll
        target={qualification.target}
        dms={dms}
        label="Qualification"
        characteristic={qualification.characteristic}
        onResult={(result) => onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })}
      />
    </div>
  );
}
