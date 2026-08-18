import type {
  FreightLotSize,
  ModifiedPriceRow,
  PassageFreightRow,
  TradeGoodDefinition,
  TrafficTableRow,
} from '../models/trade';

// --- Passage & Freight Table (per parsec travelled, single jump) ---

export const PASSAGE_FREIGHT_TABLE: PassageFreightRow[] = [
  { parsecs: 1, high: 9000, middle: 6500, basic: 2000, low: 700, freightPerTon: 1000 },
  { parsecs: 2, high: 14000, middle: 10000, basic: 3000, low: 1300, freightPerTon: 1600 },
  { parsecs: 3, high: 21000, middle: 14000, basic: 5000, low: 2200, freightPerTon: 2600 },
  { parsecs: 4, high: 34000, middle: 23000, basic: 8000, low: 3900, freightPerTon: 4400 },
  { parsecs: 5, high: 60000, middle: 40000, basic: 14000, low: 7200, freightPerTon: 8500 },
  { parsecs: 6, high: 210000, middle: 130000, basic: 55000, low: 27000, freightPerTon: 32000 },
];

/** Looks up the Passage & Freight row for a given parsecs travelled, clamping to the table's 1-6 range. */
export function getPassageFreightRow(parsecs: number): PassageFreightRow {
  const clamped = Math.max(1, Math.min(6, Math.round(parsecs)));
  return PASSAGE_FREIGHT_TABLE[clamped - 1];
}

// --- Passenger & Freight Traffic tables (2D + modifiers -> dice count to roll) ---

export const PASSENGER_TRAFFIC_TABLE: TrafficTableRow[] = [
  { min: -Infinity, diceCount: 0 },
  { min: 2, diceCount: 1 },
  { min: 4, diceCount: 2 },
  { min: 7, diceCount: 3 },
  { min: 11, diceCount: 4 },
  { min: 14, diceCount: 5 },
  { min: 16, diceCount: 6 },
  { min: 17, diceCount: 7 },
  { min: 18, diceCount: 8 },
  { min: 19, diceCount: 9 },
  { min: 20, diceCount: 10 },
];

export const FREIGHT_TRAFFIC_TABLE: TrafficTableRow[] = [
  { min: -Infinity, diceCount: 0 },
  { min: 2, diceCount: 1 },
  { min: 4, diceCount: 2 },
  { min: 6, diceCount: 3 },
  { min: 9, diceCount: 4 },
  { min: 12, diceCount: 5 },
  { min: 15, diceCount: 6 },
  { min: 17, diceCount: 7 },
  { min: 18, diceCount: 8 },
  { min: 19, diceCount: 9 },
  { min: 20, diceCount: 10 },
];

/** Finds the number of D6 to roll for a modified 2D traffic roll, per a table sorted ascending by `min`. */
export function getDiceCountForRoll(table: TrafficTableRow[], modifiedRoll: number): number {
  let result = table[0].diceCount;
  for (const row of table) {
    if (modifiedRoll >= row.min) {
      result = row.diceCount;
    }
  }
  return result;
}

// --- Modified Price Table (3D purchase/sale roll -> % of base price) ---

