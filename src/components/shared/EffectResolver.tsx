import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { interpretEffect, resolveImmediate } from '../../engine/effect-interpreter';
import { getDM, rollD6, roll2D6 } from '../../engine/dice';
import { getSharedTable, buildCareerMishapTable } from '../../data/table-loader';
import type { SharedTable } from '../../data/table-loader';
import { loadCareer } from '../../data/career-loader';
import { ChoicePanel } from './ChoicePanel';
import { SkillPicker } from './SkillPicker';
import { DiceCheckRoll } from '../ui/Dice3D/DiceCheckRoll';
import type { DiceCheckDM, DiceCheckResult } from '../ui/Dice3D/DiceCheckRoll';
import type { EffectNode } from '../../models/effect-types';
import type { EffectSignal, InterpretedEffect } from '../../engine/effect-interpreter';
import type { Character } from '../../models/types';

export interface EffectResolverResult {
  signals: EffectSignal[];
}

interface EffectResolverProps {
  effect: EffectNode;
  onComplete: (result: EffectResolverResult) => void;
  careerId?: string;
}

/**
 * Shared component that handles all interactive ("pause") effects from the
 * effect interpreter. Recursively resolves chains where one effect's outcome
 * leads to another interactive effect.
 */
export function EffectResolver({ effect, onComplete, careerId }: EffectResolverProps) {
  const { character, dispatch } = useCharacter();
  const [interpreted] = useState<InterpretedEffect>(() => interpretEffect(effect, character));

  // If it's immediate, apply and signal done
  if (interpreted.type === 'immediate') {
    return (
      <ImmediateResolver
        interpreted={interpreted}
        onComplete={onComplete}
      />
    );
  }

  return (
    <PauseResolver
      interpreted={interpreted}
      character={character}
      dispatch={dispatch}
      onComplete={onComplete}
      careerId={careerId}
    />
  );
}

// Handles immediate effects - auto-applies actions and allows continue
function ImmediateResolver({
  interpreted,
  onComplete,
}: {
  interpreted: Extract<InterpretedEffect, { type: 'immediate' }>;
  onComplete: (result: EffectResolverResult) => void;
}) {
  const { dispatch } = useCharacter();
  const [applied, setApplied] = useState(false);

  if (!applied) {
    interpreted.actions.forEach(dispatch);
    setApplied(true);
  }

  return (
    <div>
      {interpreted.actions.length > 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          Effects applied automatically.
        </p>
      )}
      <button
        type="button"
        onClick={() => onComplete({ signals: interpreted.signals })}
        style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
      >
        Continue
      </button>
    </div>
  );
}

