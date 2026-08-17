import { rollD6, roll2D6, rollD3 } from './dice';
import {
  getTemperatureBandIndex,
  TL_STARPORT_DM,
  TL_SIZE_DM,
  TL_ATMOSPHERE_DM,
  TL_HYDROGRAPHICS_DM,
  TL_POPULATION_DM,
  TL_GOVERNMENT_DM,
  TRADE_CODE_DEFINITIONS,
} from '../data/planet-tables';
import type { Bases, Faction, Planet, StarportClass, TradeCode, TravelZone } from '../models/planet';

const HEX_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Converts a numeric code to its Traveller hex-notation digit (0-9, then A-Z for higher values). */
export function toHexDigit(value: number): string {
  const index = clamp(Math.round(value), 0, HEX_DIGITS.length - 1);
  return HEX_DIGITS[index];
}

// --- Gas Giant ---

export function computeHasGasGiant(diceSum: number): boolean {
  return diceSum < 10;
}

export function rollGasGiant(): boolean {
  return computeHasGasGiant(roll2D6());
}

// --- Size ---

export function computeSize(diceSum: number): number {
  return clamp(diceSum - 2, 0, 10);
}

export function rollSize(): number {
  return computeSize(roll2D6());
}

// --- Atmosphere ---

export function computeAtmosphere(diceSum: number, size: number): number {
  return clamp(diceSum - 7 + size, 0, 15);
}

export function rollAtmosphere(size: number): number {
  return computeAtmosphere(roll2D6(), size);
}

// --- Temperature ---

export function getTemperatureDM(atmosphere: number): number {
  if (atmosphere === 2 || atmosphere === 3) return -2;
  if (atmosphere === 4 || atmosphere === 5 || atmosphere === 14) return -1;
  if (atmosphere === 8 || atmosphere === 9) return 1;
  if (atmosphere === 10 || atmosphere === 13 || atmosphere === 15) return 2;
  if (atmosphere === 11 || atmosphere === 12) return 6;
  return 0;
}

export function computeTemperature(diceSum: number, atmosphere: number): number {
  return diceSum + getTemperatureDM(atmosphere);
}

export function rollTemperature(atmosphere: number): number {
  return computeTemperature(roll2D6(), atmosphere);
}

// --- Hydrographics ---

const HYDROGRAPHICS_ATMOSPHERE_PENALTY = new Set([0, 1, 10, 11, 12, 13, 14, 15]);

export function computeHydrographics(diceSum: number, size: number, atmosphere: number, temperature: number): number {
  if (size <= 1) {
    return 0;
  }

  let value = diceSum - 7 + atmosphere;

  if (HYDROGRAPHICS_ATMOSPHERE_PENALTY.has(atmosphere)) {
    value -= 4;
  }

  if (atmosphere !== 13 && atmosphere !== 15) {
    const temperatureBand = getTemperatureBandIndex(temperature);
    if (temperatureBand === 3) value -= 2; // Hot
    if (temperatureBand === 4) value -= 6; // Boiling
  }

  return clamp(value, 0, 10);
}

export function rollHydrographics(size: number, atmosphere: number, temperature: number): number {
  return computeHydrographics(roll2D6(), size, atmosphere, temperature);
}

// --- Population ---

export function computePopulation(diceSum: number): number {
  return clamp(diceSum - 2, 0, 10);
}

export function rollPopulation(): number {
  return computePopulation(roll2D6());
}

// --- Government ---

export function computeGovernment(diceSum: number, population: number): number {
  if (population === 0) {
    return 0;
  }
  return clamp(diceSum - 7 + population, 0, 15);
}

export function rollGovernment(population: number): number {
  return computeGovernment(roll2D6(), population);
}

// --- Rival Factions ---

export function computeFactionCount(baseCount: number, government: number, population: number): number {
  if (population === 0) {
    return 0;
  }

  let dm = 0;
  if (government === 0 || government === 7) dm = 1;
  else if (government >= 10) dm = -1;

  return Math.max(0, baseCount + dm);
}

export function rollFactionCount(government: number, population: number): number {
  return computeFactionCount(rollD3(), government, population);
}

