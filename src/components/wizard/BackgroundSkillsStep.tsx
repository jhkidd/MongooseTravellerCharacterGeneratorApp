import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { SkillPicker } from '../shared/SkillPicker';
import { NarrativeField } from '../shared/NarrativeField';
import { getDM } from '../../engine/dice';
import { BACKGROUND_SKILLS } from '../../data/background-skills';
import './BackgroundSkillsStep.css';

interface BackgroundSkillsStepProps {
  onContinue: () => void;
}

export function BackgroundSkillsStep({ onContinue }: BackgroundSkillsStepProps) {
  const { character, dispatch } = useCharacter();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState(character.name);
  const [homeworld, setHomeworld] = useState(character.homeworld);
  const [notes, setNotes] = useState(character.backgroundNotes);

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
    dispatch({ type: 'SET_NAME', name });
    dispatch({ type: 'SET_HOMEWORLD', homeworld });
    dispatch({ type: 'SET_BACKGROUND_NOTES', notes });
    for (const skill of selected) {
      dispatch({ type: 'GAIN_SKILL', skill, level: 0 });
    }
    onContinue();
  }

  const isComplete = selected.length === maxPicks && name.trim().length > 0;

  return (
    <div className="background-skills-step">
      <ChamferedHeader>Background &amp; Skills</ChamferedHeader>

      <div className="background-skills-step__identity">
        <div className="background-skills-step__field">
          <label className="background-skills-step__label" htmlFor="bg-name">Name</label>
          <input
            id="bg-name"
            className="background-skills-step__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your Traveller's name"
          />
        </div>

        <div className="background-skills-step__field">
          <label className="background-skills-step__label" htmlFor="bg-homeworld">Homeworld</label>
          <input
            id="bg-homeworld"
            className="background-skills-step__input"
            type="text"
            value={homeworld}
            onChange={(e) => setHomeworld(e.target.value)}
            placeholder="e.g., Regina, Terra, Vland"
          />
        </div>

        <NarrativeField
          prompt="Describe your Traveller's early life"
          value={notes}
          onChange={setNotes}
          placeholder="What was their childhood like? What drove them to seek adventure?"
        />
      </div>

      <div className="background-skills-step__divider" />

      <p className="background-skills-step__info">
        Before embarking on your careers, you receive a number of background skills equal to 3 + your Education DM.
        This represents the knowledge you have picked up during your adolescence.
        Consider which skills you would have likely learnt, given your upbringing.
        If you were raised in an asteroid belt you likely learnt how to operate a Vacc Suit for instance.
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
