import { SKILLS_REGISTRY, getSpecialties, hasSpecialties } from '../skills';

describe('SKILLS_REGISTRY', () => {
  it('contains all expected skills', () => {
    expect(Object.keys(SKILLS_REGISTRY).length).toBeGreaterThanOrEqual(39);
  });

  it('Animals has Handling, Veterinary, Training specialties', () => {
    expect(SKILLS_REGISTRY.Animals).toEqual(['Handling', 'Veterinary', 'Training']);
  });

  it('Admin has no specialties', () => {
    expect(SKILLS_REGISTRY.Admin).toEqual([]);
  });
});

describe('hasSpecialties', () => {
  it('returns true for skills with specialties', () => {
    expect(hasSpecialties('Gun Combat')).toBe(true);
  });

  it('returns false for skills without specialties', () => {
    expect(hasSpecialties('Recon')).toBe(false);
  });
});

describe('getSpecialties', () => {
  it('returns specialties array', () => {
    expect(getSpecialties('Gun Combat')).toEqual(['Archaic', 'Energy', 'Slug']);
  });

  it('returns empty array for unknown skill', () => {
    expect(getSpecialties('FakeSkill')).toEqual([]);
  });
});
