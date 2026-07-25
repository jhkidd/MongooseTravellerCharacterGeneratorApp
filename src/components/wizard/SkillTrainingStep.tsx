import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { SkillPicker } from '../shared/SkillPicker';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { extractSkillGrantOptions, tryLoadCareer, type SkillGrantOption } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface SkillTrainingStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

const DRIFTER_SKILLS: SkillGrantOption[] = ['Streetwise', 'Survival', 'Recon', 'Carouse', 'Mechanic', 'Drive']
  .map((skill) => ({ label: skill, skill }));

export function SkillTrainingStep({ context, onAdvance }: SkillTrainingStepProps) {
  const { dispatch } = useCharacter();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const serviceTable = career?.skillTables.find((table) => table.id === 'service-skills');
  const skillOptions = useMemo(() => (
    serviceTable ? extractSkillGrantOptions(serviceTable.entries) : DRIFTER_SKILLS
  ), [serviceTable]);

  const selectedOption = skillOptions.find((option) => option.label === selectedLabel) ?? null;

  function handleContinue() {
    if (!selectedOption) {
      return;
    }

    if (selectedOption.specialty) {
      dispatch({
        type: 'GAIN_SPECIALTY',
        skill: selectedOption.skill,
        specialty: selectedOption.specialty,
        level: 1,
      });
    } else {
      dispatch({ type: 'GAIN_SKILL', skill: selectedOption.skill, level: 0 });
    }

    onAdvance({ type: 'CONTINUE' });
  }

  return (
    <div>
      <ChamferedHeader>Skill Training</ChamferedHeader>
      <p>Choose one skill to improve this term.</p>
      <SkillPicker
        skills={skillOptions.map((option) => option.label)}
        maxPicks={1}
        selected={selectedLabel ? [selectedLabel] : []}
        onToggle={(label) => setSelectedLabel((current) => current === label ? null : label)}
      />
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selectedOption}
        style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}
      >
        Continue
      </button>
    </div>
  );
}