export function computeFaction(governmentDiceSum: number, population: number, strengthDiceSum: number): Faction {
  return {
    government: computeGovernment(governmentDiceSum, population),
    strength: strengthDiceSum,
  };
}

export function rollFaction(population: number): Faction {
  return computeFaction(roll2D6(), population, roll2D6());
}

export function rollFactions(government: number, population: number): Faction[] {
  const count = rollFactionCount(government, population);
  return Array.from({ length: count }, () => rollFaction(population));
}

// --- Law Level ---

export function computeLawLevel(diceSum: number, government: number, population: number): number {
  if (population === 0) {
    return 0;
  }
  return clamp(diceSum - 7 + government, 0, 15);
}

export function rollLawLevel(government: number, population: number): number {
  return computeLawLevel(roll2D6(), government, population);
}

// --- Starport ---

export function getStarportPopulationDM(population: number): number {
  if (population >= 10) return 2;
  if (population >= 8) return 1;
  if (population <= 2) return -2;
  if (population <= 4) return -1;
  return 0;
}

export function computeStarportClass(diceSum: number, population: number): StarportClass {
  const result = diceSum + getStarportPopulationDM(population);
  if (result <= 2) return 'X';
  if (result <= 4) return 'E';
  if (result <= 6) return 'D';
  if (result <= 8) return 'C';
  if (result <= 10) return 'B';
  return 'A';
}

export function rollStarportClass(population: number): StarportClass {
  return computeStarportClass(roll2D6(), population);
}

// --- Tech Level ---

export function computeTechLevel(
  diceRoll: number,
  starport: StarportClass,
  size: number,
  atmosphere: number,
  hydrographics: number,
  population: number,
  government: number,
): number {
  if (population === 0) {
    return 0;
  }

  const dm = TL_STARPORT_DM[starport]
    + TL_SIZE_DM[size]
    + TL_ATMOSPHERE_DM[atmosphere]
    + TL_HYDROGRAPHICS_DM[hydrographics]
    + TL_POPULATION_DM[population]
    + TL_GOVERNMENT_DM[government];

  return Math.max(0, diceRoll + dm);
}

export function rollTechLevel(
  starport: StarportClass,
  size: number,
  atmosphere: number,
  hydrographics: number,
  population: number,
  government: number,
): number {
  return computeTechLevel(rollD6(), starport, size, atmosphere, hydrographics, population, government);
}

// --- Bases & Highport ---

export interface BaseRolls {
  highport: number;
  scout: number;
  naval: number;
  military: number;
  corsair: number;
}

export function getHighportDM(techLevel: number, population: number): number {
  let dm = 0;
  if (techLevel >= 12) dm += 2;
  else if (techLevel >= 9) dm += 1;

  if (population >= 9) dm += 1;
  else if (population <= 6) dm -= 1;

  return dm;
}

export function getCorsairDM(lawLevel: number): number {
  if (lawLevel === 0) return 2;
  if (lawLevel >= 2) return -2;
  return 0;
}

export function computeBases(
  starport: StarportClass,
  techLevel: number,
  population: number,
  lawLevel: number,
  rolls: BaseRolls,
): Bases {
  const highportDM = getHighportDM(techLevel, population);
  const corsairDM = getCorsairDM(lawLevel);

  const bases: Bases = {
    scout: false,
    naval: false,
    military: false,
    corsair: false,
    highport: false,
  };

  switch (starport) {
    case 'X':
      bases.corsair = rolls.corsair + corsairDM >= 10;
      break;
    case 'E':
      bases.corsair = rolls.corsair + corsairDM >= 10;
      break;
    case 'D':
      bases.scout = rolls.scout >= 8;
      bases.corsair = rolls.corsair + corsairDM >= 12;
      bases.highport = rolls.highport + highportDM >= 12;
      break;
    case 'C':
      bases.military = rolls.military >= 10;
      bases.scout = rolls.scout >= 9;
      bases.highport = rolls.highport + highportDM >= 10;
      break;
    case 'B':
      bases.military = rolls.military >= 8;
      bases.naval = rolls.naval >= 8;
      bases.scout = rolls.scout >= 9;
      bases.highport = rolls.highport + highportDM >= 8;
      break;
    case 'A':
      bases.military = rolls.military >= 8;
      bases.naval = rolls.naval >= 8;
      bases.scout = rolls.scout >= 10;
      bases.highport = rolls.highport + highportDM >= 6;
      break;
  }

  return bases;
}

