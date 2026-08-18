import { rollD6, roll2D6 } from './dice';
import {
  computeTradeCodes,
  computeTravelZone,
} from './planet-generator';
import {
  PASSENGER_TRAFFIC_TABLE,
  FREIGHT_TRAFFIC_TABLE,
  getDiceCountForRoll,
  getPassageFreightRow,
  getModifiedPriceRow,
  getPopulationPassengerDM,
  getPopulationFreightDM,
  getStarportTradeDM,
  getZonePassengerDM,
  getZoneFreightDM,
  getTechLevelFreightDM,
  FREIGHT_LOT_DICE,
  TRADE_GOODS_TABLE,
} from '../data/trade-tables';
import type {
  AvailableGood,
  FreightLotSize,
  ParsedWorld,
  PassengerClass,
  SpeculativeMode,
  TradeGoodDefinition,
} from '../models/trade';
import type { StarportClass, TravelZone } from '../models/planet';

const HEX_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function fromHexDigit(digit: string): number {
  const index = HEX_DIGITS.indexOf(digit.toUpperCase());
  return index < 0 ? 0 : index;
}

// --- UWP Parsing ---

const UWP_PATTERN = /\b([A-EX])([0-9A-Z])([0-9A-Z])([0-9A-Z])([0-9A-Z])([0-9A-Z])([0-9A-Z])-([0-9A-Z])\b/i;

/**
 * Extracts a Universal World Profile from anywhere within a pasted string (which may also
 * contain a world name and sector hex location, or just be the bare profile) and derives
 * trade codes / travel zone from the recovered stats. Returns null if no UWP is found.
 */
export function parseUwp(input: string): ParsedWorld | null {
  const match = UWP_PATTERN.exec(input.trim());
  if (!match) return null;

  const [raw, starport, sizeDigit, atmDigit, hydroDigit, popDigit, govDigit, lawDigit, techDigit] = match;

  const size = fromHexDigit(sizeDigit);
  const atmosphere = fromHexDigit(atmDigit);
  const hydrographics = fromHexDigit(hydroDigit);
  const population = fromHexDigit(popDigit);
  const government = fromHexDigit(govDigit);
  const lawLevel = fromHexDigit(lawDigit);
  const techLevel = fromHexDigit(techDigit);

  const tradeCodes = computeTradeCodes({ size, atmosphere, hydrographics, population, government, lawLevel, techLevel });
  const travelZone = computeTravelZone(atmosphere, government, lawLevel);

  return {
    raw,
    starport: starport.toUpperCase() as StarportClass,
    size,
    atmosphere,
    hydrographics,
    population,
    government,
    lawLevel,
    techLevel,
    tradeCodes,
    travelZone,
  };
}

// --- Passengers ---

export interface PassengerTrafficParams {
  passengerClass: PassengerClass;
  skillEffect: number;
  stewardSkill: number;
  sourcePopulation: number;
  destPopulation: number;
  sourceStarport: StarportClass;
  destStarport: StarportClass;
  travelZone: TravelZone;
  parsecs: number;
}

/** Computes the total 2D modifier for a passenger-traffic roll, per the Passengers rules. */
export function computePassengerModifier(params: PassengerTrafficParams): number {
  const { passengerClass, skillEffect, stewardSkill, sourcePopulation, destPopulation, sourceStarport, destStarport, travelZone, parsecs } = params;

  let dm = skillEffect + stewardSkill;
  if (passengerClass === 'High') dm -= 4;
  if (passengerClass === 'Low') dm += 1;
  dm += getPopulationPassengerDM(sourcePopulation);
  dm += getPopulationPassengerDM(destPopulation);
  dm += getStarportTradeDM(sourceStarport);
  dm += getStarportTradeDM(destStarport);
  dm += getZonePassengerDM(travelZone);
  dm -= Math.max(0, parsecs - 1);
  return dm;
}

/** Rolls (or accepts a supplied) 2D traffic roll and resolves it to a dice-count, then simulates that many D6. */
export function computePassengerTraffic(twoDRoll: number, modifier: number, diceRolls: number[]): number {
  const modified = twoDRoll + modifier;
  const diceCount = getDiceCountForRoll(PASSENGER_TRAFFIC_TABLE, modified);
  if (diceCount === 0) return 0;
  return diceRolls.slice(0, diceCount).reduce((sum, r) => sum + r, 0);
}

