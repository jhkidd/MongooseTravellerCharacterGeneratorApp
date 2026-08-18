import {
  parseUwp,
  computePassengerModifier,
  computePassengerTraffic,
  rollPassengerTraffic,
  getPassageFare,
  computeFreightModifier,
  computeFreightTraffic,
  rollFreightTraffic,
  computeLotTonnage,
  rollLotTonnage,
  getFreightRate,
  computeMailModifier,
  computeMailAvailable,
  rollMailAvailable,
  computeMailContainers,
  rollMailContainers,
  applyPopulationTonnageDm,
  computeAvailableGoods,
  rollAvailableGoods,
  rollTradeGoodD66,
  rollIllegalGoodD66,
  computePurchaseModifier,
  computeSaleModifier,
  computePurchasePrice,
  computeSalePrice,
  rollPurchasePrice,
  rollSalePrice,
  combineTravelZones,
} from '../trade-calculator';
import { getTradeGoodByD66 } from '../../data/trade-tables';

describe('parseUwp', () => {
  it('parses a bare UWP string', () => {
    const world = parseUwp('C875553-7');
    expect(world).not.toBeNull();
    expect(world!.starport).toBe('C');
    expect(world!.size).toBe(8);
    expect(world!.atmosphere).toBe(7);
    expect(world!.hydrographics).toBe(5);
    expect(world!.population).toBe(5);
    expect(world!.government).toBe(5);
    expect(world!.lawLevel).toBe(3);
    expect(world!.techLevel).toBe(7);
  });

  it('parses a UWP embedded in a name/hex-prefixed string', () => {
    const world = parseUwp('Unnamed 0000 C875553-7 S AG NI');
    expect(world).not.toBeNull();
    expect(world!.starport).toBe('C');
    expect(world!.techLevel).toBe(7);
  });

  it('decodes hex letters for values above 9', () => {
    const world = parseUwp('CA6A643-9');
    expect(world).not.toBeNull();
    expect(world!.size).toBe(10);
    expect(world!.atmosphere).toBe(6);
    expect(world!.hydrographics).toBe(10);
    expect(world!.techLevel).toBe(9);
  });

  it('derives trade codes and travel zone from the recovered stats', () => {
    // Rich (Ri) requires population 6-8, government 4-9, atmosphere 6,8, or 9. Waterworld requires hydro 10.
    const world = parseUwp('CA6A643-9');
    expect(world).not.toBeNull();
    expect(world!.travelZone).toBeDefined();
    expect(Array.isArray(world!.tradeCodes)).toBe(true);
  });

  it('returns null when no UWP profile can be found', () => {
    expect(parseUwp('not a valid profile at all')).toBeNull();
  });
});

describe('combineTravelZones', () => {
  it('returns Red if either world is Red, regardless of order', () => {
    expect(combineTravelZones('Red', 'Amber')).toBe('Red');
    expect(combineTravelZones('Amber', 'Red')).toBe('Red');
    expect(combineTravelZones('Red', null)).toBe('Red');
    expect(combineTravelZones(null, 'Red')).toBe('Red');
  });

  it('returns Amber if either world is Amber and neither is Red', () => {
    expect(combineTravelZones('Amber', null)).toBe('Amber');
    expect(combineTravelZones(null, 'Amber')).toBe('Amber');
    expect(combineTravelZones('Amber', 'Amber')).toBe('Amber');
  });

  it('returns null when neither world is Amber or Red', () => {
    expect(combineTravelZones(null, null)).toBeNull();
  });
});

