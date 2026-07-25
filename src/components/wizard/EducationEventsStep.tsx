import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction } from '../../engine/state-machine';

interface EducationEventsStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function EducationEventsStep({ onAdvance }: EducationEventsStepProps) {
  return (
    <div>
      <ChamferedHeader>Education Events</ChamferedHeader>
      <p>Your studies shape this term, broaden your outlook, and prepare you for later careers.</p>
      <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Detailed education events will be expanded in a later phase.
      </p>
      <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
        Continue
      </button>
    </div>
  );
}
