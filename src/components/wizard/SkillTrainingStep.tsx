import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { rollD6 } from '../../engine/dice';
import { ChoicePanel } from '../shared/ChoicePanel';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { extractSkillGrantOptions, tryLoadCareer, type SkillGrantOption } from './career-flow-utils';
import type { SkillTable, SkillTableEntry } from '../../models/career-types';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface SkillTrainingStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
  isBasicTraining?: boolean;
}

const DRIFTER_SKILLS: SkillGrantOption[] = ['Streetwise', 'Survival', 'Recon', 'Carouse', 'Mechanic', 'Drive']
  .map((skill) => ({ label: skill, skill }));

function getAvailableTables(
  career: ReturnType<typeof tryLoadCareer>,
  context: PhaseContext,
  eduScore: number,
): SkillTable[] {
  if (!career) return [];
  return career.skillTables.filter((table) => {
    if (!table.restriction) return true;
    switch (table.restriction.type) {
      case 'minEdu':
        return eduScore >= table.restriction.value;
      case 'officer':
        return context.isOfficer;
      case 'assignment':
        return context.currentAssignment === table.restriction.assignmentId;
    }
  });
}

function describeEntry(entry: SkillTableEntry): string {
  switch (entry.type) {
    case 'skill':
      return entry.specialty ? `${entry.skill} (${entry.specialty})` : entry.skill;
    case 'characteristic':
      return `${entry.characteristic} +${entry.value}`;
    case 'choice':
      return entry.options.map(describeEntry).join(' or ');
  }
}

export function SkillTrainingStep({ context, onAdvance, isBasicTraining = false }: SkillTrainingStepProps) {
  const { character, dispatch } = useCharacter();
  const [selectedTable, setSelectedTable] = useState<SkillTable | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [choiceEntry, setChoiceEntry] = useState<SkillTableEntry | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const serviceTable = career?.skillTables.find((table) => table.id === 'service-skills');
  const basicSkillOptions = useMemo(() => (
    serviceTable ? extractSkillGrantOptions(serviceTable.entries) : DRIFTER_SKILLS
  ), [serviceTable]);

  const availableTables = useMemo(
    () => getAvailableTables(career, context, character.characteristics.EDU),
    [career, context, character.characteristics.EDU],
  );

  function applyEntry(entry: SkillTableEntry) {
    switch (entry.type) {
      case 'skill':
        if (entry.specialty) {
          dispatch({ type: 'GAIN_SPECIALTY', skill: entry.skill, specialty: entry.specialty, level: 1 });
        } else {
          dispatch({ type: 'GAIN_SKILL', skill: entry.skill, level: 1 });
        }
        onAdvance({ type: 'CONTINUE' });
        break;
      case 'characteristic':
        dispatch({ type: 'MOD_CHARACTERISTIC', characteristic: entry.characteristic, value: entry.value });
        onAdvance({ type: 'CONTINUE' });
        break;
      case 'choice':
        // Need player input
        setChoiceEntry(entry);
        break;
    }
  }

  function handleRoll() {
    const roll = rollD6();
    setDiceResult(roll);
    if (selectedTable) {
      const entry = selectedTable.entries[roll];
      if (entry) {
        applyEntry(entry);
      } else {
        onAdvance({ type: 'CONTINUE' });
      }
    }
  }

  const isFirstCareer = context.previousCareers.length === 0;

  function handleBasicTraining() {
    if (isFirstCareer) {
      // First career: gain ALL service skills at level 0
      for (const option of basicSkillOptions) {
        dispatch({ type: 'GAIN_SKILL', skill: option.skill, level: 0 });
      }
      onAdvance({ type: 'CONTINUE' });
    }
    // Subsequent career: handled by the picker UI below
  }

  // Basic training path
  if (isBasicTraining) {
    // First career: grant all service skills at level 0 automatically
    if (isFirstCareer) {
      return (
        <div>
          <ChamferedHeader>Basic Training</ChamferedHeader>
          <p>
            As a new recruit, you receive basic training in your career&apos;s core skills.
            You gain all of the following at level 0:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
            {basicSkillOptions.map((option) => (
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

    // Subsequent career: pick ONE service skill at level 0
    return (
      <div>
        <ChamferedHeader>Basic Training</ChamferedHeader>
        <p>
          As an experienced Traveller entering a new career, you may pick one service skill at level 0:
        </p>
        <ChoicePanel
          prompt="Choose one service skill:"
          options={basicSkillOptions.map((opt) => ({ label: opt.label }))}
          onSelect={(index) => {
            const option = basicSkillOptions[index];
            if (option.specialty) {
              dispatch({ type: 'GAIN_SPECIALTY', skill: option.skill, specialty: option.specialty, level: 0 });
            } else {
              dispatch({ type: 'GAIN_SKILL', skill: option.skill, level: 0 });
            }
            onAdvance({ type: 'CONTINUE' });
          }}
        />
      </div>
    );
  }

  // If we have a choice entry pending (e.g. "Drive or Vacc Suit")
  if (choiceEntry && choiceEntry.type === 'choice') {
    const options = choiceEntry.options;
    return (
      <div>
        <ChamferedHeader>Skill Training</ChamferedHeader>
        <p>Choose one:</p>
        <ChoicePanel
          prompt="Pick which skill to gain:"
          options={options.map((opt) => ({ label: describeEntry(opt) }))}
          onSelect={(index) => {
            const chosen = options[index];
            if (chosen.type === 'skill') {
              if (chosen.specialty) {
                dispatch({ type: 'GAIN_SPECIALTY', skill: chosen.skill, specialty: chosen.specialty, level: 1 });
              } else {
                dispatch({ type: 'GAIN_SKILL', skill: chosen.skill, level: 1 });
              }
            } else if (chosen.type === 'characteristic') {
              dispatch({ type: 'MOD_CHARACTERISTIC', characteristic: chosen.characteristic, value: chosen.value });
            }
            onAdvance({ type: 'CONTINUE' });
          }}
        />
      </div>
    );
  }

  // If dice have been rolled and result was already applied (non-choice)
  if (diceResult !== null && !choiceEntry) {
    // Already applied in handleRoll, this shouldn't render but just in case
    return null;
  }

  // If a table has been selected, show the roll button
  if (selectedTable) {
    return (
      <div>
        <ChamferedHeader>Skill Training</ChamferedHeader>
        <p>Roll on the <strong>{selectedTable.name}</strong> table:</p>
        <div style={{ margin: '0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          {Object.entries(selectedTable.entries).map(([roll, entry]) => (
            <div key={roll}>{roll}: {describeEntry(entry)}</div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleRoll}
          style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
        >
          Roll 1D6
        </button>
      </div>
    );
  }

  // Table selection phase
  return (
    <div>
      <ChamferedHeader>Skill Training</ChamferedHeader>
      <p>Choose a skill table to roll on this term:</p>
      <ChoicePanel
        prompt="Available tables:"
        options={availableTables.map((table) => ({
          label: table.name,
          description: table.restriction
            ? `(${table.restriction.type === 'minEdu' ? `EDU ${table.restriction.value}+` : table.restriction.type === 'officer' ? 'Officers only' : `${table.restriction.assignmentId} assignment`})`
            : undefined,
        }))}
        onSelect={(index) => setSelectedTable(availableTables[index])}
      />
    </div>
  );
}