describe('computePassengerModifier', () => {
  const base = {
    passengerClass: 'Middle' as const,
    skillEffect: 0,
    stewardSkill: 0,
    sourcePopulation: 5,
    destPopulation: 5,
    sourceStarport: 'C' as const,
    destStarport: 'C' as const,
    travelZone: null,
    parsecs: 1,
  };

  it('applies High passage DM-4 and Low passage DM+1', () => {
    expect(computePassengerModifier({ ...base, passengerClass: 'High' })).toBe(-4);
    expect(computePassengerModifier({ ...base, passengerClass: 'Low' })).toBe(1);
    expect(computePassengerModifier(base)).toBe(0);
  });

  it('adds skill effect and steward skill', () => {
    expect(computePassengerModifier({ ...base, skillEffect: 2, stewardSkill: 3 })).toBe(5);
  });

  it('applies population DMs for source and destination', () => {
    expect(computePassengerModifier({ ...base, sourcePopulation: 1, destPopulation: 1 })).toBe(-8);
    expect(computePassengerModifier({ ...base, sourcePopulation: 9, destPopulation: 9 })).toBe(6);
    expect(computePassengerModifier({ ...base, sourcePopulation: 6, destPopulation: 6 })).toBe(2);
  });

  it('applies starport class DMs', () => {
    expect(computePassengerModifier({ ...base, sourceStarport: 'A', destStarport: 'A' })).toBe(4);
    expect(computePassengerModifier({ ...base, sourceStarport: 'X', destStarport: 'X' })).toBe(-6);
  });

  it('applies travel zone DMs', () => {
    expect(computePassengerModifier({ ...base, travelZone: 'Amber' })).toBe(1);
    expect(computePassengerModifier({ ...base, travelZone: 'Red' })).toBe(-4);
  });

  it('applies DM-1 per parsec past the first', () => {
    expect(computePassengerModifier({ ...base, parsecs: 4 })).toBe(-3);
  });
});

describe('computePassengerTraffic', () => {
  it('returns 0 when the modified roll is too low for any dice', () => {
    expect(computePassengerTraffic(2, -10, [])).toBe(0);
  });

  it('sums exactly the number of dice indicated by the traffic table', () => {
    // 2D roll of 7 with modifier 0 = 7 -> 3D
    expect(computePassengerTraffic(7, 0, [4, 5, 6, 1])).toBe(15);
  });
});

