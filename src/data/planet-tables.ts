import type { Planet, StarportClass, TradeCode } from '../models/planet';

/** Descriptive text for each world Size code (0-10). */
export const SIZE_DESCRIPTIONS: string[] = [
  'Less than 1,000km diameter. Negligible gravity. Asteroid or orbital complex.',
  '1,600km diameter. 0.05G. E.g. Triton.',
  '3,200km diameter. 0.15G. E.g. Luna, Europa.',
  '4,800km diameter. 0.25G. E.g. Mercury, Ganymede.',
  '6,400km diameter. 0.35G. E.g. Mars.',
  '8,000km diameter. 0.45G.',
  '9,600km diameter. 0.7G.',
  '11,200km diameter. 0.9G.',
  '12,800km diameter. 1.0G. E.g. Earth.',
  '14,400km diameter. 1.25G.',
  '16,000km diameter. 1.4G.',
];

/** Descriptive text for each Atmosphere code (0-15). */
export const ATMOSPHERE_DESCRIPTIONS: string[] = [
  'None. Vacc suit required.',
  'Trace. Vacc suit required.',
  'Very thin, tainted. Respirator and filter required.',
  'Very thin. Respirator required.',
  'Thin, tainted. Filter required.',
  'Thin.',
  'Standard. E.g. Earth.',
  'Standard, tainted. Filter required.',
  'Dense.',
  'Dense, tainted. Filter required.',
  'Exotic. Air supply required.',
  'Corrosive. Vacc suit required. E.g. Venus.',
  'Insidious. Vacc suit required.',
  'Very dense.',
  'Low.',
  'Unusual. Survival gear varies.',
];

/** Descriptive text for each Hydrographics code (0-10), 10%-increments of surface liquid. */
export const HYDROGRAPHICS_DESCRIPTIONS: string[] = [
  'Desert world (0%-5%).',
  'Dry world (6%-15%).',
  'A few small seas (16%-25%).',
  'Small seas and oceans (26%-35%).',
  'Wet world (36%-45%).',
  'A large ocean (46%-55%).',
  'Large oceans (56%-65%).',
  'Earth-like world (66%-75%).',
  'Only a few islands and archipelagos (76%-85%).',
  'Almost entirely water (86%-95%).',
  'Waterworld (96%-100%).',
];

/** Descriptive text for each Population code (0-10). */
export const POPULATION_DESCRIPTIONS: string[] = [
  'Uninhabited.',
  'Few. A tiny farmstead of a single family.',
  'Hundreds. A village.',
  'Thousands.',
  'Tens of thousands. Small town.',
  'Hundreds of thousands. Average city.',
  'Millions.',
  'Tens of millions. Large city.',
  'Hundreds of millions.',
  'Billions. Present day Earth.',
  'Tens of billions.',
];

export interface TemperatureBand {
  label: string;
  description: string;
}
/** Temperature band, keyed by 2D roll ranges: index 0 = "2 or less" ... index 4 = "12 or more". */
export const TEMPERATURE_BANDS: TemperatureBand[] = [
  { label: 'Frozen', description: 'Frozen world. No liquid water, very dry atmosphere.' },
  { label: 'Cold', description: 'Icy world. Little liquid water, extensive ice caps, few clouds.' },
  { label: 'Temperate', description: 'Temperate world. Earth-like. Liquid & vaporised water are common, moderate ice caps.' },
  { label: 'Hot', description: 'Hot world. Small or no ice caps, little liquid water. Most water in the form of clouds.' },
  { label: 'Boiling', description: 'Boiling world. No ice caps, little liquid water.' },
];

/** Maps a raw 2D+DM temperature roll to a temperature band index (0-4). */
export function getTemperatureBandIndex(roll: number): number {
  if (roll <= 2) return 0;
  if (roll <= 4) return 1;
  if (roll <= 9) return 2;
  if (roll <= 11) return 3;
  return 4;
}

export interface GovernmentType {
  name: string;
  description: string;
}

