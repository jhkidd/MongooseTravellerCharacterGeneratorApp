import type { EffectNode } from '../models/effect-types';
import type { Character } from '../models/types';
import { characterReducer, type CharacterAction } from './character-reducer';

export type EffectSignal =
  | 'ejectFromCareer'
  | 'autoPromote'
  | 'loseBenefitRoll'
  | `forceCareer:${string}`
  | `advancementDM:${number}`;

export type InterpretedEffect =
  | {
      type: 'immediate';
      actions: CharacterAction[];
      signals: EffectSignal[];
    }
  | {
      type: 'pause';
      pauseType: 'choice' | 'pickSkill' | 'pickOne' | 'narrative' | 'skillCheck' | 'increaseExistingSkill' | 'diceRoll' | 'rollOnTable' | 'gainContact';
      prompt?: string;
      options?: unknown[];
      immediateActions?: CharacterAction[];
      effectNode: EffectNode;
      pendingEffects?: EffectNode[];
    };

export function resolveImmediate(node: EffectNode, character: Character): CharacterAction[] {
  switch (node.type) {
    case 'gainSkill':
      return [{ type: 'GAIN_SKILL', skill: node.skill, level: node.level ?? 0 }];

    case 'increaseSkill':
      return [{ type: 'INCREASE_SKILL', skill: node.skill }];

    case 'gainSpecialty':
      return [
        {
          type: 'GAIN_SPECIALTY',
          skill: node.skill,
          specialty: node.specialty,
          level: node.level ?? 1,
        },
      ];

    case 'modCharacteristic':
      return [{ type: 'MOD_CHARACTERISTIC', characteristic: node.characteristic, value: node.value }];

    case 'ensureCharacteristic':
      return [
        {
          type: 'ENSURE_CHARACTERISTIC',
          characteristic: node.characteristic,
          minimum: node.minimum,
          fallbackMod: node.fallback.value,
        },
      ];

    case 'gainContact':
      return Array.from({ length: node.count ?? 1 }, () => ({
        type: 'GAIN_CONTACT' as const,
        contactType: node.contactType,
        name: '',
        description: '',
      }));

    case 'gainBenefitDM':
      return [{ type: 'MOD_BENEFIT_DM', value: node.value }];

    case 'gainEquipment':
      return [{ type: 'ADD_EQUIPMENT', item: node.item }];

    case 'compound': {
      const actions: CharacterAction[] = [];
      let currentCharacter = character;

      for (const child of node.effects) {
        if (isInteractive(child)) {
          break;
        }

        const childActions = resolveImmediate(child, currentCharacter);
        actions.push(...childActions);
        currentCharacter = applyActions(currentCharacter, childActions);
      }

      return actions;
    }

    case 'none':
      return [];

    default:
      return [];
  }
}

export function interpretEffect(node: EffectNode, character: Character): InterpretedEffect {
  switch (node.type) {
    case 'choice':
      return {
        type: 'pause',
        pauseType: 'choice',
        prompt: node.prompt,
        options: node.options.map((option) => ({ label: option.label, effects: option.effects })),
        effectNode: node,
      };

    case 'pickSkill':
      return {
        type: 'pause',
        pauseType: 'pickSkill',
        options: node.options,
        effectNode: node,
      };

    case 'pickOne':
      return {
        type: 'pause',
        pauseType: 'pickOne',
        prompt: node.prompt,
        options: node.options.map((option) => ({ label: option.label, effect: option.effect })),
        effectNode: node,
      };

    case 'narrative':
      return {
        type: 'pause',
        pauseType: 'narrative',
        prompt: node.prompt,
        effectNode: node,
      };

    case 'skillCheck':
      return {
        type: 'pause',
        pauseType: 'skillCheck',
        prompt: `${node.skill ?? node.characteristic ?? 'Check'} ${node.target}+`,
        effectNode: node,
      };

    case 'increaseExistingSkill':
      return {
        type: 'pause',
        pauseType: 'increaseExistingSkill',
        options: Object.keys(character.skills),
        effectNode: node,
      };

    case 'diceRoll':
      return {
        type: 'pause',
        pauseType: 'diceRoll',
        prompt: `Roll ${node.dice}`,
        effectNode: node,
      };

    case 'rollOnTable':
      return {
        type: 'pause',
        pauseType: 'rollOnTable',
        prompt: `Roll on ${node.table}`,
        effectNode: node,
      };

    case 'gainContact':
      return {
        type: 'pause',
        pauseType: 'gainContact',
        prompt: `Gain a new ${node.contactType}`,
        effectNode: node,
      };

    case 'ejectFromCareer':
      return { type: 'immediate', actions: [], signals: ['ejectFromCareer'] };

    case 'autoPromote':
      return { type: 'immediate', actions: [], signals: ['autoPromote'] };

    case 'loseBenefitRoll':
      return { type: 'immediate', actions: [], signals: ['loseBenefitRoll'] };

    case 'forceCareer':
      return { type: 'immediate', actions: [], signals: [`forceCareer:${node.career}`] };

    case 'gainAdvancementDM':
      return { type: 'immediate', actions: [], signals: [`advancementDM:${node.value}`] };

    case 'compound': {
      const actions: CharacterAction[] = [];
      const signals: EffectSignal[] = [];
      let currentCharacter = character;

      for (let i = 0; i < node.effects.length; i++) {
        const child = node.effects[i];
        const childResult = interpretEffect(child, currentCharacter);

        if (childResult.type === 'pause') {
          const immediateActions = [...actions, ...(childResult.immediateActions ?? [])];
          const remainingEffects = [
            ...(childResult.pendingEffects ?? []),
            ...node.effects.slice(i + 1),
          ];
          return {
            ...childResult,
            immediateActions,
            pendingEffects: remainingEffects.length > 0 ? remainingEffects : undefined,
          };
        }

        actions.push(...childResult.actions);
        signals.push(...childResult.signals);
        currentCharacter = applyActions(currentCharacter, childResult.actions);
      }

      return { type: 'immediate', actions, signals };
    }

    default:
      return {
        type: 'immediate',
        actions: resolveImmediate(node, character),
        signals: [],
      };
  }
}

const INTERACTIVE_TYPES = new Set<EffectNode['type']>([
  'choice',
  'pickSkill',
  'pickOne',
  'narrative',
  'skillCheck',
  'increaseExistingSkill',
  'diceRoll',
  'rollOnTable',
  'gainContact',
]);

function isInteractive(node: EffectNode): boolean {
  if (INTERACTIVE_TYPES.has(node.type)) {
    return true;
  }

  if (node.type === 'compound') {
    return node.effects.some(isInteractive);
  }

  return false;
}

function applyActions(character: Character, actions: CharacterAction[]): Character {
  return actions.reduce((currentCharacter, action) => characterReducer(currentCharacter, action), character);
}
