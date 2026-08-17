import {
  computeHasGasGiant,
  computeSize,
  computeAtmosphere,
  getTemperatureDM,
  computeTemperature,
  computeHydrographics,
  computePopulation,
  computeGovernment,
  computeFactionCount,
  computeFaction,
  computeLawLevel,
  getStarportPopulationDM,
  computeStarportClass,
  computeTechLevel,
  getHighportDM,
  getCorsairDM,
  computeBases,
  computeTradeCodes,
  computeTravelZone,
  getTravelZoneReasons,
  toHexDigit,
  formatUwp,
  generatePlanet,
} from '../planet-generator';
import type { Bases } from '../../models/planet';

describe('computeHasGasGiant', () => {
  it('returns false only on a roll of 10, 11 or 12', () => {
    expect(computeHasGasGiant(9)).toBe(true);
    expect(computeHasGasGiant(10)).toBe(false);
    expect(computeHasGasGiant(11)).toBe(false);
    expect(computeHasGasGiant(12)).toBe(false);
  });
});

describe('computeSize', () => {
  it('is diceSum - 2, clamped 0-10', () => {
    expect(computeSize(2)).toBe(0);
    expect(computeSize(7)).toBe(5);
    expect(computeSize(12)).toBe(10);
  });
});

describe('computeAtmosphere', () => {
  it('is diceSum - 7 + size, clamped 0-15', () => {
    expect(computeAtmosphere(5, 10)).toBe(8); // 5-7+10=8, per the worked example in the rules doc
    expect(computeAtmosphere(2, 0)).toBe(0); // clipped at 0
    expect(computeAtmosphere(12, 10)).toBe(15); // clipped at 15
  });
});

describe('getTemperatureDM', () => {
  it('applies the correct DM per atmosphere', () => {
    expect(getTemperatureDM(2)).toBe(-2);
    expect(getTemperatureDM(3)).toBe(-2);
    expect(getTemperatureDM(4)).toBe(-1);
    expect(getTemperatureDM(5)).toBe(-1);
    expect(getTemperatureDM(14)).toBe(-1);
    expect(getTemperatureDM(8)).toBe(1);
    expect(getTemperatureDM(9)).toBe(1);
    expect(getTemperatureDM(10)).toBe(2);
    expect(getTemperatureDM(13)).toBe(2);
    expect(getTemperatureDM(15)).toBe(2);
    expect(getTemperatureDM(11)).toBe(6);
    expect(getTemperatureDM(12)).toBe(6);
    expect(getTemperatureDM(6)).toBe(0);
  });
});

describe('computeTemperature', () => {
  it('adds the atmosphere DM to the dice sum', () => {
    expect(computeTemperature(7, 6)).toBe(7);
    expect(computeTemperature(7, 3)).toBe(5);
  });
});

describe('computeHydrographics', () => {
  it('is always 0 for size 0 or 1', () => {
    expect(computeHydrographics(12, 0, 6, 7)).toBe(0);
    expect(computeHydrographics(12, 1, 6, 7)).toBe(0);
  });

  it('matches the worked example in the rules doc (atmosphere 12 rolling 10)', () => {
    // roll 10, -7 +12(atmosphere) = 15, -4 (atmosphere penalty) = 11, clipped to 10.
    expect(computeHydrographics(10, 5, 12, 7)).toBe(10);
  });

  it('applies the hot/boiling temperature penalty unless atmosphere is 13 or 15', () => {
    const hotTemp = 10;
    const boilingTemp = 12;
    expect(computeHydrographics(10, 5, 6, hotTemp)).toBe(10 - 7 + 6 - 2);
    expect(computeHydrographics(10, 5, 6, boilingTemp)).toBe(10 - 7 + 6 - 6);
    // atmosphere 13 is exempt from the hot/boiling temperature penalty (but still gets the -4 atmosphere penalty)
    expect(computeHydrographics(10, 5, 13, boilingTemp)).toBe(10); // 10-7+13-4=12, clipped to 10
  });
});

describe('computePopulation', () => {
  it('is diceSum - 2, clamped 0-10', () => {
    expect(computePopulation(2)).toBe(0);
    expect(computePopulation(12)).toBe(10);
  });
});

describe('computeGovernment', () => {
  it('is forced to 0 when population is 0', () => {
    expect(computeGovernment(10, 0)).toBe(0);
  });

  it('is diceSum - 7 + population, clamped 0-15', () => {
    expect(computeGovernment(7, 6)).toBe(6);
    expect(computeGovernment(2, 1)).toBe(0);
  });
});