/** Government type descriptions, indexed by Government code (0-15). */
export const GOVERNMENT_TYPES: GovernmentType[] = [
  { name: 'None', description: 'No government structure. E.g. family, clan, anarchy, uninhabited.' },
  { name: 'Company/Corporation', description: 'Ruling functions are assumed by a company managerial elite and most citizenry are company employees or dependants.' },
  { name: 'Participating Democracy', description: 'Ruling functions are reached by the advice and consent of the citizenry directly.' },
  { name: 'Self-Perpetuating Oligarchy', description: 'Ruling functions are performed by a restricted minority, with little or no input from the mass of citizenry.' },
  { name: 'Representative Democracy', description: 'Ruling functions are performed by elected representatives.' },
  { name: 'Feudal Technocracy', description: 'Ruling functions are performed by specific individuals for persons who agree to be ruled by them, based on technical merit.' },
  { name: 'Captive Government', description: 'Ruling functions are performed by an imposed leadership answerable to an outside group.' },
  { name: 'Balkanisation', description: 'No central authority exists; rival governments compete for control.' },
  { name: 'Civil Service Bureaucracy', description: 'Ruling functions are performed by government agencies employing individuals selected for their expertise.' },
  { name: 'Impersonal Bureaucracy', description: 'Ruling functions are performed by agencies that have become insulated from the governed citizens.' },
  { name: 'Charismatic Dictator', description: 'Ruling functions are performed by agencies directed by a single leader who enjoys the overwhelming confidence of the citizenry.' },
  { name: 'Non-Charismatic Leader', description: 'A previous charismatic dictator has been replaced by a leader through normal channels; this ruler is less popular.' },
  { name: 'Charismatic Oligarchy', description: 'Ruling functions are performed by a select group who enjoy the overwhelming confidence of the citizenry.' },
  { name: 'Religious Dictatorship', description: 'Ruling functions are performed by a religious organisation without regard to the specific needs of the citizenry.' },
  { name: 'Religious Autocracy', description: 'Government by a single religious leader having absolute power over the citizenry.' },
  { name: 'Totalitarian Oligarchy', description: 'Government by an all-powerful minority which maintains absolute control through widespread coercion and oppression.' },
];

/** Relative strength label for a rival faction, keyed by its 2D strength roll (2-12). */
export function getFactionStrengthLabel(strength: number): string {
  if (strength <= 3) return 'Obscure group';
  if (strength <= 5) return 'Fringe group';
  if (strength <= 7) return 'Minor group';
  if (strength <= 9) return 'Notable group';
  if (strength <= 11) return 'Significant group';
  return 'Overwhelming popular support';
}

export interface LawLevelInfo {
  weaponsBanned: string;
  armourBanned: string;
}

/** Law level restrictions, indexed 0-9 (9 also covers 9+). */
export const LAW_LEVELS: LawLevelInfo[] = [
  { weaponsBanned: 'No restrictions - heavy armour and a handy weapon recommended.', armourBanned: 'None.' },
  { weaponsBanned: 'Poison gas, explosives, undetectable weapons, WMD.', armourBanned: 'Battle dress.' },
  { weaponsBanned: 'Portable energy and laser weapons.', armourBanned: 'Combat armour.' },
  { weaponsBanned: 'Military weapons.', armourBanned: 'Flak.' },
  { weaponsBanned: 'Light assault weapons and submachine guns.', armourBanned: 'Cloth.' },
  { weaponsBanned: 'Personal concealable weapons.', armourBanned: 'Mesh.' },
  { weaponsBanned: 'All firearms except shotguns & stunners; carrying weapons discouraged.', armourBanned: 'None.' },
  { weaponsBanned: 'Shotguns.', armourBanned: 'None.' },
  { weaponsBanned: 'All bladed weapons, stunners.', armourBanned: 'All visible armour.' },
  { weaponsBanned: 'All weapons.', armourBanned: 'All armour.' },
];

/** Looks up law level restriction text; raw law level values above 9 share the "9+" description. */
export function getLawLevelInfo(lawLevel: number): LawLevelInfo {
  return LAW_LEVELS[Math.max(0, Math.min(9, lawLevel))];
}

export interface StarportInfo {
  quality: string;
  berthingCost: string;
  fuel: string;
  facilities: string;
}

/** Starport quality/cost/fuel/facilities, keyed by starport class. */
export const STARPORT_INFO: Record<StarportClass, StarportInfo> = {
  X: { quality: 'No starport', berthingCost: '0', fuel: 'None', facilities: 'None' },
  E: { quality: 'Frontier', berthingCost: '0', fuel: 'None', facilities: 'None' },
  D: { quality: 'Poor', berthingCost: '1D x Cr10', fuel: 'Unrefined', facilities: 'Limited repair' },
  C: { quality: 'Routine', berthingCost: '1D x Cr100', fuel: 'Unrefined', facilities: 'Shipyard (small craft), repair' },
  B: { quality: 'Good', berthingCost: '1D x Cr500', fuel: 'Refined', facilities: 'Shipyard (spacecraft), repair' },
  A: { quality: 'Excellent', berthingCost: '1D x Cr1000', fuel: 'Refined', facilities: 'Shipyard (all), repair' },
};

