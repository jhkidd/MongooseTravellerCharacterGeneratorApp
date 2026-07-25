import { ChoicePanel } from '../shared/ChoicePanel';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { PhaseAction } from '../../engine/state-machine';

interface PreCareerSelectionStepProps {
  onAdvance: (action: PhaseAction) => void;
}

export function PreCareerSelectionStep({ onAdvance }: PreCareerSelectionStepProps) {
  return (
    <div>
      <ChamferedHeader>Pre-Career Education</ChamferedHeader>
      <ChoicePanel
        prompt="Choose a pre-career path for this term."
        options={[
          { label: 'University', description: 'A broad civilian education path.' },
          { label: 'Military Academy', description: 'Structured training before formal service.' },
        ]}
        onSelect={() => onAdvance({ type: 'CONTINUE' })}
      />
    </div>
  );
}
