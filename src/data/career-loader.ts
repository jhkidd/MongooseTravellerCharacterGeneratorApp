import type { CareerData } from '../models/career-types';
import agentData from './careers/agent.json';
import armyData from './careers/army.json';

const CAREERS: Record<string, CareerData> = {
  agent: agentData as unknown as CareerData,
  army: armyData as unknown as CareerData,
};

/** Load a career by its id. Throws if not found. */
export function loadCareer(id: string): CareerData {
  const career = CAREERS[id];
  if (!career) {
    throw new Error(`Unknown career: "${id}". Available careers: ${getAllCareerIds().join(', ')}`);
  }

  return career;
}

/** Returns all available career ids. */
export function getAllCareerIds(): string[] {
  return Object.keys(CAREERS);
}

/** Returns all available careers that players can choose (non-special). */
export function getSelectableCareers(): CareerData[] {
  return Object.values(CAREERS).filter((career) => !career.isSpecial);
}
