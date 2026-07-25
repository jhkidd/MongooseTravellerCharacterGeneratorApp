/**
 * Complete Mongoose Traveller 2e skills registry.
 * Maps skill name → array of specialty names (empty array = no specialties).
 */
export const SKILLS_REGISTRY: Record<string, string[]> = {
  Admin: [],
  Advocate: [],
  Animals: ['Handling', 'Veterinary', 'Training'],
  Art: ['Performer', 'Holography', 'Instrument', 'Visual Media', 'Write'],
  Astrogation: [],
  Athletics: ['Dexterity', 'Endurance', 'Strength'],
  Broker: [],
  Carouse: [],
  Deception: [],
  Diplomat: [],
  Drive: ['Hovercraft', 'Mole', 'Track', 'Walker', 'Wheel'],
  Electronics: ['Comms', 'Computers', 'Remote Ops', 'Sensors'],
  Engineer: ['M-drive', 'J-drive', 'Life Support', 'Power'],
  Explosives: [],
  Flyer: ['Airship', 'Grav', 'Ornithopter', 'Rotor', 'Wing'],
  Gambler: [],
  'Gun Combat': ['Archaic', 'Energy', 'Slug'],
  Gunner: ['Turret', 'Ortillery', 'Screen', 'Capital'],
  'Heavy Weapons': ['Artillery', 'Man Portable', 'Vehicle'],
  Investigate: [],
  'Jack-of-all-Trades': [],
  Language: [],
  Leadership: [],
  Mechanic: [],
  Medic: [],
  Melee: ['Unarmed', 'Blade', 'Bludgeon', 'Natural'],
  Navigation: [],
  Persuade: [],
  Pilot: ['Small Craft', 'Spacecraft', 'Capital Ships'],
  Profession: [],
  Recon: [],
  Science: ['Physics', 'Chemistry', 'Biology', 'Cybernetics', 'Genetics', 'Psionicology'],
  Seafarer: ['Ocean Ships', 'Personal', 'Sail', 'Submarine'],
  Stealth: [],
  Steward: [],
  Streetwise: [],
  Survival: [],
  Tactics: ['Military', 'Naval'],
  'Vacc Suit': [],
};

/** Returns true if the given skill has specialties. */
export function hasSpecialties(skill: string): boolean {
  return (SKILLS_REGISTRY[skill]?.length ?? 0) > 0;
}

/** Returns specialties for a skill, or empty array. */
export function getSpecialties(skill: string): string[] {
  return SKILLS_REGISTRY[skill] ?? [];
}