describe('rollPassengerTraffic', () => {
  it('returns a non-negative integer', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollPassengerTraffic(0);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getPassageFare', () => {
  it('looks up fares from the Passage & Freight table', () => {
    expect(getPassageFare(1, 'High')).toBe(9000);
    expect(getPassageFare(1, 'Low')).toBe(700);
    expect(getPassageFare(6, 'Middle')).toBe(130000);
  });

  it('clamps parsecs to the 1-6 range', () => {
    expect(getPassageFare(0, 'High')).toBe(9000);
    expect(getPassageFare(20, 'High')).toBe(210000);
  });
});

describe('computeFreightModifier', () => {
  const base = {
    lotSize: 'Minor' as const,
    skillEffect: 0,
    sourcePopulation: 5,
    destPopulation: 5,
    sourceStarport: 'C' as const,
    destStarport: 'C' as const,
    techLevel: 7,
    travelZone: null,
    parsecs: 1,
  };

  it('applies Major DM-4 and Incidental DM+2', () => {
    expect(computeFreightModifier({ ...base, lotSize: 'Major' })).toBe(-4);
    expect(computeFreightModifier({ ...base, lotSize: 'Incidental' })).toBe(2);
    expect(computeFreightModifier(base)).toBe(0);
  });

  it('applies population DMs for source and destination', () => {
    expect(computeFreightModifier({ ...base, sourcePopulation: 1, destPopulation: 1 })).toBe(-8);
    expect(computeFreightModifier({ ...base, sourcePopulation: 9, destPopulation: 9 })).toBe(8);
  });

  it('applies tech level DMs', () => {
    expect(computeFreightModifier({ ...base, techLevel: 9 })).toBe(2);
    expect(computeFreightModifier({ ...base, techLevel: 5 })).toBe(-1);
  });

  it('applies zone DMs', () => {
    expect(computeFreightModifier({ ...base, travelZone: 'Amber' })).toBe(-2);
    expect(computeFreightModifier({ ...base, travelZone: 'Red' })).toBe(-6);
  });
});

describe('computeFreightTraffic', () => {
  it('returns 0 for a very low modified roll', () => {
    expect(computeFreightTraffic(2, -10, [])).toBe(0);
  });

  it('sums the correct number of dice for the modified roll', () => {
    // 2D roll of 9 with modifier 0 -> 4D (Freight table: min 9 -> 4)
    expect(computeFreightTraffic(9, 0, [1, 2, 3, 4, 9])).toBe(10);
  });
});

describe('rollFreightTraffic', () => {
  it('returns a non-negative integer', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollFreightTraffic(0);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('computeLotTonnage', () => {
  it('computes Major lots as 1D x 10', () => {
    expect(computeLotTonnage('Major', [4])).toBe(40);
  });

  it('computes Minor lots as 1D x 5', () => {
    expect(computeLotTonnage('Minor', [4])).toBe(20);
  });

  it('computes Incidental lots as 1D x 1', () => {
    expect(computeLotTonnage('Incidental', [4])).toBe(4);
  });
});

describe('rollLotTonnage', () => {
  it('returns tonnage within the expected range for each lot size', () => {
    for (let i = 0; i < 20; i++) {
      expect(rollLotTonnage('Major')).toBeGreaterThanOrEqual(10);
      expect(rollLotTonnage('Major')).toBeLessThanOrEqual(60);
    }
  });
});

describe('getFreightRate', () => {
  it('looks up freight per-ton rates', () => {
    expect(getFreightRate(1)).toBe(1000);
    expect(getFreightRate(6)).toBe(32000);
  });
});

describe('computeMailModifier', () => {
  const base = { freightTrafficDM: 0, shipArmed: false, techLevel: 7, socDm: 0, navalOrScoutRank: 0 };

  it('applies freight traffic DM tiers', () => {
    expect(computeMailModifier({ ...base, freightTrafficDM: -12 })).toBe(-2);
    expect(computeMailModifier({ ...base, freightTrafficDM: -7 })).toBe(-1);
    expect(computeMailModifier({ ...base, freightTrafficDM: 7 })).toBe(1);
    expect(computeMailModifier({ ...base, freightTrafficDM: 12 })).toBe(2);
  });

  it('applies armed ship, low tech, SOC and rank DMs', () => {
    expect(computeMailModifier({ ...base, shipArmed: true })).toBe(2);
    expect(computeMailModifier({ ...base, techLevel: 4 })).toBe(-4);
    expect(computeMailModifier({ ...base, socDm: 2, navalOrScoutRank: 3 })).toBe(5);
  });
});

describe('computeMailAvailable', () => {
  it('succeeds only on a modified roll of 12+', () => {
    expect(computeMailAvailable(10, 2)).toBe(true);
    expect(computeMailAvailable(10, 1)).toBe(false);
  });
});

describe('rollMailAvailable', () => {
  it('returns a boolean', () => {
    expect(typeof rollMailAvailable(0)).toBe('boolean');
  });
});

describe('computeMailContainers / rollMailContainers', () => {
  it('returns exactly the dice sum for computeMailContainers', () => {
    expect(computeMailContainers(4)).toBe(4);
  });

  it('rolls between 1 and 6 containers', () => {
    for (let i = 0; i < 20; i++) {
      const result = rollMailContainers();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });
});

describe('applyPopulationTonnageDm', () => {
  it('applies DM-3 for population 3 or below, floored at 0', () => {
    expect(applyPopulationTonnageDm(2, 3)).toBe(0);
    expect(applyPopulationTonnageDm(5, 1)).toBe(2);
  });

  it('applies DM+3 for population 9 or above', () => {
    expect(applyPopulationTonnageDm(5, 9)).toBe(8);
  });

  it('applies no DM for population 4-8', () => {
    expect(applyPopulationTonnageDm(5, 5)).toBe(5);
  });
});

describe('computeAvailableGoods', () => {
  it('includes all Common goods regardless of trade codes', () => {
    const commonGoodCount = 6; // 11-16
    const goods = computeAvailableGoods(5, [], 'legal', [], new Array(commonGoodCount * 2).fill(3));
    expect(goods.length).toBe(commonGoodCount);
  });

  it('includes goods matching the world trade codes', () => {
    const goods = computeAvailableGoods(5, ['In', 'Ht'], 'legal', [], new Array(200).fill(3));
    const names = goods.map((g) => g.definition.name);
    expect(names).toContain('Advanced Electronics');
  });

  it('excludes illegal goods in legal mode and includes them in blackMarket mode', () => {
    const legalGoods = computeAvailableGoods(5, ['Ht'], 'legal', [], new Array(200).fill(3));
    expect(legalGoods.some((g) => g.definition.illegal)).toBe(false);

    const blackMarketGoods = computeAvailableGoods(5, ['Ht'], 'blackMarket', [], new Array(200).fill(3));
    expect(blackMarketGoods.some((g) => g.definition.illegal)).toBe(true);
  });

  it('excludes Exotics (66) from auto-stocking', () => {
    const goods = computeAvailableGoods(5, [], 'legal', ['66'], new Array(200).fill(3));
    expect(goods.some((g) => g.definition.d66 === '66')).toBe(false);
  });

  it('merges duplicate extra rolls into existing stock rather than duplicating entries', () => {
    const goods = computeAvailableGoods(5, [], 'legal', ['11', '11'], new Array(200).fill(3));
    const electronics = goods.filter((g) => g.definition.d66 === '11');
    expect(electronics.length).toBe(1);
  });
});

describe('rollTradeGoodD66 / rollIllegalGoodD66', () => {
  it('never returns 61-65 in legal mode', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollTradeGoodD66('legal');
      expect(result < '61' || result > '65').toBe(true);
    }
  });

  it('rollIllegalGoodD66 always returns a value in the 61-66 range', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollIllegalGoodD66();
      expect(result >= '61' && result <= '66').toBe(true);
    }
  });
});

describe('rollAvailableGoods', () => {
  it('always includes every Common good', () => {
    const goods = rollAvailableGoods(0, [], 'legal');
    const commonNames = ['Common Electronics', 'Common Industrial goods', 'Common manufactured goods', 'Common raw materials', 'Common consumables', 'Common Ore'];
    for (const name of commonNames) {
      expect(goods.some((g) => g.definition.name === name)).toBe(true);
    }
  });

  it('produces at least as many goods in blackMarket mode as legal mode for the same world', () => {
    const legal = rollAvailableGoods(5, ['Ht'], 'legal');
    const blackMarket = rollAvailableGoods(5, ['Ht'], 'blackMarket');
    expect(blackMarket.length).toBeGreaterThanOrEqual(legal.filter((g) => !g.definition.illegal).length);
  });
});

describe('computePurchaseModifier / computeSaleModifier', () => {
  const electronics = getTradeGoodByD66('11')!; // Industrial +2, High Tech +3, Rich +1 / Non-Industrial +2, Low Tech +1, Poor +1

  it('uses the best matching purchase DM and subtracts the best matching sale DM', () => {
    const modifier = computePurchaseModifier({
      good: electronics,
      brokerSkill: 2,
      counterpartyBrokerSkill: 2,
      tradeCodes: ['Ht', 'In'],
      travelZone: null,
    });
    // broker 2 + best purchase DM (Ht +3) - best sale DM (0, no Ni/Lt/Po) - supplier broker 2 = 3
    expect(modifier).toBe(3);
  });

  it('sale modifier mirrors purchase but swaps which DM column is added', () => {
    const modifier = computeSaleModifier({
      good: electronics,
      brokerSkill: 2,
      counterpartyBrokerSkill: 2,
      tradeCodes: ['Ni'],
      travelZone: null,
    });
    // broker 2 + best sale DM (Ni +2) - best purchase DM (0) - buyer broker 2 = 2
    expect(modifier).toBe(2);
  });
});

describe('computePurchasePrice / computeSalePrice', () => {
  it('applies the Modified Price table percentage to the base price', () => {
    expect(computePurchasePrice(8, 0, 1000)).toBe(1000); // roll 8 -> 100%
    expect(computeSalePrice(11, 0, 1000)).toBe(1000); // roll 11 -> 100%
  });
});

describe('rollPurchasePrice / rollSalePrice', () => {
  const electronics = getTradeGoodByD66('11')!;
  const params = { good: electronics, brokerSkill: 0, counterpartyBrokerSkill: 0, tradeCodes: [], travelZone: null };

  it('returns a roll between 3 and 18 and a non-negative price', () => {
    for (let i = 0; i < 20; i++) {
      const purchase = rollPurchasePrice(params);
      expect(purchase.roll).toBeGreaterThanOrEqual(3);
      expect(purchase.roll).toBeLessThanOrEqual(18);
      expect(purchase.price).toBeGreaterThanOrEqual(0);

      const sale = rollSalePrice(params);
      expect(sale.roll).toBeGreaterThanOrEqual(3);
      expect(sale.roll).toBeLessThanOrEqual(18);
      expect(sale.price).toBeGreaterThanOrEqual(0);
    }
  });
});
