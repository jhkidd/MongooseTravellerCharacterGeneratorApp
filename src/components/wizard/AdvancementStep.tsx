import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM, roll2D6 } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { ChoicePanel } from '../shared/ChoicePanel';
import { tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface AdvancementStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

type RollResult = { roll: number; total: number; success: boolean };

export function AdvancementStep({ context, onAdvance }: AdvancementStepProps) {
  const { character } = useCharacter();
  const [choice, setChoice] = useState<'commission' | 'advancement' | null>(null);
  const [rollResult, setRollResult] = useState<RollResult | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const assignment = career?.assignments.find((option) => option.id === context.currentAssignment)
    ?? career?.assignments[0]
    ?? null;

  const commissionCheck = career?.commission ?? null;
  const advancementCheck = assignment?.advancementCheck ?? null;

  // Commission is available if the career has one, the traveller isn't already an officer,
  // hasn't already attempted this career, and it's the first term (unless SOC 9+)
  const canAttemptCommission = commissionCheck !== null
    && !context.isOfficer
    && !context.commissionAttempted
    && (context.termsInCurrentCareer <= 1 || character.characteristics.SOC >= 9);

  const commissionDM = commissionCheck
    ? getDM(character.characteristics[commissionCheck.characteristic])
    : 0;

  const advancementDM = (advancementCheck
    ? getDM(character.characteristics[advancementCheck.characteristic])
    : 0) + context.pendingAdvancementDM;

  function handleRoll() {
    if (effectiveChoice === 'commission' && commissionCheck) {
      const roll = roll2D6();
      const total = roll + commissionDM;
      setRollResult({ roll, total, success: total >= commissionCheck.target });
    } else if (effectiveChoice === 'advancement' && advancementCheck) {
      const roll = roll2D6();
      const total = roll + advancementDM;
      setRollResult({ roll, total, success: total >= advancementCheck.target });
    } else {
      onAdvance({ type: 'ROLL_FAILURE' });
    }
  }

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

  // If no commission available, skip straight to advancement choice
  const effectiveChoice = canAttemptCommission ? choice : 'advancement';

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
      {effectiveChoice && !rollResult && (
        <div>
          {effectiveChoice === 'commission' && commissionCheck && (
            <>
              <p>Roll {commissionCheck.characteristic} {commissionCheck.target}+ to earn a commission.</p>
              <SuccessChance baseTarget={commissionCheck.target} dm={commissionDM} label="Commission" />
            </>
          )}
          {effectiveChoice === 'advancement' && advancementCheck && (
            <>
              <p>Roll {advancementCheck.characteristic} {advancementCheck.target}+ to advance.</p>
              {context.pendingAdvancementDM !== 0 && (
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Term bonus: {context.pendingAdvancementDM > 0 ? '+' : ''}{context.pendingAdvancementDM} DM
                </p>
              )}
              <SuccessChance baseTarget={advancementCheck.target} dm={advancementDM} label="Advancement" />
            </>
          )}
          {effectiveChoice === 'advancement' && !advancementCheck && (
            <p>No advancement roll is available for this assignment.</p>
          )}
          <button type="button" onClick={handleRoll} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Roll
          </button>
        </div>
      )}

      {/* Result phase */}
      {rollResult && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ color: rollResult.success ? 'var(--color-success-text)' : 'var(--color-failure-text)' }}>
            Rolled {rollResult.roll}
            {(() => {
              const dm = effectiveChoice === 'commission' ? commissionDM : advancementDM;
              return dm !== 0 ? ` ${dm > 0 ? '+' : '−'} ${Math.abs(dm)}` : '';
            })()}
            {' = '}
            {rollResult.total}
            {rollResult.success
              ? (effectiveChoice === 'commission' ? ' — Commissioned!' : ' — Promoted!')
              : (effectiveChoice === 'commission' ? ' — Commission denied.' : ' — No promotion this term.')
            }
          </p>
          <button type="button" onClick={() => onAdvance({ type: rollResult.success ? (effectiveChoice === 'commission' ? 'COMMISSION_SUCCESS' : 'ROLL_SUCCESS') : 'ROLL_FAILURE' })} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
