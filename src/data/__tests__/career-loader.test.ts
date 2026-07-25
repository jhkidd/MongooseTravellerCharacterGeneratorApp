import { getAllCareerIds, getSelectableCareers, loadCareer } from '../career-loader';

describe('getAllCareerIds', () => {
  it('returns agent and army', () => {
    const ids = getAllCareerIds();
    expect(ids).toContain('agent');
    expect(ids).toContain('army');
  });
});

describe('loadCareer', () => {
  it('loads the agent career', () => {
    const career = loadCareer('agent');
    expect(career.id).toBe('agent');
    expect(career.name).toBe('Agent');
    expect(career.qualification?.characteristic).toBe('INT');
    expect(career.qualification?.target).toBe(6);
  });

  it('loads the army career', () => {
    const career = loadCareer('army');
    expect(career.id).toBe('army');
    expect(career.name).toBe('Army');
    expect(career.commission?.characteristic).toBe('SOC');
    expect(career.commission?.target).toBe(8);
  });

  it('throws for unknown career', () => {
    expect(() => loadCareer('pirate')).toThrow('Unknown career: "pirate"');
  });

  it('agent has 3 assignments', () => {
    const career = loadCareer('agent');
    expect(career.assignments).toHaveLength(3);
  });

  it('army has 3 assignments', () => {
    const career = loadCareer('army');
    expect(career.assignments).toHaveLength(3);
  });

  it('agent has assignment-based rank structure', () => {
    const career = loadCareer('agent');
    expect(career.ranks.type).toBe('assignment');
  });

  it('army has split rank structure', () => {
    const career = loadCareer('army');
    expect(career.ranks.type).toBe('split');
    expect(career.ranks.tracks.enlisted).toBeDefined();
    expect(career.ranks.tracks.officer).toBeDefined();
  });

  it('army has age modifier on qualification', () => {
    const career = loadCareer('army');
    const ageMod = career.qualification?.modifiers?.find((modifier) => modifier.type === 'age');
    expect(ageMod).toBeDefined();
    expect(ageMod?.threshold).toBe(30);
    expect(ageMod?.dm).toBe(-2);
  });
});

describe('getSelectableCareers', () => {
  it('returns careers without isSpecial flag', () => {
    const careers = getSelectableCareers();
    expect(careers.length).toBeGreaterThanOrEqual(2);
    careers.forEach((career) => {
      expect(career.isSpecial).toBeFalsy();
    });
  });
});