export const MODIFIED_PRICE_TABLE: ModifiedPriceRow[] = [
  { min: -Infinity, max: -3, purchasePercent: 300, salePercent: 10 },
  { min: -2, max: -2, purchasePercent: 250, salePercent: 20 },
  { min: -1, max: -1, purchasePercent: 200, salePercent: 30 },
  { min: 0, max: 0, purchasePercent: 175, salePercent: 40 },
  { min: 1, max: 1, purchasePercent: 150, salePercent: 45 },
  { min: 2, max: 2, purchasePercent: 135, salePercent: 50 },
  { min: 3, max: 3, purchasePercent: 125, salePercent: 55 },
  { min: 4, max: 4, purchasePercent: 120, salePercent: 60 },
  { min: 5, max: 5, purchasePercent: 115, salePercent: 65 },
  { min: 6, max: 6, purchasePercent: 110, salePercent: 70 },
  { min: 7, max: 7, purchasePercent: 105, salePercent: 75 },
  { min: 8, max: 8, purchasePercent: 100, salePercent: 80 },
  { min: 9, max: 9, purchasePercent: 95, salePercent: 85 },
  { min: 10, max: 10, purchasePercent: 90, salePercent: 90 },
  { min: 11, max: 11, purchasePercent: 85, salePercent: 100 },
  { min: 12, max: 12, purchasePercent: 80, salePercent: 105 },
  { min: 13, max: 13, purchasePercent: 75, salePercent: 110 },
  { min: 14, max: 14, purchasePercent: 70, salePercent: 115 },
  { min: 15, max: 15, purchasePercent: 65, salePercent: 120 },
  { min: 16, max: 16, purchasePercent: 60, salePercent: 125 },
  { min: 17, max: 17, purchasePercent: 55, salePercent: 130 },
  { min: 18, max: 18, purchasePercent: 50, salePercent: 140 },
  { min: 19, max: 19, purchasePercent: 45, salePercent: 150 },
  { min: 20, max: 20, purchasePercent: 40, salePercent: 160 },
  { min: 21, max: 21, purchasePercent: 35, salePercent: 175 },
  { min: 22, max: 22, purchasePercent: 30, salePercent: 200 },
  { min: 23, max: 23, purchasePercent: 25, salePercent: 250 },
  { min: 24, max: 24, purchasePercent: 20, salePercent: 300 },
  { min: 25, max: Infinity, purchasePercent: 15, salePercent: 400 },
];

/** Finds the Modified Price table row containing a given roll total. */
export function getModifiedPriceRow(roll: number): ModifiedPriceRow {
  const row = MODIFIED_PRICE_TABLE.find((r) => roll >= r.min && roll <= (r.max ?? Infinity));
  return row ?? MODIFIED_PRICE_TABLE[MODIFIED_PRICE_TABLE.length - 1];
}

// --- Freight lot size formulas ---

export const FREIGHT_LOT_DICE: Record<FreightLotSize, { dice: number; multiplier: number }> = {
  Major: { dice: 1, multiplier: 10 },
  Minor: { dice: 1, multiplier: 5 },
  Incidental: { dice: 1, multiplier: 1 },
};

// --- Population, starport & travel-zone DM helpers shared by passengers/freight ---

export function getPopulationPassengerDM(population: number): number {
  if (population <= 1) return -4;
  if (population >= 8) return 3;
  if (population >= 6) return 1;
  return 0;
}

export function getPopulationFreightDM(population: number): number {
  if (population <= 1) return -4;
  if (population >= 8) return 4;
  if (population >= 6) return 2;
  return 0;
}

export function getStarportTradeDM(starport: string): number {
  switch (starport) {
    case 'A': return 2;
    case 'B': return 1;
    case 'E': return -1;
    case 'X': return -3;
    default: return 0;
  }
}

export function getZonePassengerDM(travelZone: 'Amber' | 'Red' | null): number {
  if (travelZone === 'Amber') return 1;
  if (travelZone === 'Red') return -4;
  return 0;
}

export function getZoneFreightDM(travelZone: 'Amber' | 'Red' | null): number {
  if (travelZone === 'Amber') return -2;
  if (travelZone === 'Red') return -6;
  return 0;
}

export function getTechLevelFreightDM(techLevel: number): number {
  if (techLevel >= 9) return 2;
  if (techLevel <= 6) return -1;
  return 0;
}

// --- Trade Goods Table (D66) ---

