import { getAllCareerIds, loadCareer } from '../../data/career-loader';
import { getDM } from '../../engine/dice';
import type { Character } from '../../models/types';
import type { CareerData, QualificationCheck, SkillTableEntry } from '../../models/career-types';
import type { PhaseContext } from '../../engine/state-machine';

export interface SkillGrantOption {
  label: string;
  skill: string;
  specialty?: string;
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function tryLoadCareer(careerId: string | null): CareerData | null {
  if (!careerId || !getAllCareerIds().includes(careerId)) {
    return null;
  }

  return loadCareer(careerId);
}

export function getCareerDisplayName(careerId: string | null): string {
  const career = tryLoadCareer(careerId);
  return career?.name ?? titleCase(careerId ?? 'career');
}

export interface ItemisedDM {
  label: string;
  value: number;
}

export function getQualificationDMs(
  qualification: QualificationCheck | null | undefined,
  character: Character,
  context: Pick<PhaseContext, 'previousCareers'>,
): ItemisedDM[] {
  if (!qualification) return [];

  const items: ItemisedDM[] = [];

  const charDM = getDM(character.characteristics[qualification.characteristic]);
  if (charDM !== 0) {
    items.push({ label: `${qualification.characteristic} DM`, value: charDM });
  }

  for (const modifier of qualification.modifiers ?? []) {
    if (modifier.type === 'previousCareers' && context.previousCareers.length > 0) {
      const value = (modifier.dmPer ?? 0) * context.previousCareers.length;
      if (value !== 0) {
        items.push({ label: `Previous careers (${context.previousCareers.length})`, value });
      }
    } else if (modifier.type === 'age' && character.age >= (modifier.threshold ?? Number.MAX_SAFE_INTEGER)) {
      const value = modifier.dm ?? 0;
      if (value !== 0) {
        items.push({ label: `Age ${character.age}+`, value });
      }
    }
  }

  return items;
}

export function getQualificationDM(
  qualification: QualificationCheck | null | undefined,
  character: Character,
  context: Pick<PhaseContext, 'previousCareers'>,
): number {
  return getQualificationDMs(qualification, character, context)
    .reduce((sum, dm) => sum + dm.value, 0);
}

export function extractSkillGrantOptions(entries: Record<number, SkillTableEntry>): SkillGrantOption[] {
  const options = Object.values(entries).flatMap(flattenSkillEntry);

  return options.filter((option, index, allOptions) => (
    allOptions.findIndex((candidate) => candidate.label === option.label) === index
  ));
}

function flattenSkillEntry(entry: SkillTableEntry): SkillGrantOption[] {
  switch (entry.type) {
    case 'skill':
      return [{
        label: entry.specialty ? `${entry.skill} (${entry.specialty})` : entry.skill,
        skill: entry.skill,
        specialty: entry.specialty,
      }];

    case 'choice':
      return entry.options.flatMap(flattenSkillEntry);

    default:
      return [];
  }
}
