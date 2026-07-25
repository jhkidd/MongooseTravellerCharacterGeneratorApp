import { interpretEffect, resolveImmediate } from '../effect-interpreter';
import { createBlankCharacter } from '../../models/types';
import type { Character } from '../../models/types';
import type { EffectNode } from '../../models/effect-types';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return { ...createBlankCharacter(), ...overrides };
}

describe('resolveImmediate', () => {
  it('resolves gainSkill to GAIN_SKILL action', () => {
    const node: EffectNode = { type: 'gainSkill', skill: 'Streetwise', level: 1 };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'GAIN_SKILL', skill: 'Streetwise', level: 1 }]);
  });

  it('resolves gainSkill with default level 0', () => {
    const node: EffectNode = { type: 'gainSkill', skill: 'Recon' };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'GAIN_SKILL', skill: 'Recon', level: 0 }]);
  });

  it('resolves increaseSkill to INCREASE_SKILL action', () => {
    const node: EffectNode = { type: 'increaseSkill', skill: 'Recon' };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'INCREASE_SKILL', skill: 'Recon' }]);
  });

  it('resolves gainSpecialty to GAIN_SPECIALTY action', () => {
    const node: EffectNode = {
      type: 'gainSpecialty',
      skill: 'Gun Combat',
      specialty: 'Slug',
      level: 1,
    };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([
      { type: 'GAIN_SPECIALTY', skill: 'Gun Combat', specialty: 'Slug', level: 1 },
    ]);
  });

  it('resolves modCharacteristic to MOD_CHARACTERISTIC action', () => {
    const node: EffectNode = { type: 'modCharacteristic', characteristic: 'STR', value: -1 };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'MOD_CHARACTERISTIC', characteristic: 'STR', value: -1 }]);
  });

  it('resolves ensureCharacteristic to ENSURE_CHARACTERISTIC action', () => {
    const node: EffectNode = {
      type: 'ensureCharacteristic',
      characteristic: 'SOC',
      minimum: 10,
      fallback: { type: 'modCharacteristic', characteristic: 'SOC', value: 1 },
    };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([
      { type: 'ENSURE_CHARACTERISTIC', characteristic: 'SOC', minimum: 10, fallbackMod: 1 },
    ]);
  });

  it('resolves gainContact to GAIN_CONTACT action', () => {
    const node: EffectNode = { type: 'gainContact', contactType: 'ally' };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'GAIN_CONTACT', contactType: 'ally' });
  });

  it('resolves gainBenefitDM to MOD_BENEFIT_DM action', () => {
    const node: EffectNode = { type: 'gainBenefitDM', value: 1 };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'MOD_BENEFIT_DM', value: 1 }]);
  });

  it('resolves gainEquipment to ADD_EQUIPMENT action', () => {
    const node: EffectNode = { type: 'gainEquipment', item: 'TAS Membership' };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'ADD_EQUIPMENT', item: 'TAS Membership' }]);
  });

  it('resolves none as empty', () => {
    const node: EffectNode = { type: 'none' };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([]);
  });

  it('resolves compound effects in order', () => {
    const node: EffectNode = {
      type: 'compound',
      effects: [
        { type: 'gainSkill', skill: 'Recon', level: 1 },
        { type: 'modCharacteristic', characteristic: 'END', value: -1 },
      ],
    };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([
      { type: 'GAIN_SKILL', skill: 'Recon', level: 1 },
      { type: 'MOD_CHARACTERISTIC', characteristic: 'END', value: -1 },
    ]);
  });
});