export function rollPassengerTraffic(modifier: number): number {
  const twoD = roll2D6();
  const modified = twoD + modifier;
  const diceCount = getDiceCountForRoll(PASSENGER_TRAFFIC_TABLE, modified);
  const rolls = Array.from({ length: diceCount }, () => rollD6());
  return computePassengerTraffic(twoD, modifier, rolls);
}

/** Looks up the single-jump fare for a passenger class at a given parsec distance. */
export function getPassageFare(parsecs: number, passengerClass: PassengerClass): number {
  const row = getPassageFreightRow(parsecs);
  switch (passengerClass) {
    case 'High': return row.high;
    case 'Middle': return row.middle;
    case 'Basic': return row.basic;
    case 'Low': return row.low;
  }
}

// --- Freight ---

export interface FreightTrafficParams {
  lotSize: FreightLotSize;
  skillEffect: number;
  sourcePopulation: number;
  destPopulation: number;
  sourceStarport: StarportClass;
  destStarport: StarportClass;
  techLevel: number;
  travelZone: TravelZone;
  parsecs: number;
}

/** Computes the total 2D modifier for a freight-traffic roll, per the Freight rules. */
export function computeFreightModifier(params: FreightTrafficParams): number {
  const { lotSize, skillEffect, sourcePopulation, destPopulation, sourceStarport, destStarport, techLevel, travelZone, parsecs } = params;

  let dm = skillEffect;
  if (lotSize === 'Major') dm -= 4;
  if (lotSize === 'Incidental') dm += 2;
  dm += getPopulationFreightDM(sourcePopulation);
  dm += getPopulationFreightDM(destPopulation);
  dm += getStarportTradeDM(sourceStarport);
  dm += getStarportTradeDM(destStarport);
  dm += getTechLevelFreightDM(techLevel);
  dm += getZoneFreightDM(travelZone);
  dm -= Math.max(0, parsecs - 1);
  return dm;
}

export function computeFreightTraffic(twoDRoll: number, modifier: number, diceRolls: number[]): number {
  const modified = twoDRoll + modifier;
  const diceCount = getDiceCountForRoll(FREIGHT_TRAFFIC_TABLE, modified);
  if (diceCount === 0) return 0;
  return diceRolls.slice(0, diceCount).reduce((sum, r) => sum + r, 0);
}

export function rollFreightTraffic(modifier: number): number {
  const twoD = roll2D6();
  const modified = twoD + modifier;
  const diceCount = getDiceCountForRoll(FREIGHT_TRAFFIC_TABLE, modified);
  const rolls = Array.from({ length: diceCount }, () => rollD6());
  return computeFreightTraffic(twoD, modifier, rolls);
}

/** Computes tonnage for a single lot of a given size from raw dice rolls. */
export function computeLotTonnage(lotSize: FreightLotSize, diceRolls: number[]): number {
  const { dice, multiplier } = FREIGHT_LOT_DICE[lotSize];
  const sum = diceRolls.slice(0, dice).reduce((total, r) => total + r, 0);
  return sum * multiplier;
}

export function rollLotTonnage(lotSize: FreightLotSize): number {
  const { dice } = FREIGHT_LOT_DICE[lotSize];
  const rolls = Array.from({ length: dice }, () => rollD6());
  return computeLotTonnage(lotSize, rolls);
}

export function getFreightRate(parsecs: number): number {
  return getPassageFreightRow(parsecs).freightPerTon;
}

// --- Mail ---

export interface MailAvailabilityParams {
  freightTrafficDM: number;
  shipArmed: boolean;
  techLevel: number;
  socDm: number;
  navalOrScoutRank: number;
}

/** Computes the total 2D modifier for the mail-availability roll, per the Mail rules. */
export function computeMailModifier(params: MailAvailabilityParams): number {
  const { freightTrafficDM, shipArmed, techLevel, socDm, navalOrScoutRank } = params;

  let dm = 0;
  if (freightTrafficDM <= -10) dm -= 2;
  else if (freightTrafficDM <= -5) dm -= 1;
  else if (freightTrafficDM >= 10) dm += 2;
  else if (freightTrafficDM >= 5) dm += 1;

  if (shipArmed) dm += 2;
  if (techLevel <= 5) dm -= 4;
  dm += socDm;
  dm += navalOrScoutRank;
  return dm;
}

/** A 2D roll of 12+ (after modifiers) means mail is available for this run. */
export function computeMailAvailable(twoDRoll: number, modifier: number): boolean {
  return twoDRoll + modifier >= 12;
}

