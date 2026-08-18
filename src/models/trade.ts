import type { StarportClass, TradeCode, TravelZone } from './planet';

/** A world's stats recovered from parsing a pasted UWP string, with trade codes/zone re-derived. */
export interface ParsedWorld {
  raw: string;
  starport: StarportClass;
  size: number;
  atmosphere: number;
  hydrographics: number;
  population: number;
  government: number;
  lawLevel: number;
  techLevel: number;
  tradeCodes: TradeCode[];
  travelZone: TravelZone;
}

/** The four standard passenger service tiers. */
export type PassengerClass = 'High' | 'Middle' | 'Basic' | 'Low';

/** A single row of the Passage & Freight table, keyed by parsecs travelled (1-6). */
export interface PassageFreightRow {
  parsecs: number;
  high: number;
  middle: number;
  basic: number;
  low: number;
  freightPerTon: number;
}

/** Traffic table row: 2D roll range maps to a dice-count expression, e.g. "3D". */
export interface TrafficTableRow {
  /** Inclusive minimum 2D roll (already clamped: rows below 2 collapse to "1 or less"). */
  min: number;
  /** Number of D6 to roll to get the actual passenger/lot count, or 0 for none. */
  diceCount: number;
}

/** The three freight lot sizes, each with its own tonnage-roll formula. */
export type FreightLotSize = 'Major' | 'Minor' | 'Incidental';

/** A single entry of the D66 Trade Goods table. */
export interface TradeGoodDefinition {
  d66: string;
  name: string;
  /** Trade codes that make this good locally available (empty = Common, available everywhere). */
  availability: string[];
  /** Number of dice to roll, multiplied by this factor, to get tons available. */
  tonsDice: number;
  tonsMultiplier: number;
  basePrice: number;
  /** DM description text, e.g. "Industrial +2, High Tech +3, Rich +1". */
  purchaseDmText: string;
  saleDmText: string;
  examples: string;
  illegal: boolean;
}

/** Whether speculative-trade goods generation includes only legal goods or also illegal ones. */
export type SpeculativeMode = 'legal' | 'blackMarket';

/** A rolled/available lot of a trade good ready for purchase-price calculation. */
export interface AvailableGood {
  definition: TradeGoodDefinition;
  tons: number;
}

/** A single row of the Modified Price table (roll result -> purchase/sale % of base price). */
export interface ModifiedPriceRow {
  /** Inclusive minimum roll total that maps to this row (rows are otherwise consecutive). */
  min: number;
  /** Inclusive maximum roll total, or null for "and above". */
  max: number | null;
  purchasePercent: number;
  salePercent: number;
}