describe('interpretEffect — signal-only effects', () => {
  it('ejectFromCareer emits signal', () => {
    const node: EffectNode = { type: 'ejectFromCareer' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    if (result.type === 'immediate') {
      expect(result.signals).toContain('ejectFromCareer');
    }
  });

  it('autoPromote emits signal', () => {
    const node: EffectNode = { type: 'autoPromote' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    if (result.type === 'immediate') {
      expect(result.signals).toContain('autoPromote');
    }
  });

  it('loseBenefitRoll emits signal', () => {
    const node: EffectNode = { type: 'loseBenefitRoll' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    if (result.type === 'immediate') {
      expect(result.signals).toContain('loseBenefitRoll');
    }
  });

  it('forceCareer emits signal with career name', () => {
    const node: EffectNode = { type: 'forceCareer', career: 'prisoner' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    if (result.type === 'immediate') {
      expect(result.signals).toContain('forceCareer:prisoner');
    }
  });

  it('gainAdvancementDM emits signal with value', () => {
    const node: EffectNode = { type: 'gainAdvancementDM', value: 2 };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    if (result.type === 'immediate') {
      expect(result.signals).toContain('advancementDM:2');
    }
  });
});

describe('interpretEffect — interactive effects (pause)', () => {
  it('pauses on choice effect', () => {
    const node: EffectNode = {
      type: 'choice',
      prompt: 'Accept the deal?',
      options: [
        { label: 'Accept', effects: [{ type: 'gainSkill', skill: 'Broker' }] },
        { label: 'Refuse', effects: [{ type: 'gainContact', contactType: 'enemy' }] },
      ],
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('choice');
      expect(result.prompt).toBe('Accept the deal?');
      expect(result.options).toHaveLength(2);
    }
  });

  it('pauses on pickSkill effect', () => {
    const node: EffectNode = {
      type: 'pickSkill',
      options: ['Recon', 'Stealth', 'Deception'],
      level: 1,
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('pickSkill');
      expect(result.options).toEqual(['Recon', 'Stealth', 'Deception']);
    }
  });

  it('pauses on pickOne effect', () => {
    const node: EffectNode = {
      type: 'pickOne',
      prompt: 'Choose your reward',
      options: [
        { label: 'Weapon', effect: { type: 'gainEquipment', item: 'Weapon' } },
        { label: 'Armour', effect: { type: 'gainEquipment', item: 'Armour' } },
      ],
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('pickOne');
    }
  });

  it('pauses on narrative effect', () => {
    const node: EffectNode = {
      type: 'narrative',
      prompt: 'Describe how you escaped.',
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('narrative');
      expect(result.prompt).toBe('Describe how you escaped.');
    }
  });

  it('pauses on increaseExistingSkill (player must pick from owned skills)', () => {
    const char = makeCharacter({ skills: { Recon: 1, Stealth: 0 } });
    const node: EffectNode = { type: 'increaseExistingSkill', filter: 'owned' };
    const result = interpretEffect(node, char);
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('pickSkill');
      expect(result.options).toContain('Recon');
      expect(result.options).toContain('Stealth');
    }
  });

  it('pauses on skillCheck (show roll to player)', () => {
    const node: EffectNode = {
      type: 'skillCheck',
      skill: 'Advocate',
      target: 8,
      success: { type: 'none' },
      failure: { type: 'loseBenefitRoll' },
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('skillCheck');
    }
  });

  it('pauses on rollOnTable', () => {
    const node: EffectNode = { type: 'rollOnTable', table: 'injury' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('skillCheck');
    }
  });

  it('pauses on diceRoll', () => {
    const node: EffectNode = {
      type: 'diceRoll',
      dice: 'D3',
      effectPerUnit: { type: 'gainContact', contactType: 'contact' },
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
  });
});

describe('interpretEffect — compound with mixed immediate/interactive', () => {
  it('applies immediate effects and pauses on first interactive', () => {
    const node: EffectNode = {
      type: 'compound',
      effects: [
        { type: 'gainSkill', skill: 'Recon' },
        {
          type: 'choice',
          prompt: 'What next?',
          options: [
            { label: 'A', effects: [{ type: 'none' }] },
            { label: 'B', effects: [{ type: 'none' }] },
          ],
        },
      ],
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.immediateActions).toEqual([{ type: 'GAIN_SKILL', skill: 'Recon', level: 0 }]);
    }
  });

  it('resolves fully immediate compound as immediate', () => {
    const node: EffectNode = {
      type: 'compound',
      effects: [
        { type: 'gainSkill', skill: 'Recon', level: 1 },
        { type: 'ejectFromCareer' },
      ],
    };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    if (result.type === 'immediate') {
      expect(result.actions).toEqual([{ type: 'GAIN_SKILL', skill: 'Recon', level: 1 }]);
      expect(result.signals).toContain('ejectFromCareer');
    }
  });
});
