import type { CareerData } from '../models/career-types';
import agentData from './careers/agent.json';
import armyData from './careers/army.json';
import citizenData from './careers/citizen.json';
import drifterData from './careers/drifter.json';
import entertainerData from './careers/entertainer.json';
import marineData from './careers/marine.json';
import merchantData from './careers/merchant.json';
import navyData from './careers/navy.json';
import nobleData from './careers/noble.json';
import rogueData from './careers/rogue.json';
import scholarData from './careers/scholar.json';
import scoutData from './careers/scout.json';

const CAREERS: Record<string, CareerData> = {
  agent: agentData as unknown as CareerData,
  army: armyData as unknown as CareerData,
  citizen: citizenData as unknown as CareerData,
  drifter: drifterData as unknown as CareerData,
  entertainer: entertainerData as unknown as CareerData,
  marine: marineData as unknown as CareerData,
  merchant: merchantData as unknown as CareerData,
  navy: navyData as unknown as CareerData,
  noble: nobleData as unknown as CareerData,
  rogue: rogueData as unknown as CareerData,
  scholar: scholarData as unknown as CareerData,
  scout: scoutData as unknown as CareerData,
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