// Handles pause effects - renders interactive UI
function PauseResolver({
  interpreted,
  character,
  dispatch,
  onComplete,
  careerId,
}: {
  interpreted: Extract<InterpretedEffect, { type: 'pause' }>;
  character: Character;
  dispatch: ReturnType<typeof useCharacter>['dispatch'];
  onComplete: (result: EffectResolverResult) => void;
  careerId?: string;
}) {
  // Track if we have a follow-on effect to resolve after this pause
  const [followOn, setFollowOn] = useState<EffectNode | null>(null);
  const [pendingEffects, setPendingEffects] = useState<EffectNode[]>(
    () => interpreted.pendingEffects ?? []
  );
  const [accumulatedSignals, setAccumulatedSignals] = useState<EffectSignal[]>(
    () => {
      // Apply any immediate actions that precede the pause
      if (interpreted.immediateActions?.length) {
        interpreted.immediateActions.forEach(dispatch);
      }
      return [];
    }
  );

  // Chain handler: resolves pending effects before completing
  function handleChainComplete(result: EffectResolverResult) {
    const newSignals = [...accumulatedSignals, ...result.signals];
    if (pendingEffects.length > 0) {
      const nextEffect: EffectNode = pendingEffects.length === 1
        ? pendingEffects[0]
        : { type: 'compound', effects: pendingEffects };
      setPendingEffects([]);
      setAccumulatedSignals(newSignals);
      setFollowOn(nextEffect);
    } else {
      onComplete({ signals: newSignals });
    }
  }

  // If we have a follow-on effect, render a nested EffectResolver
  if (followOn) {
    return (
      <EffectResolver
        effect={followOn}
        careerId={careerId}
        onComplete={handleChainComplete}
      />
    );
  }

  const { pauseType, effectNode } = interpreted;

  switch (pauseType) {
    case 'choice':
      return (
        <ChoiceResolver
          effectNode={effectNode}
          character={character}
          dispatch={dispatch}
          accumulatedSignals={accumulatedSignals}
          setAccumulatedSignals={setAccumulatedSignals}
          setFollowOn={setFollowOn}
          onComplete={handleChainComplete}
          careerId={careerId}
        />
      );

    case 'pickSkill':
      return (
        <PickSkillResolver
          effectNode={effectNode}
          dispatch={dispatch}
          accumulatedSignals={accumulatedSignals}
          onComplete={handleChainComplete}
        />
      );

    case 'skillCheck':
      return (
        <SkillCheckResolver
          effectNode={effectNode}
          character={character}
          dispatch={dispatch}
          accumulatedSignals={accumulatedSignals}
          setAccumulatedSignals={setAccumulatedSignals}
          setFollowOn={setFollowOn}
          onComplete={handleChainComplete}
        />
      );

    case 'pickOne':
      return (
        <PickOneResolver
          effectNode={effectNode}
          dispatch={dispatch}
          accumulatedSignals={accumulatedSignals}
          onComplete={handleChainComplete}
        />
      );

    case 'narrative':
      return (
        <NarrativeResolver
          effectNode={effectNode}
          accumulatedSignals={accumulatedSignals}
          onComplete={handleChainComplete}
        />
      );

    default:
      // rollOnTable, diceRoll, increaseExistingSkill -- handle here
      return (
        <FallbackResolver
          pauseType={pauseType}
          effectNode={effectNode}
          character={character}
          dispatch={dispatch}
          accumulatedSignals={accumulatedSignals}
          onComplete={handleChainComplete}
          careerId={careerId}
        />
      );
  }
}

// Choice: show labeled options, resolve the chosen option's effects
function ChoiceResolver({
  effectNode,
  character,
  dispatch,
  accumulatedSignals,
  setAccumulatedSignals,
  setFollowOn,
  onComplete,
  careerId,
}: {
  effectNode: EffectNode;
  character: Character;
  dispatch: ReturnType<typeof useCharacter>['dispatch'];
  accumulatedSignals: EffectSignal[];
  setAccumulatedSignals: React.Dispatch<React.SetStateAction<EffectSignal[]>>;
  setFollowOn: React.Dispatch<React.SetStateAction<EffectNode | null>>;
  onComplete: (result: EffectResolverResult) => void;
  careerId?: string;
}) {
  if (effectNode.type !== 'choice') return null;

  function handleSelect(index: number) {
    const option = (effectNode as Extract<EffectNode, { type: 'choice' }>).options[index];
    if (!option) return;

    // Resolve all effects in the chosen option
    const signals: EffectSignal[] = [];
    let firstPauseIndex = -1;

    for (let i = 0; i < option.effects.length; i++) {
      if (firstPauseIndex >= 0) break;

      const childEffect = option.effects[i];
      const childResult = interpretEffect(childEffect, character);
      if (childResult.type === 'immediate') {
        childResult.actions.forEach(dispatch);
        signals.push(...childResult.signals);
      } else {
        if (childResult.immediateActions?.length) {
          childResult.immediateActions.forEach(dispatch);
        }
        firstPauseIndex = i;
      }
    }

    if (firstPauseIndex >= 0) {
      setAccumulatedSignals([...accumulatedSignals, ...signals]);
      // Include all remaining effects from the pause onwards
      const remaining = option.effects.slice(firstPauseIndex);
      if (remaining.length === 1) {
        setFollowOn(remaining[0]);
      } else {
        setFollowOn({ type: 'compound', effects: remaining } as EffectNode);
      }
    } else {
      onComplete({ signals: [...accumulatedSignals, ...signals] });
    }
  }

  return (
    <ChoicePanel
      prompt={effectNode.prompt}
      options={effectNode.options.map((opt) => ({ label: opt.label }))}
      onSelect={handleSelect}
    />
  );
}