describe('computeFactionCount', () => {
  it('is 0 when uninhabited', () => {
    expect(computeFactionCount(2, 0, 0)).toBe(0);
  });

  it('applies +1 DM for government 0 or 7 and -1 DM for government 10+', () => {
    expect(computeFactionCount(1, 0, 5)).toBe(2);
    expect(computeFactionCount(1, 7, 5)).toBe(2);
    expect(computeFactionCount(2, 10, 5)).toBe(1);
    expect(computeFactionCount(1, 5, 5)).toBe(1);
  });

  it('never goes below 0', () => {
    expect(computeFactionCount(0, 12, 5)).toBe(0);
  });
});

describe('computeFaction', () => {
  it('reuses the government formula and records strength', () => {
    const faction = computeFaction(7, 6, 8);
    expect(faction.government).toBe(6);
    expect(faction.strength).toBe(8);
  });
});

describe('computeLawLevel', () => {
  it('is forced to 0 when population is 0', () => {
    expect(computeLawLevel(10, 8, 0)).toBe(0);
  });

  it('is diceSum - 7 + government, clamped 0-15', () => {
    expect(computeLawLevel(7, 3, 5)).toBe(3);
    expect(computeLawLevel(2, 0, 5)).toBe(0);
  });
});

describe('getStarportPopulationDM', () => {
  it('matches the population DM table', () => {
    expect(getStarportPopulationDM(10)).toBe(2);
    expect(getStarportPopulationDM(8)).toBe(1);
    expect(getStarportPopulationDM(9)).toBe(1);
    expect(getStarportPopulationDM(5)).toBe(0);
    expect(getStarportPopulationDM(4)).toBe(-1);
    expect(getStarportPopulationDM(2)).toBe(-2);
    expect(getStarportPopulationDM(0)).toBe(-2);
  });
});

describe('computeStarportClass', () => {
  it('maps dice result + DM to the correct class', () => {
    expect(computeStarportClass(2, 5)).toBe('X');
    expect(computeStarportClass(4, 5)).toBe('E');
    expect(computeStarportClass(6, 5)).toBe('D');
    expect(computeStarportClass(8, 5)).toBe('C');
    expect(computeStarportClass(10, 5)).toBe('B');
    expect(computeStarportClass(11, 5)).toBe('A');
  });
});

describe('computeTechLevel', () => {
  it('is forced to 0 when population is 0', () => {
    expect(computeTechLevel(6, 'A', 8, 6, 7, 0, 6)).toBe(0);
  });

  it('never drops below 0', () => {
    expect(computeTechLevel(1, 'X', 5, 6, 5, 5, 5)).toBe(0);
  });

  it('sums dice roll with all applicable DMs', () => {
    // Earth-like: starport A(+6), size 8(0), atmosphere 6(0), hydro 7(0), pop 9(+2), gov 6(0)
    expect(computeTechLevel(6, 'A', 8, 6, 7, 9, 6)).toBe(6 + 6 + 2);
  });
});

describe('getHighportDM', () => {
  it('applies tech level and population DMs', () => {
    expect(getHighportDM(12, 9)).toBe(2 + 1);
    expect(getHighportDM(9, 6)).toBe(1 - 1);
    expect(getHighportDM(5, 5)).toBe(-1);
  });
});

describe('getCorsairDM', () => {
  it('applies law level DMs', () => {
    expect(getCorsairDM(0)).toBe(2);
    expect(getCorsairDM(2)).toBe(-2);
    expect(getCorsairDM(1)).toBe(0);
  });
});

describe('computeBases', () => {
  const rolls = { highport: 8, scout: 9, naval: 8, military: 8, corsair: 10 };

  it('only checks corsair for class X and E', () => {
    const expected: Bases = { scout: false, naval: false, military: false, corsair: true, highport: false };
    expect(computeBases('X', 5, 5, 1, rolls)).toEqual(expected);
    expect(computeBases('E', 5, 5, 1, rolls)).toEqual(expected);
  });

  it('checks scout, corsair (12+) and highport (12+) for class D', () => {
    const result = computeBases('D', 5, 5, 1, rolls);
    expect(result).toEqual({ scout: true, naval: false, military: false, corsair: false, highport: false });
  });

  it('checks military, scout and highport (10+) for class C', () => {
    const result = computeBases('C', 5, 5, 1, { ...rolls, military: 10 });
    expect(result).toEqual({ scout: true, naval: false, military: true, corsair: false, highport: false });
  });

  it('checks military, naval, scout and highport (8+) for class B', () => {
    // highport roll 8 + DM -1 (tech 5, pop 5) = 7, below the 8+ threshold
    const result = computeBases('B', 5, 5, 1, rolls);
    expect(result).toEqual({ scout: true, naval: true, military: true, corsair: false, highport: false });
  });

  it('checks military, naval, scout (10+) and highport (6+) for class A', () => {
    const result = computeBases('A', 5, 5, 1, { ...rolls, scout: 10 });
    expect(result).toEqual({ scout: true, naval: true, military: true, corsair: false, highport: true });
  });
});

