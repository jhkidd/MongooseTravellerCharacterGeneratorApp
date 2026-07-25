import { useMemo } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import type { CharacteristicName } from '../../models/types';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { HexBadge } from '../ui/HexBadge/HexBadge';

const CHARS: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];

export function CharacterSheetStep() {
  const { character } = useCharacter();
  const specialtyEntries = useMemo(() => (
    Object.entries(character.specialties)
      .map(([key, level]) => {
        const [skill, specialty] = key.split(':');
        return { skill, specialty, level };
      })
      .sort((left, right) => left.skill.localeCompare(right.skill) || left.specialty.localeCompare(right.specialty))
  ), [character.specialties]);

  return (
    <div>
      <ChamferedHeader level={1}>Character Complete!</ChamferedHeader>
      <h2 style={{ color: 'var(--color-accent)' }}>{character.name || 'Unnamed Traveller'}</h2>
      <p>
        {character.species} from {character.homeworld || 'Unknown'} — Age {character.age}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1rem 0' }}>
        {CHARS.map((characteristic) => (
          <HexBadge
            key={characteristic}
            value={character.characteristics[characteristic]}
            label={characteristic}
            dm={getDM(character.characteristics[characteristic])}
            size="md"
          />
        ))}
      </div>

      {Object.keys(character.skills).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ color: 'var(--color-accent)' }}>Skills</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {Object.entries(character.skills)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([skill, level]) => (
                <li key={skill} style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  {skill} {level}
                </li>
              ))}
            {specialtyEntries.map((entry) => (
              <li key={`${entry.skill}-${entry.specialty}`} style={{ color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                {entry.skill} ({entry.specialty}) {entry.level}
              </li>
            ))}
          </ul>
        </div>
      )}

      {character.cash > 0 && (
        <p style={{ marginTop: '1rem' }}>
          Cash: Cr{character.cash.toLocaleString()}
        </p>
      )}
    </div>
  );
}