// PickSkill: show skill list, pick one
function PickSkillResolver({
  effectNode,
  dispatch,
  accumulatedSignals,
  onComplete,
}: {
  effectNode: EffectNode;
  dispatch: ReturnType<typeof useCharacter>['dispatch'];
  accumulatedSignals: EffectSignal[];
  onComplete: (result: EffectResolverResult) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  if (effectNode.type !== 'pickSkill') return null;

  const options = effectNode.options;
  const level = effectNode.level ?? 1;

  function handleConfirm() {
    if (!selected) return;
    dispatch({ type: 'GAIN_SKILL', skill: selected, level });
    onComplete({ signals: accumulatedSignals });
  }

  return (
    <div>
      <p>Choose a skill to gain at level {level}:</p>
      <SkillPicker
        skills={options}
        maxPicks={1}
        selected={selected ? [selected] : []}
        onToggle={(skill) => setSelected(skill === selected ? null : skill)}
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected}
        style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
      >
        Confirm
      </button>
    </div>
  );
}

// SkillCheck: roll 2D6 vs target, then resolve success/failure
function SkillCheckResolver({
  effectNode,
  character,
  dispatch,
  accumulatedSignals,
  setAccumulatedSignals,
  setFollowOn,
  onComplete,
}: {
  effectNode: EffectNode;
  character: Character;
  dispatch: ReturnType<typeof useCharacter>['dispatch'];
  accumulatedSignals: EffectSignal[];
  setAccumulatedSignals: React.Dispatch<React.SetStateAction<EffectSignal[]>>;
  setFollowOn: React.Dispatch<React.SetStateAction<EffectNode | null>>;
  onComplete: (result: EffectResolverResult) => void;
}) {
  const [rollResult, setRollResult] = useState<DiceCheckResult | null>(null);

  if (effectNode.type !== 'skillCheck') return null;

  const { skill, characteristic, target, success, failure, naturalTwo } = effectNode;
  const checkLabel = skill ?? characteristic ?? 'Check';

  // Calculate DM from characteristic or skill
  let dmValue = 0;
  let dmLabel = '';
  if (characteristic && character.characteristics[characteristic] !== undefined) {
    dmValue = getDM(character.characteristics[characteristic]);
    dmLabel = `${characteristic} DM`;
  } else if (skill && character.skills[skill] !== undefined) {
    dmValue = character.skills[skill];
    dmLabel = `${skill} skill`;
  }

  const dms: DiceCheckDM[] = [];
  if (dmValue !== 0) {
    dms.push({ label: dmLabel, value: dmValue });
  }

  function handleDiceResult(result: DiceCheckResult) {
    const isNatTwo = result.raw === 2;
    setRollResult({ ...result, success: result.total >= target });

    // Determine which branch to follow
    let branchEffect: EffectNode;
    if (isNatTwo && naturalTwo) {
      branchEffect = naturalTwo;
    } else if (result.total >= target) {
      branchEffect = success;
    } else {
      branchEffect = failure;
    }

    // Try to resolve the branch immediately
    const branchResult = interpretEffect(branchEffect, character);
    if (branchResult.type === 'immediate') {
      branchResult.actions.forEach(dispatch);
      onComplete({ signals: [...accumulatedSignals, ...branchResult.signals] });
    } else {
      // Branch needs interactive resolution
      if (branchResult.immediateActions?.length) {
        branchResult.immediateActions.forEach(dispatch);
      }
      setAccumulatedSignals(accumulatedSignals);
      setFollowOn(branchEffect);
    }
  }

  if (rollResult) {
    return null;
  }

  return (
    <DiceCheckRoll
      target={target}
      dms={dms}
      label={checkLabel}
      characteristic={characteristic}
      onResult={handleDiceResult}
    />
  );
}

