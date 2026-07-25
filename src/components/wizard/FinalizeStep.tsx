import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction } from '../../engine/state-machine';

interface FinalizeStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function FinalizeStep({ onAdvance }: FinalizeStepProps) {
  return (
    <div>
      <ChamferedHeader>Finalize Contacts</ChamferedHeader>
      <p>Review your contacts, allies, rivals, and enemies before finishing generation.</p>
      <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Full contact editing is planned for a future update.
      </p>
      <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
        Continue to Character Sheet
      </button>
    </div>
  );
}