/**
 * Tech Level modifier lookup tables, transcribed literally per-value from the rules table
 * (rather than as ranges) to avoid off-by-one mistakes. Each array is indexed by the relevant
 * code's value; a starport lookup is keyed by class since starport dice-result ranges map 1:1
 * to classes.
 */
export const TL_STARPORT_DM: Record<StarportClass, number> = {
  X: -4, E: 0, D: 0, C: 2, B: 4, A: 6,
};
export const TL_SIZE_DM: number[] = [2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0];
export const TL_ATMOSPHERE_DM: number[] = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
export const TL_HYDROGRAPHICS_DM: number[] = [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2];
export const TL_POPULATION_DM: number[] = [0, 1, 1, 1, 1, 1, 0, 0, 1, 2, 4];
export const TL_GOVERNMENT_DM: number[] = [1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, -2, -2, 0];

type TradeCodeStats = Pick<Planet, 'size' | 'atmosphere' | 'hydrographics' | 'population' | 'government' | 'lawLevel' | 'techLevel'>;

interface TradeCodeDefinition extends TradeCode {
  matches: (stats: TradeCodeStats) => boolean;
}

/** Trade code classifications and the criteria a world must meet to qualify for each. */
export const TRADE_CODE_DEFINITIONS: TradeCodeDefinition[] = [
  {
    code: 'Ag',
    name: 'Agricultural',
    matches: (s) => [4, 5, 6, 7, 8, 9].includes(s.atmosphere) && s.hydrographics >= 4 && s.hydrographics <= 8 && [5, 6, 7].includes(s.population),
  },
  {
    code: 'As',
    name: 'Asteroid Belt',
    matches: (s) => s.size === 0 && s.atmosphere === 0 && s.hydrographics === 0,
  },
  {
    code: 'Ba',
    name: 'Barren',
    matches: (s) => s.population === 0 && s.government === 0 && s.lawLevel === 0,
  },
  {
    code: 'De',
    name: 'Desert',
    matches: (s) => s.atmosphere >= 2 && s.atmosphere <= 9 && s.hydrographics === 0,
  },
  {
    code: 'Fl',
    name: 'Fluid Oceans',
    matches: (s) => s.atmosphere >= 10 && s.hydrographics >= 1,
  },
  {
    code: 'Ga',
    name: 'Garden',
    matches: (s) => [6, 7, 8].includes(s.size) && [5, 6, 8].includes(s.atmosphere) && [5, 6, 7].includes(s.hydrographics),
  },
  {
    code: 'Hi',
    name: 'High Population',
    matches: (s) => s.population >= 9,
  },
  {
    code: 'Ht',
    name: 'High Tech',
    matches: (s) => s.techLevel >= 12,
  },
  {
    code: 'Ic',
    name: 'Ice-Capped',
    matches: (s) => [0, 1].includes(s.atmosphere) && s.hydrographics >= 1,
  },
  {
    code: 'In',
    name: 'Industrial',
    matches: (s) => [0, 1, 2, 4, 7, 9, 10, 11, 12].includes(s.atmosphere) && s.population >= 9,
  },
  {
    code: 'Lo',
    name: 'Low Population',
    matches: (s) => [1, 2, 3].includes(s.population),
  },
  {
    code: 'Lt',
    name: 'Low Tech',
    matches: (s) => s.population >= 1 && s.techLevel >= 1 && s.techLevel <= 5,
  },
  {
    code: 'Na',
    name: 'Non-Agricultural',
    matches: (s) => [0, 1, 2, 3].includes(s.atmosphere) && [0, 1, 2, 3].includes(s.hydrographics) && s.population >= 6,
  },
  {
    code: 'Ni',
    name: 'Non-Industrial',
    matches: (s) => [4, 5, 6].includes(s.population),
  },
  {
    code: 'Po',
    name: 'Poor',
    matches: (s) => [2, 3, 4, 5].includes(s.atmosphere) && [0, 1, 2, 3].includes(s.hydrographics),
  },
  {
    code: 'Ri',
    name: 'Rich',
    matches: (s) => [6, 8].includes(s.atmosphere) && [6, 7, 8].includes(s.population) && [4, 5, 6, 7, 8, 9].includes(s.government),
  },
  {
    code: 'Va',
    name: 'Vacuum',
    matches: (s) => s.atmosphere === 0,
  },
  {
    code: 'Wa',
    name: 'Water World',
    matches: (s) => [3, 4, 5, 6, 7, 8, 9, 13, 14, 15].includes(s.atmosphere) && s.hydrographics === 10,
  },
];