// PickOne: like choice but for single-effect items
function PickOneResolver({
  effectNode,
  dispatch,
  accumulatedSignals,
  onComplete,
}: {
  effectNode: EffectNode;
  dispatch: ReturnType<typeof useCharacter>['dispatch'];
  accumulatedSignals: EffectSignal[];
  onComplete: (result: EffectResolverResult) => void;
}) {
  if (effectNode.type !== 'pickOne') return null;

  function handleSelect(index: number) {
    const option = (effectNode as Extract<EffectNode, { type: 'pickOne' }>).options[index];
    if (!option) return;

    const actions = resolveImmediate(option.effect, {} as Character);
    actions.forEach(dispatch);
    onComplete({ signals: accumulatedSignals });
  }

  return (
    <ChoicePanel
      prompt={effectNode.prompt}
      options={effectNode.options.map((opt) => ({ label: opt.label }))}
      onSelect={handleSelect}
    />
  );
}

// Narrative: freeform text, no mechanical effect
function NarrativeResolver({
  effectNode,
  accumulatedSignals,
  onComplete,
}: {
  effectNode: EffectNode;
  accumulatedSignals: EffectSignal[];
  onComplete: (result: EffectResolverResult) => void;
}) {
  if (effectNode.type !== 'narrative') return null;

  return (
    <div>
      <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
        {effectNode.prompt}
      </p>
      <button
        type="button"
        onClick={() => onComplete({ signals: accumulatedSignals })}
        style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
      >
        Continue
      </button>
    </div>
  );
}

