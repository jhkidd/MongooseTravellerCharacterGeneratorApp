import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { DiceCheckRoll } from '../ui/Dice3D/DiceCheckRoll';
import type { DiceCheckDM } from '../ui/Dice3D/DiceCheckRoll';
import type { PhaseAction } from '../../engine/state-machine';

interface EducationEntryRollStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function EducationEntryRollStep({ onAdvance }: EducationEntryRollStepProps) {
  const { character } = useCharacter();
  const dm = getDM(character.characteristics.EDU);
  const target = 6;

  const dms: DiceCheckDM[] = [];
  if (dm !== 0) {
    dms.push({ label: 'EDU DM', value: dm });
  }

  return (
    <div>
      <ChamferedHeader>Education Entry</ChamferedHeader>
      <SuccessChance baseTarget={target} dm={dm} label="Entry" />

      <DiceCheckRoll
        target={target}
        dms={dms}
        label="Entry"
        characteristic="EDU"
        onResult={(result) => onAdvance({ type: result.success ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })}
      />
    </div>
  );
}
