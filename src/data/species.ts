import type { CharacteristicName, Species } from '../models/types';

export type SpeciesModifier = Partial<Record<CharacteristicName, number>>;

export const SPECIES_MODIFIERS: Record<Species, SpeciesModifier> = {
  human: {},
  aslan: { STR: 2, DEX: -2 },
  vargr: { STR: -1, DEX: 1, END: -1 },
};
