import { characterReducer, type CharacterAction } from '../character-reducer';
import { createBlankCharacter } from '../../models/types';
import type { Character } from '../../models/types';

function applyActions(actions: CharacterAction[]): Character {
  return actions.reduce(characterReducer, createBlankCharacter());
}

describe('characterReducer', () => {
  describe('SET_NAME', () => {
    it('sets the character name', () => {
      const result = applyActions([{ type: 'SET_NAME', name: 'Marcus Cole' }]);
      expect(result.name).toBe('Marcus Cole');
    });
  });

  describe('SET_SPECIES', () => {
    it('sets the species', () => {
      const result = applyActions([{ type: 'SET_SPECIES', species: 'aslan' }]);
      expect(result.species).toBe('aslan');
    });
  });

  describe('SET_HOMEWORLD', () => {
    it('sets the homeworld', () => {
      const result = applyActions([{ type: 'SET_HOMEWORLD', homeworld: 'Regina' }]);
      expect(result.homeworld).toBe('Regina');
    });
  });

  describe('SET_CHARACTERISTIC', () => {
    it('sets a single characteristic', () => {
      const result = applyActions([{ type: 'SET_CHARACTERISTIC', characteristic: 'STR', value: 9 }]);
      expect(result.characteristics.STR).toBe(9);
    });
  });

  describe('SET_ALL_CHARACTERISTICS', () => {
    it('sets all characteristics at once', () => {
      const chars = { STR: 7, DEX: 8, END: 6, INT: 10, EDU: 9, SOC: 5 };
      const result = applyActions([{ type: 'SET_ALL_CHARACTERISTICS', characteristics: chars }]);
      expect(result.characteristics).toEqual(chars);
    });
  });

  describe('MOD_CHARACTERISTIC', () => {
    it('adds to a characteristic', () => {
      const result = applyActions([
        { type: 'SET_CHARACTERISTIC', characteristic: 'STR', value: 7 },
        { type: 'MOD_CHARACTERISTIC', characteristic: 'STR', value: 2 },
      ]);
      expect(result.characteristics.STR).toBe(9);
    });

    it('does not go below 0', () => {
      const result = applyActions([
        { type: 'SET_CHARACTERISTIC', characteristic: 'DEX', value: 3 },
        { type: 'MOD_CHARACTERISTIC', characteristic: 'DEX', value: -5 },
      ]);
      expect(result.characteristics.DEX).toBe(0);
    });
  });

  describe('ENSURE_CHARACTERISTIC', () => {
    it('sets to minimum if below', () => {
      const result = applyActions([
        { type: 'SET_CHARACTERISTIC', characteristic: 'SOC', value: 8 },
        { type: 'ENSURE_CHARACTERISTIC', characteristic: 'SOC', minimum: 10, fallbackMod: 1 },
      ]);
      expect(result.characteristics.SOC).toBe(10);
    });

    it('applies fallback mod if already at or above minimum', () => {
      const result = applyActions([
        { type: 'SET_CHARACTERISTIC', characteristic: 'SOC', value: 11 },
        { type: 'ENSURE_CHARACTERISTIC', characteristic: 'SOC', minimum: 10, fallbackMod: 1 },
      ]);
      expect(result.characteristics.SOC).toBe(12);
    });
  });

  describe('GAIN_SKILL', () => {
    it('adds a skill at level 0 by default', () => {
      const result = applyActions([{ type: 'GAIN_SKILL', skill: 'Streetwise' }]);
      expect(result.skills.Streetwise).toBe(0);
    });

    it('adds a skill at a specific level', () => {
      const result = applyActions([{ type: 'GAIN_SKILL', skill: 'Recon', level: 1 }]);
      expect(result.skills.Recon).toBe(1);
    });

    it('does not decrease an existing skill', () => {
      const result = applyActions([
        { type: 'GAIN_SKILL', skill: 'Recon', level: 2 },
        { type: 'GAIN_SKILL', skill: 'Recon', level: 1 },
      ]);
      expect(result.skills.Recon).toBe(2);
    });
  });

  describe('INCREASE_SKILL', () => {
    it('increments an existing skill by 1', () => {
      const result = applyActions([
        { type: 'GAIN_SKILL', skill: 'Recon', level: 0 },
        { type: 'INCREASE_SKILL', skill: 'Recon' },
      ]);
      expect(result.skills.Recon).toBe(1);
    });

    it('adds the skill at 1 if not yet owned', () => {
      const result = applyActions([{ type: 'INCREASE_SKILL', skill: 'Recon' }]);
      expect(result.skills.Recon).toBe(1);
    });
  });

  describe('GAIN_SPECIALTY', () => {
    it('adds a specialty at level 1 and ensures base skill at 0', () => {
      const result = applyActions([
        { type: 'GAIN_SPECIALTY', skill: 'Gun Combat', specialty: 'Slug', level: 1 },
      ]);
      expect(result.specialties['Gun Combat:Slug']).toBe(1);
      expect(result.skills['Gun Combat']).toBe(0);
    });

    it('does not decrease an existing specialty', () => {
      const result = applyActions([
        { type: 'GAIN_SPECIALTY', skill: 'Gun Combat', specialty: 'Slug', level: 2 },
        { type: 'GAIN_SPECIALTY', skill: 'Gun Combat', specialty: 'Slug', level: 1 },
      ]);
      expect(result.specialties['Gun Combat:Slug']).toBe(2);
    });
  });

  describe('GAIN_CONTACT', () => {
    it('adds a contact', () => {
      const result = applyActions([
        { type: 'GAIN_CONTACT', contactType: 'ally', name: 'Zara', description: 'An old friend' },
      ]);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].type).toBe('ally');
      expect(result.contacts[0].name).toBe('Zara');
    });
  });

  describe('ADD_CASH', () => {
    it('adds cash', () => {
      const result = applyActions([{ type: 'ADD_CASH', amount: 10000 }]);
      expect(result.cash).toBe(10000);
    });
  });

  describe('ADD_BENEFIT', () => {
    it('adds a benefit item', () => {
      const result = applyActions([{ type: 'ADD_BENEFIT', benefit: 'Ship Share' }]);
      expect(result.benefits).toContain('Ship Share');
    });
  });

  describe('MOD_BENEFIT_DM', () => {
    it('adds to the benefit DM accumulator', () => {
      const result = applyActions([
        { type: 'MOD_BENEFIT_DM', value: 1 },
        { type: 'MOD_BENEFIT_DM', value: 1 },
      ]);
      expect(result.benefitDMs).toBe(2);
    });
  });

  describe('INCREMENT_AGE', () => {
    it('adds 4 years per term', () => {
      const result = applyActions([{ type: 'INCREMENT_AGE', years: 4 }]);
      expect(result.age).toBe(22);
    });
  });

  describe('INCREMENT_TERM', () => {
    it('increments the current term', () => {
      const result = applyActions([{ type: 'INCREMENT_TERM' }]);
      expect(result.currentTerm).toBe(1);
    });
  });

  describe('ADD_CAREER_TERM', () => {
    it('adds a career term record', () => {
      const result = applyActions([{
        type: 'ADD_CAREER_TERM',
        careerTerm: {
          term: 1,
          career: 'army',
          assignment: 'infantry',
          rank: 0,
          rankTitle: 'Private',
          commissioned: false,
          events: [],
          survived: true,
          advanced: false,
        },
      }]);
      expect(result.careers).toHaveLength(1);
      expect(result.careers[0].career).toBe('army');
    });
  });

  describe('ADD_TIMELINE_ENTRY', () => {
    it('appends to the timeline', () => {
      const result = applyActions([{
        type: 'ADD_TIMELINE_ENTRY',
        entry: {
          term: 1,
          age: 22,
          type: 'career_start',
          description: 'Enlisted in the Army',
        },
      }]);
      expect(result.timeline).toHaveLength(1);
    });
  });

  describe('SET_BACKGROUND_NOTES', () => {
    it('sets the background notes', () => {
      const result = applyActions([{ type: 'SET_BACKGROUND_NOTES', notes: 'Born on Regina' }]);
      expect(result.backgroundNotes).toBe('Born on Regina');
    });
  });

  it('returns state unchanged for unknown action type', () => {
    const state = createBlankCharacter();
    const result = characterReducer(state, { type: 'UNKNOWN' } as unknown as CharacterAction);
    expect(result).toBe(state);
  });
});