// Fallback: handles increaseExistingSkill, diceRoll, rollOnTable
function FallbackResolver({
  pauseType,
  effectNode,
  character,
  dispatch,
  accumulatedSignals,
  onComplete,
  careerId,
}: {
  pauseType: string;
  effectNode: EffectNode;
  character: Character;
  dispatch: ReturnType<typeof useCharacter>['dispatch'];
  accumulatedSignals: EffectSignal[];
  onComplete: (result: EffectResolverResult) => void;
  careerId?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [takeLowerRolls, setTakeLowerRolls] = useState<[number, number] | null>(null);

  // increaseExistingSkill: pick from owned skills
  if (effectNode.type === 'increaseExistingSkill') {
    const ownedSkills = Object.keys(character.skills).filter((s) => character.skills[s] >= 0);

    if (ownedSkills.length === 0) {
      return (
        <div>
          <p>No skills to increase yet.</p>
          <button
            type="button"
            onClick={() => onComplete({ signals: accumulatedSignals })}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            Continue
          </button>
        </div>
      );
    }

    return (
      <div>
        <p>Choose a skill to increase by one level:</p>
        <SkillPicker
          skills={ownedSkills}
          maxPicks={1}
          selected={selected ? [selected] : []}
          onToggle={(skill) => setSelected(skill === selected ? null : skill)}
        />
        <button
          type="button"
          onClick={() => {
            if (!selected) return;
            dispatch({ type: 'INCREASE_SKILL', skill: selected });
            onComplete({ signals: accumulatedSignals });
          }}
          disabled={!selected}
          style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
        >
          Confirm
        </button>
      </div>
    );
  }

  // diceRoll: roll Dx, apply effect that many times
  if (effectNode.type === 'diceRoll') {
    const diceStr = effectNode.dice.toUpperCase();
    const perUnit = effectNode.effectPerUnit;

    function handleDiceRoll() {
      let result: number;
      if (diceStr === 'D3') {
        result = Math.ceil(rollD6() / 2); // 1-3
      } else if (diceStr === 'D6') {
        result = rollD6();
      } else {
        result = rollD6(); // Default to D6
      }
      setDiceResult(result);

      // Apply the effect that many times
      for (let i = 0; i < result; i++) {
        const actions = resolveImmediate(perUnit, character);
        actions.forEach(dispatch);
      }
    }

    return (
      <div>
        <p>Roll {effectNode.dice} to determine quantity.</p>
        {diceResult === null ? (
          <button
            type="button"
            onClick={handleDiceRoll}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            Roll {effectNode.dice}
          </button>
        ) : (
          <div>
            <p>Rolled: {diceResult}</p>
            <button
              type="button"
              onClick={() => onComplete({ signals: accumulatedSignals })}
              style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  // rollOnTable: resolve using shared tables or career-specific tables
  if (effectNode.type === 'rollOnTable') {
    const tableName = effectNode.table.replace(/-/g, ' ');

    // Resolve the table: shared tables first, then career-specific mishap table
    let table: SharedTable | null = getSharedTable(effectNode.table);
    if (!table && effectNode.table === 'mishap' && careerId) {
      try {
        const career = loadCareer(careerId);
        table = buildCareerMishapTable(career);
      } catch {
        // Career not found - fall through to "not implemented"
      }
    }

    if (!table) {
      // Table not implemented yet
      return (
        <div>
          <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
            Roll on the <strong>{tableName}</strong> table.
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            (Table not yet implemented - no mechanical effect applied.)
          </p>
          <button
            type="button"
            onClick={() => onComplete({ signals: accumulatedSignals })}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            Continue
          </button>
        </div>
      );
    }

    const useTakeLower = effectNode.modifier === 'takeLower';
    const rollDice = table.rollType === '2D6' ? roll2D6 : rollD6;

    // Table exists - roll and resolve
    if (diceResult === null) {
      return (
        <div>
          <p>Roll on the <strong>{tableName}</strong> table{useTakeLower ? ' (roll twice, take lower)' : ''}:</p>
          <button
            type="button"
            onClick={() => {
              let result: number;
              if (effectNode.fixedResult) {
                result = effectNode.fixedResult;
              } else if (useTakeLower) {
                const roll1 = rollDice();
                const roll2 = rollDice();
                result = Math.min(roll1, roll2);
                setTakeLowerRolls([roll1, roll2]);
              } else {
                result = rollDice();
              }
              setDiceResult(result);
            }}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            Roll
          </button>
        </div>
      );
    }

    // Have a roll result - show entry and resolve its effects
    const entry = table.entries[String(diceResult)];
    if (!entry) {
      return (
        <div>
          <p>Rolled {diceResult} on the {tableName} table - no entry found.</p>
          <button
            type="button"
            onClick={() => onComplete({ signals: accumulatedSignals })}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            Continue
          </button>
        </div>
      );
    }

    return (
      <div>
        {takeLowerRolls ? (
          <p>Rolled {takeLowerRolls[0]} and {takeLowerRolls[1]} on the {tableName} table (taking lower: {diceResult}):</p>
        ) : (
          <p>Rolled {diceResult} on the {tableName} table:</p>
        )}
        <p style={{ color: 'var(--color-text-secondary)' }}>{entry.description}</p>
        <EffectResolver
          effect={entry.effects}
          careerId={careerId}
          onComplete={(result) => {
            onComplete({ signals: [...accumulatedSignals, ...result.signals] });
          }}
        />
      </div>
    );
  }

  // Unknown pause type - allow continue
  return (
    <div>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Effect type &quot;{pauseType}&quot; is not yet fully implemented.
      </p>
      <button
        type="button"
        onClick={() => onComplete({ signals: accumulatedSignals })}
        style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
      >
        Continue
      </button>
    </div>
  );
}
