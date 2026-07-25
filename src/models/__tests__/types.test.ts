import type {
  Character,
  Characteristics,
  CharacteristicName,
  Contact,
  ContactType,
  CareerTerm,
  TimelineEntry,
  Species,
} from '../types';
import type {
  CareerData,
  Assignment,
  SkillTable,
  SkillTableEntry,
  RankStructure,
  QualificationCheck,
} from '../career-types';
import type { EffectNode } from '../effect-types';

describe('Type definitions', () => {
  it('creates a valid Characteristics object', () => {
    const chars: Characteristics = {
      STR: 7, DEX: 8, END: 6, INT: 10, EDU: 9, SOC: 5,
    };
    expect(chars.STR).toBe(7);
    expect(chars.SOC).toBe(5);
  });

  it('enforces CharacteristicName as union', () => {
    const names: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
    expect(names).toHaveLength(6);
  });

  it('creates a valid Contact', () => {
    const contact: Contact = {
      id: 'c1',
      name: 'Marcus',
      type: 'ally',
      description: 'Old army buddy',
      history: [
        { term: 2, description: 'Served together in the infantry' },
      ],
    };
    expect(contact.type).toBe('ally');
    expect(contact.history).toHaveLength(1);
  });

  it('creates a minimal Character', () => {
    const char: Character = {
      name: 'Test Traveller',
      species: 'human',
      homeworld: 'Terra',
      backgroundNotes: '',
      characteristics: { STR: 7, DEX: 8, END: 6, INT: 10, EDU: 9, SOC: 5 },
      skills: {},
      specialties: {},
      age: 18,
      currentTerm: 0,
      careers: [],
      contacts: [],
      cash: 0,
      benefits: [],
      benefitDMs: 0,
      pensionPerYear: 0,
      timeline: [],
    };
    expect(char.age).toBe(18);
    expect(char.species).toBe('human');
  });

  it('creates a valid QualificationCheck', () => {
    const qual: QualificationCheck = {
      characteristic: 'INT',
      target: 6,
      modifiers: [{ type: 'previousCareers', dmPer: -1 }],
    };
    expect(qual.target).toBe(6);
  });

  it('creates a valid EffectNode (gainSkill)', () => {
    const effect: EffectNode = {
      type: 'gainSkill',
      skill: 'Streetwise',
      level: 1,
    };
    expect(effect.type).toBe('gainSkill');
  });

  it('creates a compound effect with nested choice', () => {
    const effect: EffectNode = {
      type: 'choice',
      prompt: 'Accept the deal?',
      options: [
        {
          label: 'Accept',
          effects: [{ type: 'ejectFromCareer' }],
        },
        {
          label: 'Refuse',
          effects: [
            { type: 'gainContact', contactType: 'enemy' },
            { type: 'gainSkill', skill: 'Deception', level: 1 },
          ],
        },
      ],
    };
    expect(effect.type).toBe('choice');
  });

  it('creates a skill check effect with success/failure branches', () => {
    const effect: EffectNode = {
      type: 'skillCheck',
      skill: 'Advocate',
      target: 8,
      success: { type: 'narrative', prompt: 'You kept your benefit roll.' },
      failure: { type: 'loseBenefitRoll' },
    };
    expect(effect.type).toBe('skillCheck');
  });
});
