import { useState, type FormEvent } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import type { Species } from '../../models/types';
import { NarrativeField } from '../shared/NarrativeField';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import './BackgroundStep.css';

interface BackgroundStepProps {
  onContinue: () => void;
}

export function BackgroundStep({ onContinue }: BackgroundStepProps) {
  const { character, dispatch } = useCharacter();
  const [name, setName] = useState(character.name);
  const [species, setSpecies] = useState<Species>(character.species);
  const [homeworld, setHomeworld] = useState(character.homeworld);
  const [notes, setNotes] = useState(character.backgroundNotes);

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    dispatch({ type: 'SET_NAME', name });
    dispatch({ type: 'SET_SPECIES', species });
    dispatch({ type: 'SET_HOMEWORLD', homeworld });
    dispatch({ type: 'SET_BACKGROUND_NOTES', notes });
    onContinue();
  }

  return (
    <div className="background-step">
      <ChamferedHeader>Background</ChamferedHeader>

      <form className="background-step__form" onSubmit={handleContinue}>
        <div className="background-step__field">
          <label className="background-step__label" htmlFor="bg-name">Name</label>
          <input
            id="bg-name"
            className="background-step__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your Traveller's name"
          />
        </div>

        <div className="background-step__field">
          <label className="background-step__label" htmlFor="bg-species">Species</label>
          <select
            id="bg-species"
            className="background-step__select"
            value={species}
            onChange={(e) => setSpecies(e.target.value as Species)}
          >
            <option value="human">Human</option>
            <option value="aslan">Aslan</option>
            <option value="vargr">Vargr</option>
          </select>
        </div>

        <div className="background-step__field">
          <label className="background-step__label" htmlFor="bg-homeworld">Homeworld</label>
          <input
            id="bg-homeworld"
            className="background-step__input"
            type="text"
            value={homeworld}
            onChange={(e) => setHomeworld(e.target.value)}
            placeholder="e.g., Regina, Terra, Vland"
          />
        </div>

        <NarrativeField
          prompt="Describe your Traveller's early life and history"
          value={notes}
          onChange={setNotes}
          placeholder="What was their childhood like? What drove them to seek adventure?"
        />

        <button
          type="submit"
          className="background-step__continue"
          disabled={!name.trim()}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
