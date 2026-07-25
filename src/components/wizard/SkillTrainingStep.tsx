import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { SkillPicker } from '../shared/SkillPicker';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { extractSkillGrantOptions, tryLoadCareer, type SkillGrantOption } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface SkillTrainingStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
  isBasicTraining?: boolean;
}

const DRIFTER_SKILLS: SkillGrantOption[] = ['Streetwise', 'Survival', 'Recon', 'Carouse', 'Mechanic', 'Drive']
  .map((skill) => ({ label: skill, skill }));

export function SkillTrainingStep({ context, onAdvance, isBasicTraining = false }: SkillTrainingStepProps) {
  const { dispatch } = useCharacter();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const serviceTable = career?.skillTables.find((table) => table.id === 'service-skills');
  const skillOptions = useMemo(() => (
    serviceTable ? extractSkillGrantOptions(serviceTable.entries) : DRIFTER_SKILLS
  ), [serviceTable]);

  const selectedOption = skillOptions.find((option) => option.label === selectedLabel) ?? null;

  function handleBasicTraining() {
    // Basic training: gain all service skills at level 0
    for (const option of skillOptions) {
      dispatch({ type: 'GAIN_SKILL', skill: option.skill, level: 0 });
    }
    onAdvance({ type: 'CONTINUE' });
  }

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

  if (isBasicTraining) {
    return (
      <div>
        <ChamferedHeader>Basic Training</ChamferedHeader>
        <p>
          As a new recruit, you receive basic training in your career&apos;s core skills.
          You gain all of the following at level 0:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
          {skillOptions.map((option) => (
            <li key={option.label} style={{ padding: '0.25rem 0', color: 'var(--color-text-secondary)' }}>
              • {option.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={handleBasicTraining}
          style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}
        >
          Continue
        </button>
      </div>
    );
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
