import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import type { Species } from '../../models/types';
import { SPECIES_MODIFIERS } from '../../data/species';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import './BackgroundStep.css';

interface BackgroundStepProps {
  onContinue: () => void;
}

const SPECIES_INFO: Record<Species, { name: string; description: string }> = {
  human: {
    name: 'Human',
    description:
      'Humans are the most widespread of the major races, an incredibly diverse and adaptable species divided into three distinct major sub-species spread across the stars by the Ancients. The largest is the Third Imperium, a massive, feudalistic interstellar empire spanning over 11,000 worlds, ruled by a central Emperor but largely governed locally by a strict hierarchy of noble families. Other notable polities are the technologically advanced, totalitarian ethno-state of the Solomani Confederation, and the highly bureaucratic, collectivist Zhodani Consulate.\n\nOriginally from Terra in the Solomani Confederation, humans lack natural weaponry like claws or specialised senses like night vision. They do however have a highly adaptable immune system and a profound capacity for technological tool-making.',
  },
  aslan: {
    name: 'Aslan',
    description:
      'The Aslan are the youngest of the great powers, an expansionist race of feuding clans and predatory warriors, eager to seize all the universe has to offer. They mostly live in the Aslan Hierate, a vast decentralised interstellar community of over 4,000 feuding clans with no central government or standing military. Early Terran explorers regarded the Aslan as \'lion-like\', and the simile has stuck ever since, although the Aslan bear only a passing resemblance to terrestrial lions.\n\nThey are descended from four-limbed carnivorous pouncer stock at the top of their food chain on their homeworld of Kusyu. They are capable of short bursts of speed, have superior hearing and night vision, and have a retractable \'dew-claw\' which is often used in honour duels. Males are typically honour-bound warriors obsessed with acquiring territory, while females traditionally handle trade, commerce, and economics.',
  },
  vargr: {
    name: 'Vargr',
    description:
      'The Vargr are the only major race to have been uplifted by the Ancients, a fact that the Vargr are extremely proud of. They are typically seen by other races as aggressive pirates and scavengers but the Vargr actually have a diverse culture that is deeply rooted in their pack mentality and the desire for companionship, charisma and loyalty.\n\nThe Vargr are descended from wolves from the planet Terra, which were uplifted by the Ancients and transplanted to Lair in the Provence sector. The Vargr do not have a single monolithic empire, but rather consist of a vast, chaotic patchwork of shifting alliances, pocket empires, and independent worlds collectively known as the Vargr Enclaves. The Vargr bear a close resemblance to their canine ancestry, as can be seen by their muzzle, tail and fur, though several anatomical modifications were made by the Ancients to the canine body structure to make them humanoid.',
  },
};

function formatModifier(val: number): string {
  return val > 0 ? `+${val}` : `${val}`;
}

export function BackgroundStep({ onContinue }: BackgroundStepProps) {
  const { character, dispatch } = useCharacter();
  const [species, setSpecies] = useState<Species>(character.species);

  function handleSelect(s: Species) {
    setSpecies(s);
  }

  function handleContinue() {
    dispatch({ type: 'SET_SPECIES', species });
    onContinue();
  }

  return (
    <div className="background-step">
      <ChamferedHeader>Choose Your Species</ChamferedHeader>

      <div className="background-step__cards">
        {(Object.keys(SPECIES_INFO) as Species[]).map((s) => {
          const info = SPECIES_INFO[s];
          const mods = SPECIES_MODIFIERS[s];
          const modEntries = Object.entries(mods) as [string, number][];
          const isSelected = species === s;

          return (
            <button
              key={s}
              type="button"
              className={`species-card ${isSelected ? 'species-card--selected' : ''}`}
              onClick={() => handleSelect(s)}
              aria-pressed={isSelected}
            >
              <h3 className="species-card__name">{info.name}</h3>
              <p className="species-card__description">{info.description}</p>
              {modEntries.length > 0 ? (
                <div className="species-card__modifiers">
                  {modEntries.map(([stat, val]) => (
                    <span key={stat} className="species-card__mod">
                      {stat} {formatModifier(val)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="species-card__modifiers">
                  <span className="species-card__mod species-card__mod--neutral">No modifiers</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="background-step__continue"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