export function rollMailAvailable(modifier: number): boolean {
  return computeMailAvailable(roll2D6(), modifier);
}

/** Mail containers: 1D available, 5 tons and Cr25000 each, all-or-nothing. */
export function computeMailContainers(diceSum: number): number {
  return diceSum;
}

export function rollMailContainers(): number {
  return computeMailContainers(rollD6());
}

export const MAIL_CONTAINER_TONS = 5;
export const MAIL_CONTAINER_PAYMENT = 25000;

// --- Speculative Trade ---

const D66_REROLL_MIN = '61';
const D66_REROLL_MAX = '65';

function rollD66(): string {
  return `${rollD6()}${rollD6()}`;
}

/** Rolls a single D66 result on the Trade Goods table, honouring the legal/black-market reroll rule. */
export function rollTradeGoodD66(mode: SpeculativeMode): string {
  let result = rollD66();
  if (mode === 'legal') {
    while (result >= D66_REROLL_MIN && result <= D66_REROLL_MAX) {
      result = rollD66();
    }
  }
  return result;
}

/** Rolls a single illegal-goods D66 result (61-66) for a black market supplier's extra stock. */
export function rollIllegalGoodD66(): string {
  return `6${rollD6()}`;
}

export interface AvailableGoodsParams {
  population: number;
  tradeCodes: string[];
  mode: SpeculativeMode;
}

/** Applies the population-based tonnage DM (Pop <=3: -3, Pop >=9: +3) to a raw dice sum, floored at 0. */
export function applyPopulationTonnageDm(diceSum: number, population: number): number {
  let dm = 0;
  if (population <= 3) dm = -3;
  else if (population >= 9) dm = 3;
  return Math.max(0, diceSum + dm);
}

/**
 * Assembles the list of goods available from a supplier: every Common good, every good matching
 * the world's trade codes, and one randomly-rolled good per point of Population. In black-market
 * mode, illegal goods matching trade codes are also included, plus one extra random illegal roll.
 */
export function computeAvailableGoods(
  population: number,
  tradeCodes: string[],
  mode: SpeculativeMode,
  extraRolls: string[],
  tonnageRolls: number[],
): AvailableGood[] {
  const goods: AvailableGood[] = [];
  let tonnageIndex = 0;

  function nextTonnage(definition: TradeGoodDefinition): number {
    const dice = tonnageRolls.slice(tonnageIndex, tonnageIndex + definition.tonsDice);
    tonnageIndex += definition.tonsDice;
    const rawSum = dice.reduce((sum, r) => sum + r, 0);
    return applyPopulationTonnageDm(rawSum, population) * definition.tonsMultiplier;
  }

  for (const definition of TRADE_GOODS_TABLE) {
    if (definition.d66 === '66') continue; // Exotics are handled individually by the Referee, not auto-stocked.
    if (definition.illegal && mode !== 'blackMarket') continue;
    const isCommon = definition.availability.length === 0;
    const matchesTradeCode = definition.availability.some((code) => tradeCodes.includes(code));
    if (isCommon || matchesTradeCode) {
      goods.push({ definition, tons: nextTonnage(definition) });
    }
  }

  for (const d66 of extraRolls) {
    const definition = TRADE_GOODS_TABLE.find((g) => g.d66 === d66);
    if (!definition || definition.d66 === '66') continue;
    const existing = goods.find((g) => g.definition.d66 === d66);
    const tons = nextTonnage(definition);
    if (existing) {
      existing.tons += tons;
    } else {
      goods.push({ definition, tons });
    }
  }

  return goods;
}

/**
 * Rolls a full supplier's available goods: all qualifying goods computed above, plus `population`
 * random D66 rolls (rerolling 61-65 unless black market), plus one extra illegal roll in black-market mode.
 */
export function rollAvailableGoods(population: number, tradeCodes: string[], mode: SpeculativeMode): AvailableGood[] {
  const extraRolls = Array.from({ length: Math.max(0, population) }, () => rollTradeGoodD66(mode));
  if (mode === 'blackMarket') {
    extraRolls.push(rollIllegalGoodD66());
  }

  const qualifying = TRADE_GOODS_TABLE.filter((definition) => {
    if (definition.d66 === '66') return false;
    if (definition.illegal && mode !== 'blackMarket') return false;
    const isCommon = definition.availability.length === 0;
    const matchesTradeCode = definition.availability.some((code) => tradeCodes.includes(code));
    return isCommon || matchesTradeCode;
  });
  const extraDefinitions = extraRolls
    .map((d66) => TRADE_GOODS_TABLE.find((g) => g.d66 === d66))
    .filter((d): d is TradeGoodDefinition => Boolean(d) && d!.d66 !== '66');

  const totalDiceNeeded = [...qualifying, ...extraDefinitions].reduce((sum, d) => sum + d.tonsDice, 0);
  const tonnageRolls = Array.from({ length: totalDiceNeeded }, () => rollD6());

  return computeAvailableGoods(population, tradeCodes, mode, extraRolls, tonnageRolls);
}

