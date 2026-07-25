import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { SkillPicker } from '../shared/SkillPicker';
import { getDM } from '../../engine/dice';
import { BACKGROUND_SKILLS } from '../../data/background-skills';
import './BackgroundSkillsStep.css';

interface BackgroundSkillsStepProps {
  onContinue: () => void;
}

export function BackgroundSkillsStep({ onContinue }: BackgroundSkillsStepProps) {
  const { character, dispatch } = useCharacter();
  const [selected, setSelected] = useState<string[]>([]);

  const eduDM = getDM(character.characteristics.EDU);
  const maxPicks = Math.max(1, 3 + eduDM);

  const handleToggle = (skill: string) => {
    setSelected((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= maxPicks) {
        return prev;
      }
      return [...prev, skill];
    });
  };

  function handleContinue() {
    for (const skill of selected) {
      dispatch({ type: 'GAIN_SKILL', skill, level: 0 });
    }
    onContinue();
  }

  const isComplete = selected.length === maxPicks;

  return (
    <div className="background-skills-step">
      <ChamferedHeader>Background Skills</ChamferedHeader>

      <p className="background-skills-step__info">
        Choose {maxPicks} starting skills (3 + EDU DM of {eduDM >= 0 ? '+' : ''}{eduDM}).
        {' '}
        All skills are gained at level 0.
      </p>

      <SkillPicker
        skills={BACKGROUND_SKILLS}
        maxPicks={maxPicks}
        selected={selected}
        onToggle={handleToggle}
      />

      <button
        type="button"
        className="background-skills-step__continue"
        onClick={handleContinue}
        disabled={!isComplete}
      >
        Continue
      </button>
    </div>
  );
}