export function rollBases(starport: StarportClass, techLevel: number, population: number, lawLevel: number): Bases {
  return computeBases(starport, techLevel, population, lawLevel, {
    highport: roll2D6(),
    scout: roll2D6(),
    naval: roll2D6(),
    military: roll2D6(),
    corsair: roll2D6(),
  });
}

// --- Trade Codes ---

export interface TradeCodeStats {
  size: number;
  atmosphere: number;
  hydrographics: number;
  population: number;
  government: number;
  lawLevel: number;
  techLevel: number;
}

export function computeTradeCodes(stats: TradeCodeStats): TradeCode[] {
  return TRADE_CODE_DEFINITIONS
    .filter((definition) => definition.matches(stats))
    .map(({ code, name }) => ({ code, name }));
}

// --- Travel Zone ---

const AMBER_GOVERNMENTS = new Set([0, 7, 10]);

export function computeTravelZone(atmosphere: number, government: number, lawLevel: number): TravelZone {
  if (atmosphere >= 10 || AMBER_GOVERNMENTS.has(government) || lawLevel === 0 || lawLevel >= 9) {
    return 'Amber';
  }
  return null;
}

// --- UWP Formatting ---

/** Renders a planet's Universal World Profile line, e.g. `COGRI 0101 CA6A643-9 N RI WA A`. */
export function formatUwp(planet: Planet): string {
  const profile = [
    planet.starport,
    toHexDigit(planet.size),
    toHexDigit(planet.atmosphere),
    toHexDigit(planet.hydrographics),
    toHexDigit(planet.population),
    toHexDigit(planet.government),
    toHexDigit(planet.lawLevel),
  ].join('') + '-' + toHexDigit(planet.techLevel);

  const baseCodes = [
    planet.bases.naval ? 'N' : '',
    planet.bases.scout ? 'S' : '',
    planet.bases.military ? 'M' : '',
    planet.bases.corsair ? 'C' : '',
  ].join('');

  const tradeCodeText = planet.tradeCodes.map((tc) => tc.code.toUpperCase()).join(' ');
  const travelZoneCode = planet.travelZone === 'Amber' ? 'A' : planet.travelZone === 'Red' ? 'R' : '';

  return [
    planet.name.trim() || 'Unnamed',
    planet.hexLocation.trim() || '0000',
    profile,
    baseCodes,
    tradeCodeText,
    travelZoneCode,
  ].filter(Boolean).join(' ');
}

// --- Full Generation ---

/** Generates a complete Traveller world, running through every step of the world creation rules. */
export function generatePlanet(name = '', hexLocation = ''): Planet {
  const hasGasGiant = rollGasGiant();
  const size = rollSize();
  const atmosphere = rollAtmosphere(size);
  const temperature = rollTemperature(atmosphere);
  const hydrographics = rollHydrographics(size, atmosphere, temperature);
  const population = rollPopulation();
  const government = rollGovernment(population);
  const factions = rollFactions(government, population);
  const lawLevel = rollLawLevel(government, population);
  const starport = rollStarportClass(population);
  const techLevel = rollTechLevel(starport, size, atmosphere, hydrographics, population, government);
  const bases = rollBases(starport, techLevel, population, lawLevel);
  const tradeCodes = computeTradeCodes({ size, atmosphere, hydrographics, population, government, lawLevel, techLevel });
  const travelZone = computeTravelZone(atmosphere, government, lawLevel);

  return {
    name,
    hexLocation,
    hasGasGiant,
    size,
    atmosphere,
    temperature,
    hydrographics,
    population,
    government,
    lawLevel,
    techLevel,
    starport,
    bases,
    factions,
    tradeCodes,
    travelZone,
  };
}
