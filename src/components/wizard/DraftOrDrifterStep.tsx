import { useState } from 'react';
import { rollD6 } from '../../engine/dice';
import { ChoicePanel } from '../shared/ChoicePanel';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getCareerDisplayName } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

const DRAFT_TABLE: Record<number, string> = {
  1: 'navy',
  2: 'army',
  3: 'marines',
  4: 'merchant',
  5: 'scout',
  6: 'agent',
};

interface DraftOrDrifterStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function DraftOrDrifterStep({ context, onAdvance }: DraftOrDrifterStepProps) {
  const [draftResult, setDraftResult] = useState<{ roll: number; career: string } | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  function handleDraft() {
    const roll = rollD6();
    const careerId = DRAFT_TABLE[roll];
    setDraftResult({ roll, career: careerId });
    setSelectedCareer(careerId);
    onAdvance({ type: 'FORCE_CAREER', careerId });
  }

  function handleChooseDrifter() {
    setSelectedCareer('drifter');
    onAdvance({ type: 'FORCE_CAREER', careerId: 'drifter' });
  }

  function handleContinue() {
    if (!selectedCareer) {
      return;
    }

    onAdvance({ type: 'CONTINUE' });
  }

  return (
    <div>
      <ChamferedHeader>Failed Qualification</ChamferedHeader>
      <p>
        You did not qualify for {getCareerDisplayName(context.currentCareer)}.
        Submit to the draft or strike out as a Drifter.
      </p>

      {!selectedCareer ? (
        <ChoicePanel
          prompt="What will you do?"
          options={[
            { label: 'Submit to the Draft', description: 'Roll 1D6 and be assigned a career' },
            { label: 'Become a Drifter', description: 'No roll needed' },
          ]}
          onSelect={(index) => {
            if (index === 0) {
              handleDraft();
              return;
            }

            handleChooseDrifter();
          }}
        />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          {draftResult ? (
            <p>
              Draft roll: {draftResult.roll} — Drafted into {getCareerDisplayName(draftResult.career)}.
            </p>
          ) : (
            <p>You become a Drifter for this term.</p>
          )}
          <button type="button" onClick={handleContinue} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
