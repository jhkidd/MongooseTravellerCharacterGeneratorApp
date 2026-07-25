import { SPECIES_MODIFIERS } from '../species';

describe('SPECIES_MODIFIERS', () => {
  it('human has no modifiers', () => {
    expect(SPECIES_MODIFIERS.human).toEqual({});
  });

  it('aslan has STR +2, DEX -2', () => {
    expect(SPECIES_MODIFIERS.aslan).toEqual({ STR: 2, DEX: -2 });
  });

  it('vargr has STR -1, DEX +1, END -1', () => {
    expect(SPECIES_MODIFIERS.vargr).toEqual({ STR: -1, DEX: 1, END: -1 });
  });
});
