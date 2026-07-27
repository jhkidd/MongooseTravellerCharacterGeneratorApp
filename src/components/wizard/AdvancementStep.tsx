import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { ChoicePanel } from '../shared/ChoicePanel';
import { DiceCheckRoll } from '../ui/Dice3D/DiceCheckRoll';
import { tryLoadCareer } from './career-flow-utils';
import type { DiceCheckDM, DiceCheckResult } from '../ui/Dice3D/DiceCheckRoll';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface AdvancementStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function AdvancementStep({ context, onAdvance }: AdvancementStepProps) {
  const { character } = useCharacter();
  const [choice, setChoice] = useState<'commission' | 'advancement' | null>(null);
  const [rollResult, setRollResult] = useState<DiceCheckResult | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const assignment = career?.assignments.find((option) => option.id === context.currentAssignment)
    ?? career?.assignments[0]
    ?? null;

  const commissionCheck = career?.commission ?? null;
  const advancementCheck = assignment?.advancementCheck ?? null;

  const canAttemptCommission = commissionCheck !== null
    && !context.isOfficer
    && !context.commissionAttempted
    && (context.termsInCurrentCareer <= 1 || character.characteristics.SOC >= 9);

  const commissionDM = commissionCheck
    ? getDM(character.characteristics[commissionCheck.characteristic])
    : 0;

  const advancementCharDM = advancementCheck
    ? getDM(character.characteristics[advancementCheck.characteristic])
    : 0;

  // If no commission available, skip straight to advancement choice
  const effectiveChoice = canAttemptCommission ? choice : 'advancement';

  // Build itemised DMs for the current choice
  const currentDMs: DiceCheckDM[] = useMemo(() => {
    if (effectiveChoice === 'commission' && commissionCheck) {
      const items: DiceCheckDM[] = [];
      if (commissionDM !== 0) {
        items.push({ label: `${commissionCheck.characteristic} DM`, value: commissionDM });
      }
      return items;
    }
    if (effectiveChoice === 'advancement' && advancementCheck) {
      const items: DiceCheckDM[] = [];
      if (advancementCharDM !== 0) {
        items.push({ label: `${advancementCheck.characteristic} DM`, value: advancementCharDM });
      }
      if (context.pendingAdvancementDM !== 0) {
        items.push({ label: 'Term bonus', value: context.pendingAdvancementDM });
      }
      return items;
    }
    return [];
  }, [effectiveChoice, commissionCheck, commissionDM, advancementCheck, advancementCharDM, context.pendingAdvancementDM]);

  const totalDM = currentDMs.reduce((sum, dm) => sum + dm.value, 0);
  const currentCheck = effectiveChoice === 'commission' ? commissionCheck : advancementCheck;

  if (context.autoPromote) {
    return (
      <div>
        <ChamferedHeader>Advancement</ChamferedHeader>
        <p style={{ color: 'var(--color-success-text)' }}>
          This term grants an automatic promotion.
        </p>
        <button type="button" onClick={() => onAdvance({ type: 'ROLL_SUCCESS' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>Commission &amp; Advancement</ChamferedHeader>

      {/* Choice phase: commission or advancement */}
      {!effectiveChoice && canAttemptCommission && (
        <ChoicePanel
          prompt="Would you like to attempt a commission or roll for advancement?"
          options={[
            {
              label: `Attempt Commission (${commissionCheck!.characteristic} ${commissionCheck!.target}+)`,
              description: 'Earn officer status in your career',
            },
            {
              label: `Roll for Advancement${advancementCheck ? ` (${advancementCheck.characteristic} ${advancementCheck.target}+)` : ''}`,
              description: 'Attempt a promotion in rank',
            },
          ]}
          onSelect={(index) => setChoice(index === 0 ? 'commission' : 'advancement')}
        />
      )}

      {/* Roll phase */}
      {effectiveChoice && !rollResult && currentCheck && (
        <div>
          <SuccessChance
            baseTarget={currentCheck.target}
            dm={totalDM}
            label={effectiveChoice === 'commission' ? 'Commission' : 'Advancement'}
          />
          <DiceCheckRoll
            target={currentCheck.target}
            dms={currentDMs}
            label={effectiveChoice === 'commission' ? 'Commission' : 'Advancement'}
            characteristic={currentCheck.characteristic}
            onResult={setRollResult}
          />
        </div>
      )}

      {/* No advancement check available */}
      {effectiveChoice === 'advancement' && !advancementCheck && !rollResult && (
        <div>
          <p>No advancement roll is available for this assignment.</p>
          <button type="button" onClick={() => onAdvance({ type: 'ROLL_FAILURE' })} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}

      {/* Result phase */}
      {rollResult && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: rollResult.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
            {rollResult.success
              ? (effectiveChoice === 'commission' ? 'Commissioned!' : 'Promoted!')
              : (effectiveChoice === 'commission' ? 'Commission denied.' : 'No promotion this term.')
            }
          </p>
          <button
            type="button"
            onClick={() => onAdvance({
              type: rollResult.success
                ? (effectiveChoice === 'commission' ? 'COMMISSION_SUCCESS' : 'ROLL_SUCCESS')
                : 'ROLL_FAILURE',
            })}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
