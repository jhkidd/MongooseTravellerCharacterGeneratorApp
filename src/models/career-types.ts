import type { CharacteristicName } from './types';
import type { EffectNode } from './effect-types';

export interface QualificationModifier {
  type: 'previousCareers' | 'age';
  dmPer?: number;
  threshold?: number;
  dm?: number;
}

export interface QualificationCheck {
  characteristic: CharacteristicName;
  target: number;
  modifiers?: QualificationModifier[];
}

export interface CommissionCheck {
  characteristic: CharacteristicName;
  target: number;
}

export interface CharacteristicCheck {
  characteristic: CharacteristicName;
  target: number;
}

export interface Assignment {
  id: string;
  name: string;
  description: string;
  survivalCheck: CharacteristicCheck;
  advancementCheck: CharacteristicCheck;
}

export type SkillTableRestriction =
  | { type: 'minEdu'; value: number }
  | { type: 'officer' }
  | { type: 'assignment'; assignmentId: string };

export type SkillTableEntry =
  | { type: 'skill'; skill: string; specialty?: string }
  | { type: 'characteristic'; characteristic: CharacteristicName; value: number }
  | { type: 'choice'; options: SkillTableEntry[] };

export interface SkillTable {
  id: string;
  name: string;
  restriction?: SkillTableRestriction;
  entries: Record<number, SkillTableEntry>;
}

export interface RankEntry {
  title: string;
  bonus?: EffectNode;
}

export type RankTrack = Record<number, RankEntry>;

export interface RankStructure {
  type: 'default' | 'split' | 'assignment';
  tracks: Record<string, RankTrack>;
}

export interface MishapEntry {
  description: string;
  effects: EffectNode;
}

export interface EventEntry {
  description: string;
  effects: EffectNode;
}

export interface MusterBenefit {
  description: string;
  effects: EffectNode;
}

export interface MusteringOutTable {
  cash: Record<number, number>;
  benefits: Record<number, MusterBenefit>;
}

export interface CareerData {
  id: string;
  name: string;
  description: string;
  qualification: QualificationCheck | null;
  commission?: CommissionCheck;
  assignments: Assignment[];
  skillTables: SkillTable[];
  ranks: RankStructure;
  mishaps: Record<number, MishapEntry>;
  events: Record<number, EventEntry>;
  musteringOut: MusteringOutTable;
  isSpecial?: boolean;
}
