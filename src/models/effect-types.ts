import type { CharacteristicName, ContactType } from './types';

export interface GainSkillEffect {
  type: 'gainSkill';
  skill: string;
  level?: number;
}

export interface IncreaseSkillEffect {
  type: 'increaseSkill';
  skill: string;
}

export interface GainSpecialtyEffect {
  type: 'gainSpecialty';
  skill: string;
  specialty: string;
  level?: number;
}

export interface ModCharacteristicEffect {
  type: 'modCharacteristic';
  characteristic: CharacteristicName;
  value: number;
}

export interface EnsureCharacteristicEffect {
  type: 'ensureCharacteristic';
  characteristic: CharacteristicName;
  minimum: number;
  fallback: ModCharacteristicEffect;
}

export interface GainContactEffect {
  type: 'gainContact';
  contactType: ContactType;
  count?: number;
}

export interface GainBenefitDMEffect {
  type: 'gainBenefitDM';
  value: number;
}

export interface GainAdvancementDMEffect {
  type: 'gainAdvancementDM';
  value: number;
}

export interface RollOnTableEffect {
  type: 'rollOnTable';
  table: string;
  modifier?: 'takeLower' | 'takeHigher';
  fixedResult?: number;
}

export interface ForceCareerEffect {
  type: 'forceCareer';
  career: string;
}

export interface AutoPromoteEffect {
  type: 'autoPromote';
}

export interface EjectFromCareerEffect {
  type: 'ejectFromCareer';
}

export interface LoseBenefitRollEffect {
  type: 'loseBenefitRoll';
}

export interface SkillCheckEffect {
  type: 'skillCheck';
  skill?: string;
  characteristic?: CharacteristicName;
  target: number;
  success: EffectNode;
  failure: EffectNode;
  naturalTwo?: EffectNode;
}

export interface ChoiceEffect {
  type: 'choice';
  prompt: string;
  options: ChoiceOption[];
}

export interface ChoiceOption {
  label: string;
  effects: EffectNode[];
}

export interface PickSkillEffect {
  type: 'pickSkill';
  options: string[];
  level?: number;
}

export interface PickOneEffect {
  type: 'pickOne';
  prompt: string;
  options: { label: string; effect: EffectNode }[];
}

export interface DiceRollEffect {
  type: 'diceRoll';
  dice: string;
  effectPerUnit: EffectNode;
}

export interface NarrativeEffect {
  type: 'narrative';
  prompt: string;
}

export interface CompoundEffect {
  type: 'compound';
  effects: EffectNode[];
}

export interface GainEquipmentEffect {
  type: 'gainEquipment';
  item: string;
}

export interface IncreaseExistingSkillEffect {
  type: 'increaseExistingSkill';
  filter?: 'owned';
}

export interface NoEffect {
  type: 'none';
}

export type EffectNode =
  | GainSkillEffect
  | IncreaseSkillEffect
  | GainSpecialtyEffect
  | ModCharacteristicEffect
  | EnsureCharacteristicEffect
  | GainContactEffect
  | GainBenefitDMEffect
  | GainAdvancementDMEffect
  | RollOnTableEffect
  | ForceCareerEffect
  | AutoPromoteEffect
  | EjectFromCareerEffect
  | LoseBenefitRollEffect
  | SkillCheckEffect
  | ChoiceEffect
  | PickSkillEffect
  | PickOneEffect
  | DiceRollEffect
  | NarrativeEffect
  | CompoundEffect
  | GainEquipmentEffect
  | IncreaseExistingSkillEffect
  | NoEffect;
