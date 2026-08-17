/** Starport quality class, from best (A) to none (X). */
export type StarportClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'X';

/** Which of the possible bases (and highport) are present on the world. */
export interface Bases {
  scout: boolean;
  naval: boolean;
  military: boolean;
  corsair: boolean;
  highport: boolean;
}

/** A rival faction competing with the dominant planetary government. */
export interface Faction {
  /** Government code (0-15) describing this faction's structure. */
  government: number;
  /** 2D strength roll (2-12). */
  strength: number;
}

/** A single trade code classification, e.g. 'Ag' for Agricultural. */
export interface TradeCode {
  code: string;
  name: string;
}

/** Amber/Red travel advisories. Green (no advisory) is represented as null. */
export type TravelZone = 'Amber' | 'Red' | null;

/** A fully generated Traveller world, per the Universal World Profile (UWP). */
export interface Planet {
  name: string;
  hexLocation: string;
  hasGasGiant: boolean;
  size: number;
  atmosphere: number;
  temperature: number;
  hydrographics: number;
  population: number;
  government: number;
  lawLevel: number;
  techLevel: number;
  starport: StarportClass;
  bases: Bases;
  factions: Faction[];
  tradeCodes: TradeCode[];
  travelZone: TravelZone;
}
