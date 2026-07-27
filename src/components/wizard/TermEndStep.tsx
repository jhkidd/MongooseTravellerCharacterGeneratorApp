import { useEffect, useMemo, useRef } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { ChoicePanel } from '../shared/ChoicePanel';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { CareerTerm } from '../../models/types';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface TermEndStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

function getRankTitle(context: PhaseContext): string {
  const career = tryLoadCareer(context.currentCareer);
  if (!career) {
    return context.currentCareer === 'drifter' ? 'Drifter' : 'Traveller';
  }

  const trackKey = career.ranks.type === 'assignment'
    ? (context.currentAssignment ?? Object.keys(career.ranks.tracks)[0])
    : (context.isOfficer ? 'officer' : Object.keys(career.ranks.tracks)[0]);
  const track = career.ranks.tracks[trackKey] ?? career.ranks.tracks[Object.keys(career.ranks.tracks)[0]];
  return track?.[0]?.title ?? track?.[1]?.title ?? career.name;
}

export function TermEndStep({ context, onAdvance }: TermEndStepProps) {
  const { dispatch } = useCharacter();
  const initialized = useRef(false);
  const hasCurrent = context.currentCareer !== null;

  const options: { label: string; description?: string; action: PhaseAction }[] = useMemo(() => {
    const nextOptions: { label: string; description?: string; action: PhaseAction }[] = [];

    if (hasCurrent) {
      nextOptions.push({
        label: `Continue in ${getCareerDisplayName(context.currentCareer)}`,
        action: { type: 'CONTINUE_CAREER' },
      });
      nextOptions.push({
        label: 'Switch career',
        description: 'Leave your current career, collect benefits, and try something new',
        action: { type: 'SWITCH_CAREER' },
      });
      nextOptions.push({
        label: 'Muster out and finish',
        description: 'Collect benefits and finish character creation',
        action: { type: 'MUSTER_OUT' },
      });
    } else {
      nextOptions.push({
        label: 'Continue to next term',
        description: 'Choose a new career',
        action: { type: 'CONTINUE_CAREER' },
      });
      nextOptions.push({
        label: 'Finish character creation',
        action: { type: 'MUSTER_OUT' },
      });
    }

    return nextOptions;
  }, [context.currentCareer, hasCurrent]);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;
    dispatch({ type: 'INCREMENT_TERM' });

    if (context.currentCareer) {
      const careerTerm: CareerTerm = {
        term: context.currentTerm,
        career: context.currentCareer,
        assignment: context.currentAssignment ?? undefined,
        rank: 0,
        rankTitle: getRankTitle(context),
        commissioned: context.isOfficer,
        events: [],
        survived: true,
        advanced: context.autoPromote || context.pendingAdvancementDM > 0,
      };
      dispatch({ type: 'ADD_CAREER_TERM', careerTerm });
    }
  }, [context, dispatch]);

  return (
    <div>
      <ChamferedHeader>End of Term {context.currentTerm}</ChamferedHeader>
      <ChoicePanel
        prompt="What would you like to do next?"
        options={options.map((option) => ({
          label: option.label,
          description: option.description,
        }))}
        onSelect={(index) => onAdvance(options[index].action)}
      />
    </div>
  );
}
