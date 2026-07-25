import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import { HexBadge } from '../ui/HexBadge/HexBadge';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { CharacteristicName } from '../../models/types';
import './CharacterSummary.css';

const CHAR_NAMES: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];

export function CharacterSummary() {
  const { character } = useCharacter();

  const topSkills = Object.entries(character.skills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <aside className="character-summary">
      <ChamferedHeader level={3}>Traveller</ChamferedHeader>

      <div className="character-summary__name">
        {character.name || 'Unnamed Traveller'}
      </div>

      <div className="character-summary__meta">
        <span>Age {character.age}</span>
        <span>Term {character.currentTerm}</span>
      </div>

      <div className="character-summary__characteristics">
        {CHAR_NAMES.map((name) => (
          <HexBadge
            key={name}
            value={character.characteristics[name]}
            label={name}
            dm={getDM(character.characteristics[name])}
            size="sm"
          />
        ))}
      </div>

      {topSkills.length > 0 && (
        <div className="character-summary__skills">
          <ChamferedHeader level={3}>Skills</ChamferedHeader>
          {topSkills.map(([skill, level]) => (
            <div key={skill} className="character-summary__skill-row">
              <span>{skill}</span>
              <span className="character-summary__skill-level">{level}</span>
            </div>
          ))}
        </div>
      )}

      {character.careers.length > 0 && (
        <div className="character-summary__careers">
          <ChamferedHeader level={3}>Career History</ChamferedHeader>
          {character.careers.map((ct, i) => (
            <div key={i}>
              Term {ct.term}: {ct.career}{ct.rankTitle ? ` (${ct.rankTitle})` : ''}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