describe('computeTradeCodes', () => {
  it('classifies a rich waterworld like the COGRI example', () => {
    const codes = computeTradeCodes({
      size: 8, atmosphere: 6, hydrographics: 10, population: 6, government: 4, lawLevel: 3, techLevel: 9,
    });
    const codeIds = codes.map((c) => c.code);
    expect(codeIds).toContain('Ri');
    expect(codeIds).toContain('Wa');
  });

  it('classifies a barren world', () => {
    const codes = computeTradeCodes({
      size: 5, atmosphere: 5, hydrographics: 0, population: 0, government: 0, lawLevel: 0, techLevel: 0,
    });
    expect(codes.map((c) => c.code)).toContain('Ba');
  });
});

describe('computeTravelZone', () => {
  it('is Amber for exotic atmospheres, unstable governments or extreme law levels', () => {
    expect(computeTravelZone(10, 6, 5)).toBe('Amber');
    expect(computeTravelZone(6, 0, 5)).toBe('Amber');
    expect(computeTravelZone(6, 7, 5)).toBe('Amber');
    expect(computeTravelZone(6, 10, 5)).toBe('Amber');
    expect(computeTravelZone(6, 6, 0)).toBe('Amber');
    expect(computeTravelZone(6, 6, 9)).toBe('Amber');
  });

  it('is null (green) for an ordinary stable world', () => {
    expect(computeTravelZone(6, 6, 5)).toBeNull();
  });
});

describe('getTravelZoneReasons', () => {
  it('reports each condition that triggers an Amber zone', () => {
    expect(getTravelZoneReasons(10, 6, 5)).toEqual(['exotic atmosphere']);
    expect(getTravelZoneReasons(6, 0, 5)).toEqual(['None government']);
    expect(getTravelZoneReasons(6, 6, 0)).toEqual(['no law level']);
    expect(getTravelZoneReasons(6, 6, 9)).toEqual(['extreme law level']);
  });

  it('reports multiple reasons when several conditions apply', () => {
    expect(getTravelZoneReasons(10, 0, 0)).toEqual(['exotic atmosphere', 'None government', 'no law level']);
  });

  it('returns an empty array for an ordinary stable world', () => {
    expect(getTravelZoneReasons(6, 6, 5)).toEqual([]);
  });
});

describe('toHexDigit', () => {
  it('renders values 0-9 as digits and 10-15 as A-F', () => {
    expect(toHexDigit(0)).toBe('0');
    expect(toHexDigit(9)).toBe('9');
    expect(toHexDigit(10)).toBe('A');
    expect(toHexDigit(15)).toBe('F');
  });

  it('extends beyond F for unusual high values', () => {
    expect(toHexDigit(16)).toBe('G');
  });
});

describe('formatUwp', () => {
  it('renders the COGRI example format', () => {
    const uwp = formatUwp({
      name: 'COGRI',
      hexLocation: '0101',
      hasGasGiant: true,
      size: 10,
      atmosphere: 6,
      temperature: 7,
      hydrographics: 10,
      population: 6,
      government: 4,
      lawLevel: 3,
      techLevel: 9,
      starport: 'C',
      bases: { scout: false, naval: true, military: false, corsair: false, highport: false },
      factions: [],
      tradeCodes: [{ code: 'Ri', name: 'Rich' }, { code: 'Wa', name: 'Water World' }],
      travelZone: 'Amber',
    });

    expect(uwp).toBe('COGRI 0101 CA6A643-9 N RI WA A');
  });
});

describe('generatePlanet', () => {
  it('produces internally consistent output across many rolls', () => {
    for (let i = 0; i < 50; i++) {
      const planet = generatePlanet('Test', '0101');

      expect(planet.size).toBeGreaterThanOrEqual(0);
      expect(planet.size).toBeLessThanOrEqual(10);

      if (planet.size <= 1) {
        expect(planet.hydrographics).toBe(0);
      }

      if (planet.population === 0) {
        expect(planet.government).toBe(0);
        expect(planet.lawLevel).toBe(0);
        expect(planet.techLevel).toBe(0);
        expect(planet.factions).toHaveLength(0);
      }

      expect(['A', 'B', 'C', 'D', 'E', 'X']).toContain(planet.starport);
      expect(formatUwp(planet)).toContain('Test');
    }
  });
});
