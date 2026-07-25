import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { ChoicePanel } from '../shared/ChoicePanel';
import { canAttemptPreCareer } from '../../engine/state-machine';
import type { PhaseContext, PhaseAction } from '../../engine/state-machine';
import { getCareerDisplayName } from './career-flow-utils';

interface TermStartStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function TermStartStep({ context, onAdvance }: TermStartStepProps) {
  const canPreCareer = canAttemptPreCareer(context);
  const hasContinuingCareer = context.currentCareer !== null;

  const options: { label: string; description?: string; action: PhaseAction }[] = [];

  if (hasContinuingCareer) {
    options.push({
      label: `Continue in ${getCareerDisplayName(context.currentCareer)}`,
      description: 'No qualification roll needed',
      action: { type: 'CONTINUE_CAREER' },
    });
  }

  options.push({
    label: 'Enter a new career',
    description: 'Choose a career and roll for qualification',
    action: { type: 'CHOOSE_CAREER' },
  });

  if (canPreCareer) {
    options.push({
      label: 'Pre-career education',
      description: 'University or Military Academy (terms 1-3 only)',
      action: { type: 'CHOOSE_PRE_CAREER' },
    });
  }

  return (
    <div>
      <ChamferedHeader>Term {context.currentTerm}</ChamferedHeader>
      <ChoicePanel
        prompt="What would you like to do this term?"
        options={options.map((option) => ({
          label: option.label,
          description: option.description,
        }))}
        onSelect={(index) => onAdvance(options[index].action)}
      />
    </div>
  );
}