/** Counts how many DM bonuses a trade good's DM-text string grants for a given set of trade codes/flags. */
function parseDmText(dmText: string, tradeCodes: string[], zone: TravelZone): number {
  if (!dmText) return 0;
  const codeNameToCode: Record<string, string> = {
    agricultural: 'Ag', 'non-agricultural': '!Ag', asteroid: 'As', desert: 'De', fluid: 'Fl',
    garden: 'Ga', 'high population': 'Hi', 'high tech': 'Ht', 'ice-capped': 'Ic', industrial: 'In',
    'non-industrial': '!In', 'low population': 'Lo', 'low tech': 'Lt', poor: 'Po', rich: 'Ri',
    'water world': 'Wa', 'fluid oceans': 'Fl',
  };

  let best = 0;
  const clauses = dmText.split(',').map((c) => c.trim());
  for (const clause of clauses) {
    const clauseMatch = /^(.+?)\s*([+-]\d+)$/.exec(clause);
    if (!clauseMatch) continue;
    const [, label, dmStr] = clauseMatch;
    const dm = parseInt(dmStr, 10);
    const labelLower = label.toLowerCase();
    if (labelLower === 'amber zone' && zone === 'Amber') best = Math.max(best, dm);
    else if (labelLower === 'red zone' && zone === 'Red') best = Math.max(best, dm);
    else {
      const code = codeNameToCode[labelLower];
      if (!code) continue;
      const negate = code.startsWith('!');
      const bareCode = negate ? code.slice(1) : code;
      const has = tradeCodes.includes(bareCode);
      if (negate ? !has : has) best = Math.max(best, dm);
    }
  }
  return best;
}

export interface TradePriceParams {
  good: TradeGoodDefinition;
  brokerSkill: number;
  counterpartyBrokerSkill: number;
  tradeCodes: string[];
  travelZone: TravelZone;
}

/** Computes the total purchase-roll modifier: broker skill + best matching Purchase DM - best matching Sale DM - supplier's broker skill. */
export function computePurchaseModifier(params: TradePriceParams): number {
  const purchaseDm = parseDmText(params.good.purchaseDmText, params.tradeCodes, params.travelZone);
  const saleDm = parseDmText(params.good.saleDmText, params.tradeCodes, params.travelZone);
  return params.brokerSkill + purchaseDm - saleDm - params.counterpartyBrokerSkill;
}

/** Computes the total sale-roll modifier: broker skill + best matching Sale DM - best matching Purchase DM - buyer's broker skill. */
export function computeSaleModifier(params: TradePriceParams): number {
  const saleDm = parseDmText(params.good.saleDmText, params.tradeCodes, params.travelZone);
  const purchaseDm = parseDmText(params.good.purchaseDmText, params.tradeCodes, params.travelZone);
  return params.brokerSkill + saleDm - purchaseDm - params.counterpartyBrokerSkill;
}

export function computePurchasePrice(threeDRoll: number, modifier: number, basePrice: number): number {
  const row = getModifiedPriceRow(threeDRoll + modifier);
  return Math.round(basePrice * (row.purchasePercent / 100));
}

export function computeSalePrice(threeDRoll: number, modifier: number, basePrice: number): number {
  const row = getModifiedPriceRow(threeDRoll + modifier);
  return Math.round(basePrice * (row.salePercent / 100));
}

function roll3D6(): number {
  return rollD6() + rollD6() + rollD6();
}

export function rollPurchasePrice(params: TradePriceParams): { roll: number; price: number } {
  const roll = roll3D6();
  const modifier = computePurchaseModifier(params);
  return { roll, price: computePurchasePrice(roll, modifier, params.good.basePrice) };
}

export function rollSalePrice(params: TradePriceParams): { roll: number; price: number } {
  const roll = roll3D6();
  const modifier = computeSaleModifier(params);
  return { roll, price: computeSalePrice(roll, modifier, params.good.basePrice) };
}
