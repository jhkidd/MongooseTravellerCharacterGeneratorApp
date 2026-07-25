import { useCallback, useState, type DragEvent } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { SPECIES_MODIFIERS } from '../../data/species';
import { getDM } from '../../engine/dice';
import type { CharacteristicName } from '../../models/types';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { DiceGroup, type DiceResult } from '../ui/Dice3D/DiceGroup';
import { HexBadge } from '../ui/HexBadge/HexBadge';
import './CharacteristicsStep.css';

interface CharacteristicsStepProps {
  onContinue: () => void;
}

const CHARS: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];

export function CharacteristicsStep({ onContinue }: CharacteristicsStepProps) {
  const { character, dispatch } = useCharacter();
  const [pool, setPool] = useState<DiceResult[]>([]);
  const [assignments, setAssignments] = useState<Record<CharacteristicName, number | null>>({
    STR: character.characteristics.STR || null,
    DEX: character.characteristics.DEX || null,
    END: character.characteristics.END || null,
    INT: character.characteristics.INT || null,
    EDU: character.characteristics.EDU || null,
    SOC: character.characteristics.SOC || null,
  });
  const [dragOverSlot, setDragOverSlot] = useState<CharacteristicName | null>(null);
  const [hasRolled, setHasRolled] = useState(false);

  const handleDiceResult = useCallback((results: DiceResult[]) => {
    setPool(results);
    setHasRolled(true);
  }, []);

  function handleDragStart(event: DragEvent<HTMLDivElement>, poolIndex: number) {
    event.dataTransfer.setData('text/plain', poolIndex.toString());
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, char: CharacteristicName) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverSlot(char);
  }

  function handleDragLeave() {
    setDragOverSlot(null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, char: CharacteristicName) {
    event.preventDefault();
    setDragOverSlot(null);

    const poolIndex = Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(poolIndex) || poolIndex < 0 || poolIndex >= pool.length) {
      return;
    }

    const previousValue = assignments[char];
    setAssignments((prev) => ({ ...prev, [char]: pool[poolIndex].total }));
    setPool((prev) => {
      const next = prev.filter((_, index) => index !== poolIndex);
      if (previousValue !== null) {
        next.push({ die1: 0, die2: 0, total: previousValue });
      }
      return next;
    });
  }

  function handleUnassign(char: CharacteristicName) {
    const value = assignments[char];
    if (value === null) {
      return;
    }

    setAssignments((prev) => ({ ...prev, [char]: null }));
    setPool((prev) => [...prev, { die1: 0, die2: 0, total: value }]);
  }

  const allAssigned = CHARS.every((char) => assignments[char] !== null);
  const speciesMods = SPECIES_MODIFIERS[character.species];

  function handleContinue() {
    const characteristics = {} as Record<CharacteristicName, number>;

    for (const char of CHARS) {
      const base = assignments[char] ?? 0;
      const mod = speciesMods?.[char] ?? 0;
      characteristics[char] = Math.max(0, base + mod);
    }

    dispatch({ type: 'SET_ALL_CHARACTERISTICS', characteristics });
    onContinue();
  }

  return (
    <div className="characteristics-step">
      <ChamferedHeader>Characteristics</ChamferedHeader>
      <p>Roll 2D6 six times, then drag each result into the characteristic you want.</p>

      {!hasRolled && (
        <DiceGroup count={6} onResult={handleDiceResult} label="Roll 6 × 2D6" />
      )}

      {hasRolled && pool.length > 0 && (
        <div className="characteristics-step__pool">
          {pool.map((result, index) => (
            <div
              key={`${result.total}-${index}`}
              className="characteristics-step__draggable"
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
            >
              <HexBadge value={result.total} size="md" />
            </div>
          ))}
        </div>
      )}

      <div className="characteristics-step__slots">
        {CHARS.map((char) => {
          const value = assignments[char];
          const mod = speciesMods?.[char] ?? 0;
          const finalValue = value !== null ? Math.max(0, value + mod) : null;

          return (
            <div
              key={char}
              className={`char-slot ${dragOverSlot === char ? 'char-slot--dragover' : ''}`}
              onDragOver={(event) => handleDragOver(event, char)}
              onDragLeave={handleDragLeave}
              onDrop={(event) => handleDrop(event, char)}
            >
              {value !== null ? (
                <>
                  <HexBadge
                    value={finalValue ?? 0}
                    label={char}
                    dm={getDM(finalValue ?? 0)}
                    size="lg"
                  />
                  {mod !== 0 && (
                    <span className="characteristics-step__species-note">
                      ({mod > 0 ? '+' : ''}{mod} species)
                    </span>
                  )}
                  <button
                    type="button"
                    className="char-slot__unassign"
                    onClick={() => handleUnassign(char)}
                  >
                    unassign
                  </button>
                </>
              ) : (
                <HexBadge value="?" label={char} variant="empty" size="lg" />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="characteristics-step__continue"
        onClick={handleContinue}
        disabled={!allAssigned}
      >
        Continue
      </button>
    </div>
  );
}
