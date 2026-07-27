import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM, roll2D6 } from '../../engine/dice';
import { SuccessChance } from '../ui/SuccessChance/SuccessChance';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface AdvancementStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

type RollResult = { roll: number; total: number; success: boolean };

export function AdvancementStep({ context, onAdvance }: AdvancementStepProps) {
  const { character } = useCharacter();
  const [commissionResult, setCommissionResult] = useState<RollResult | null>(null);
  const [advancementResult, setAdvancementResult] = useState<RollResult | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const assignment = career?.assignments.find((option) => option.id === context.currentAssignment)
    ?? career?.assignments[0]
    ?? null;

  const commissionCheck = career?.commission ?? null;
  const advancementCheck = assignment?.advancementCheck ?? null;

  // Commission is available if the career has one, the traveller isn't already an officer,
  // and it's the first term in this career (unless SOC 9+)
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

  // Determine if commission phase is complete (either attempted or skipped)
  const commissionDone = !canAttemptCommission || commissionResult !== null;

  function handleCommissionRoll() {
    if (!commissionCheck) return;
    const roll = roll2D6();
    const total = roll + commissionDM;
    setCommissionResult({ roll, total, success: total >= commissionCheck.target });
  }

  function handleAdvancementRoll() {
    if (!advancementCheck) {
      onAdvance({ type: 'ROLL_FAILURE' });
      return;
    }
    const roll = roll2D6();
    const total = roll + advancementDM;
    setAdvancementResult({ roll, total, success: total >= advancementCheck.target });
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

  // Determine overall success: commissioned or advanced
  const promoted = commissionResult?.success || advancementResult?.success;

  return (
    <div>
      <ChamferedHeader>Commission &amp; Advancement</ChamferedHeader>

      {/* Commission section */}
      {canAttemptCommission && commissionCheck && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Commission</h3>
          <p>Roll {commissionCheck.characteristic} {commissionCheck.target}+ to earn a commission.</p>
          <SuccessChance baseTarget={commissionCheck.target} dm={commissionDM} label="Commission" />

          {!commissionResult && (
            <button type="button" onClick={handleCommissionRoll} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
              Roll for Commission
            </button>
          )}

          {commissionResult && (
            <p style={{ color: commissionResult.success ? 'var(--color-success-text)' : 'var(--color-failure-text)', marginTop: '0.5rem' }}>
              Rolled {commissionResult.roll}
              {commissionDM !== 0 && ` ${commissionDM > 0 ? '+' : '−'} ${Math.abs(commissionDM)}`}
              {' = '}
              {commissionResult.total}
              {commissionResult.success ? ' — Commissioned!' : ' — Commission denied.'}
            </p>
          )}
        </div>
      )}

      {/* Advancement section - shown after commission is resolved (or if no commission available) */}
      {commissionDone && !(commissionResult?.success) && (
        <div>
          <h3 style={{ margin: '0 0 0.5rem' }}>Advancement</h3>
          {advancementCheck ? (
            <div>
              <p>Roll {advancementCheck.characteristic} {advancementCheck.target}+ to advance.</p>
              {context.pendingAdvancementDM !== 0 && (
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Term bonus: {context.pendingAdvancementDM > 0 ? '+' : ''}{context.pendingAdvancementDM} DM
                </p>
              )}
              <SuccessChance baseTarget={advancementCheck.target} dm={advancementDM} label="Advancement" />
            </div>
          ) : (
            <p>No advancement roll is available for this assignment.</p>
          )}

          {!advancementResult && (
            <button type="button" onClick={handleAdvancementRoll} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
              Roll for Advancement
            </button>
          )}

          {advancementResult && (
            <p style={{ color: advancementResult.success ? 'var(--color-success-text)' : 'var(--color-failure-text)', marginTop: '0.5rem' }}>
              Rolled {advancementResult.roll}
              {advancementDM !== 0 && ` ${advancementDM > 0 ? '+' : '−'} ${Math.abs(advancementDM)}`}
              {' = '}
              {advancementResult.total}
              {advancementResult.success ? ' — Promoted!' : ' — No promotion this term.'}
            </p>
          )}
        </div>
      )}

      {/* Continue button - shown when all rolls are done */}
      {(commissionResult?.success || advancementResult !== null || (!canAttemptCommission && !advancementCheck)) && (
        <button type="button" onClick={() => onAdvance({ type: promoted ? 'ROLL_SUCCESS' : 'ROLL_FAILURE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      )}
    </div>
  );
}
