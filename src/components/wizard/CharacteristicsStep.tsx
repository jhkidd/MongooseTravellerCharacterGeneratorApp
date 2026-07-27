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
const DRAG_ENABLE_DELAY = 1200;

export function CharacteristicsStep({ onContinue }: CharacteristicsStepProps) {
  const { character, dispatch } = useCharacter();
  const [results, setResults] = useState<DiceResult[]>([]);
  const [assignments, setAssignments] = useState<Record<CharacteristicName, number | null>>({
    STR: character.characteristics.STR ? 0 : null,
    DEX: character.characteristics.DEX ? 1 : null,
    END: character.characteristics.END ? 2 : null,
    INT: character.characteristics.INT ? 3 : null,
    EDU: character.characteristics.EDU ? 4 : null,
    SOC: character.characteristics.SOC ? 5 : null,
  });
  const [draggable, setDraggable] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<CharacteristicName | null>(null);

  const consumedIndices = new Set(
    Object.values(assignments).filter((v): v is number => v !== null)
  );

  const handleDiceResult = useCallback((_results: DiceResult[]) => {
    setResults(_results);
    setTimeout(() => setDraggable(true), DRAG_ENABLE_DELAY);
  }, []);

  function handleDragStart(index: number, event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData('text/plain', index.toString());
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
    if (Number.isNaN(poolIndex) || poolIndex < 0 || poolIndex >= results.length) {
      return;
    }

    // If this slot already had a value, free up the old index
    setAssignments((prev) => ({ ...prev, [char]: poolIndex }));
  }

  function handleUnassign(char: CharacteristicName) {
    if (assignments[char] === null) {
      return;
    }
    setAssignments((prev) => ({ ...prev, [char]: null }));
  }

  const allAssigned = CHARS.every((char) => assignments[char] !== null);
  const speciesMods = SPECIES_MODIFIERS[character.species];

  function handleContinue() {
    const characteristics = {} as Record<CharacteristicName, number>;

    for (const char of CHARS) {
      const idx = assignments[char];
      const base = idx !== null ? results[idx].total : 0;
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

      <DiceGroup
        count={6}
        onResult={handleDiceResult}
        label="Roll 6 × 2D6"
        draggable={draggable}
        consumedIndices={consumedIndices}
        onResultDragStart={handleDragStart}
      />

      <div className="characteristics-step__slots">
        {CHARS.map((char) => {
          const idx = assignments[char];
          const value = idx !== null ? results[idx]?.total ?? null : null;
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
