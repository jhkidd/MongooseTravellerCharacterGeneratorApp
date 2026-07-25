import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { canAttemptPreCareer } from '../../engine/state-machine';
import type { PhaseContext, PhaseAction } from '../../engine/state-machine';

interface TermStartStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function TermStartStep({ context, onAdvance }: TermStartStepProps) {
  const canPreCareer = canAttemptPreCareer(context);
  const canContinue = context.currentCareer !== null;

  return (
    <div>
      <ChamferedHeader>Term {context.currentTerm}</ChamferedHeader>
      <p>Choose how to spend this term.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px' }}>
        {canPreCareer && (
          <button onClick={() => onAdvance({ type: 'CHOOSE_PRE_CAREER' })}>
            Pre-Career Education
          </button>
        )}
        {canContinue && (
          <button onClick={() => onAdvance({ type: 'CONTINUE_CAREER' })}>
            Continue in {context.currentCareer}
          </button>
        )}
        <button onClick={() => onAdvance({ type: 'CHOOSE_CAREER' })}>
          Enter a Career
        </button>
      </div>
    </div>
  );
}