export const TRADE_GOODS_TABLE: TradeGoodDefinition[] = [
  { d66: '11', name: 'Common Electronics', availability: [], tonsDice: 2, tonsMultiplier: 10, basePrice: 20000, purchaseDmText: 'Industrial +2, High Tech +3, Rich +1', saleDmText: 'Non-Industrial +2, Low Tech +1, Poor +1', examples: 'Simple electronics including basic computers up to TL10', illegal: false },
  { d66: '12', name: 'Common Industrial goods', availability: [], tonsDice: 2, tonsMultiplier: 10, basePrice: 10000, purchaseDmText: 'Non-Agricultural +2, Industrial +5', saleDmText: 'Non-Industrial +3, Agricultural +2', examples: 'Machine components and spare parts for common machinery', illegal: false },
  { d66: '13', name: 'Common manufactured goods', availability: [], tonsDice: 2, tonsMultiplier: 10, basePrice: 20000, purchaseDmText: 'Non-Agricultural +2, Industrial +5', saleDmText: 'Non-Industrial +3, High Population +2', examples: 'Household appliances, clothing and so forth', illegal: false },
  { d66: '14', name: 'Common raw materials', availability: [], tonsDice: 2, tonsMultiplier: 20, basePrice: 5000, purchaseDmText: 'Agricultural +3, Garden +2', saleDmText: 'Industrial +2, Poor +2', examples: 'Metal, Plastics, Chemicals, and other basic materials', illegal: false },
  { d66: '15', name: 'Common consumables', availability: [], tonsDice: 2, tonsMultiplier: 20, basePrice: 500, purchaseDmText: 'Agricultural +3, Water world +2, Garden +1, Asteroid -4', saleDmText: 'Asteroid +1, Fluid Oceans +1, Ice-Capped +1, High Population +1', examples: 'Food, Drink and other agricultural products', illegal: false },
  { d66: '16', name: 'Common Ore', availability: [], tonsDice: 2, tonsMultiplier: 20, basePrice: 1000, purchaseDmText: 'Asteroid +4', saleDmText: 'Industrial +3, Non-Industrial +1', examples: 'Ore bearing common metals', illegal: false },
  { d66: '21', name: 'Advanced Electronics', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 5, basePrice: 100000, purchaseDmText: 'Industrial +2, High Tech +3', saleDmText: 'Non-Industrial +1, Rich +2, Asteroid +3', examples: 'Advanced sensors, computers and other electronics up to TL15', illegal: false },
  { d66: '22', name: 'Advanced Machine Parts', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 5, basePrice: 75000, purchaseDmText: 'Industrial +2, High Tech +1', saleDmText: 'Asteroid +2, Non-Industrial +1', examples: 'Machine components and spare parts, including gravitic components', illegal: false },
  { d66: '23', name: 'Advanced Manufactured Goods', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 5, basePrice: 100000, purchaseDmText: 'Industrial +1', saleDmText: 'High Population +1, Rich +2', examples: 'Devices and clothing incorporating advanced technologies', illegal: false },
  { d66: '24', name: 'Advanced Weapons', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 5, basePrice: 150000, purchaseDmText: 'High Tech +2', saleDmText: 'Poor +1, Amber Zone +2, Red Zone +4', examples: 'Firearms, explosives, ammunition, artillery and other military-grade weaponry', illegal: false },
  { d66: '25', name: 'Advanced Vehicles', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 5, basePrice: 180000, purchaseDmText: 'High Tech +2', saleDmText: 'Asteroid +2, Rich +2', examples: 'Air/rafts, spacecraft, grav tanks and other vehicles up to TL15', illegal: false },
  { d66: '26', name: 'Biochemicals', availability: ['Ag', 'Fl'], tonsDice: 1, tonsMultiplier: 5, basePrice: 50000, purchaseDmText: 'Agricultural +1, Water World +2', saleDmText: 'Industrial +2', examples: 'Biofuels, organic chemicals, extracts', illegal: false },
  { d66: '31', name: 'Crystals & Gems', availability: ['As', 'De', 'Ic'], tonsDice: 1, tonsMultiplier: 5, basePrice: 20000, purchaseDmText: 'Asteroid +2, Desert +1, Ice-Capped +1', saleDmText: 'Industrial +3, Rich +2', examples: 'Diamonds, synthetic or natural gemstones', illegal: false },
  { d66: '32', name: 'Cybernetics', availability: ['Ht'], tonsDice: 1, tonsMultiplier: 1, basePrice: 250000, purchaseDmText: 'High Tech +1', saleDmText: 'Asteroid +1, Ice-Capped +1, Rich +2', examples: 'Cybernetic components, replacement limbs', illegal: false },
  { d66: '33', name: 'Live Animals', availability: ['Ag', 'Ga'], tonsDice: 1, tonsMultiplier: 10, basePrice: 10000, purchaseDmText: 'Agricultural +2', saleDmText: 'Low Population +3', examples: 'Riding animals, beasts of burden, exotic pets', illegal: false },
  { d66: '34', name: 'Luxury Consumables', availability: ['Ag', 'Ga', 'Fl'], tonsDice: 1, tonsMultiplier: 10, basePrice: 20000, purchaseDmText: 'Agricultural +2, Water World +1', saleDmText: 'Rich +2, High Population +2', examples: 'Rare foods, fine liquors', illegal: false },
  { d66: '35', name: 'Luxury Goods', availability: ['Hi'], tonsDice: 1, tonsMultiplier: 1, basePrice: 200000, purchaseDmText: 'High Population +1', saleDmText: 'Rich +4', examples: 'Rare or extremely high quality manufactured goods', illegal: false },
  { d66: '36', name: 'Medical Supplies', availability: ['Ht', 'Hi'], tonsDice: 1, tonsMultiplier: 5, basePrice: 50000, purchaseDmText: 'High Tech +2', saleDmText: 'Industrial +2, Poor +1, Rich +1', examples: 'Diagnostic equipment, basic drugs, cloning technology', illegal: false },
  { d66: '41', name: 'Petrochemicals', availability: ['De', 'Fl', 'Ic', 'Wa'], tonsDice: 1, tonsMultiplier: 10, basePrice: 10000, purchaseDmText: 'Desert +2', saleDmText: 'Industrial +2, Agricultural +1, Low Tech +2', examples: 'Oil, Liquid fuels', illegal: false },
  { d66: '42', name: 'Pharmaceuticals', availability: ['As', 'De', 'Hi', 'Wa'], tonsDice: 1, tonsMultiplier: 1, basePrice: 100000, purchaseDmText: 'Asteroid +2, High Population +1', saleDmText: 'Rich +2, Low Tech +1', examples: 'Drugs, medical supplies, anagathics, fast or slow drugs', illegal: false },
  { d66: '43', name: 'Polymers', availability: ['In'], tonsDice: 1, tonsMultiplier: 10, basePrice: 7000, purchaseDmText: 'Industrial +1', saleDmText: 'Rich +2, Non-Industrial +1', examples: 'Plastics, other synthetics', illegal: false },
  { d66: '44', name: 'Precious Metals', availability: ['As', 'De', 'Ic', 'Fl'], tonsDice: 1, tonsMultiplier: 1, basePrice: 50000, purchaseDmText: 'Asteroid +3, Desert +1, Ice-Capped +2', saleDmText: 'Rich +3, Industrial +2, High Tech +1', examples: 'Gold, Silver, platinum, rare elements', illegal: false },
  { d66: '45', name: 'Radioactives', availability: ['As', 'De', 'Lo'], tonsDice: 1, tonsMultiplier: 1, basePrice: 1000000, purchaseDmText: 'Asteroid +2, Low Population +2', saleDmText: 'Industrial +3, High Tech +1, Non-Industrial -2, Agricultural -3', examples: 'Uranium, Plutonium, unobtanium, rare elements', illegal: false },
  { d66: '46', name: 'Robots', availability: ['In'], tonsDice: 1, tonsMultiplier: 5, basePrice: 400000, purchaseDmText: 'Industrial +1', saleDmText: 'Agricultural +2, High Tech +1', examples: 'Industrial and personal robots and drones', illegal: false },
  { d66: '51', name: 'Spices', availability: ['Ga', 'De', 'Wa'], tonsDice: 1, tonsMultiplier: 10, basePrice: 6000, purchaseDmText: 'Desert +2', saleDmText: 'High Population +2, Rich +3, Poor +3', examples: 'Preservatives, luxury food additives, natural drugs', illegal: false },
  { d66: '52', name: 'Textiles', availability: ['Ag', 'Ni'], tonsDice: 1, tonsMultiplier: 20, basePrice: 3000, purchaseDmText: 'Agricultural +7', saleDmText: 'High Population +3, Non-Agricultural +2', examples: 'Clothing and fabrics', illegal: false },
  { d66: '53', name: 'Uncommon Ore', availability: ['As', 'Ic'], tonsDice: 1, tonsMultiplier: 20, basePrice: 5000, purchaseDmText: 'Asteroid +4', saleDmText: 'Industrial +3, Non-Industrial +1', examples: 'Ore containing precious or valuable metals', illegal: false },
  { d66: '54', name: 'Uncommon Raw Materials', availability: ['Ag', 'De', 'Wa'], tonsDice: 1, tonsMultiplier: 10, basePrice: 20000, purchaseDmText: 'Agricultural +2, Water World +1', saleDmText: 'Industrial +2, High Tech +1', examples: 'Valuable metals like titanium, rare elements', illegal: false },
  { d66: '55', name: 'Wood', availability: ['Ag', 'Ga'], tonsDice: 1, tonsMultiplier: 20, basePrice: 1000, purchaseDmText: 'Agricultural +6', saleDmText: 'Rich +2, Industrial +1', examples: 'Hard or beautiful woods and plant extracts', illegal: false },
  { d66: '56', name: 'Vehicles', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 10, basePrice: 15000, purchaseDmText: 'Industrial +2, High Tech +1', saleDmText: 'Non-Industrial +2, High Population +1', examples: 'Wheeled, tracked and other vehicles from TL10 or lower', illegal: false },
  { d66: '61', name: 'Biochemicals, Illegal', availability: ['Ag', 'Fl'], tonsDice: 1, tonsMultiplier: 5, basePrice: 50000, purchaseDmText: 'Water World +2', saleDmText: 'Industrial +6', examples: 'Dangerous chemicals, extracts from endangered species', illegal: true },
  { d66: '62', name: 'Cybernetics, Illegal', availability: ['Ht'], tonsDice: 1, tonsMultiplier: 1, basePrice: 250000, purchaseDmText: 'High Tech +1', saleDmText: 'Asteroid +4, Ice-Capped +4, Rich +8, Amber Zone +6, Red Zone +6', examples: 'Combat cybernetics, Illegal enhancements', illegal: true },
  { d66: '63', name: 'Drugs, Illegal', availability: ['As', 'De', 'Hi', 'Wa'], tonsDice: 1, tonsMultiplier: 1, basePrice: 100000, purchaseDmText: 'Asteroid +1, Desert +1, Garden +1, Water World +1', saleDmText: 'Rich +6, High Population +6', examples: 'Addictive drugs, combat drugs', illegal: true },
  { d66: '64', name: 'Luxuries, Illegal', availability: ['Ag', 'Ga', 'Fl'], tonsDice: 1, tonsMultiplier: 1, basePrice: 50000, purchaseDmText: 'Agricultural +2, Water World +1', saleDmText: 'Rich +6, High Population +4', examples: 'Debauched or addictive luxuries', illegal: true },
  { d66: '65', name: 'Weapons, Illegal', availability: ['In', 'Ht'], tonsDice: 1, tonsMultiplier: 5, basePrice: 150000, purchaseDmText: 'High Tech +2', saleDmText: 'Poor +6, Amber Zone +8, Red Zone +10', examples: 'Weapons of mass destruction, naval weapons', illegal: true },
  { d66: '66', name: 'Exotics', availability: [], tonsDice: 0, tonsMultiplier: 0, basePrice: 0, purchaseDmText: '', saleDmText: '', examples: 'Alien relics, prototype technology, unique plants or animal life, priceless treasures. Exotics are outside the normal trade rules and must be priced individually by the Referee.', illegal: false },
];

export function getTradeGoodByD66(d66: string): TradeGoodDefinition | undefined {
  return TRADE_GOODS_TABLE.find((g) => g.d66 === d66);
}
