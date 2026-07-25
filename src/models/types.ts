/** The six main Traveller characteristics. */
export type CharacteristicName = 'STR' | 'DEX' | 'END' | 'INT' | 'EDU' | 'SOC';

export interface Characteristics {
  STR: number;
  DEX: number;
  END: number;
  INT: number;
  EDU: number;
  SOC: number;
}

export type Species = 'human' | 'aslan' | 'vargr';

export type ContactType = 'ally' | 'contact' | 'enemy' | 'rival';

export interface ContactHistoryEntry {
  term: number;
  description: string;
  previousType?: ContactType;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  description: string;
  history: ContactHistoryEntry[];
}

export interface CareerTerm {
  term: number;
  career: string;
  assignment?: string;
  rank: number;
  rankTitle: string;
  commissioned: boolean;
  events: string[];
  survived: boolean;
  advanced: boolean;
}

export type TimelineEntryType =
  | 'career_start'
  | 'event'
  | 'mishap'
  | 'promotion'
  | 'commission'
  | 'skill_gain'
  | 'characteristic_change'
  | 'contact_gained'
  | 'muster_out'
  | 'education'
  | 'narrative';

export interface TimelineEntry {
  term: number;
  age: number;
  type: TimelineEntryType;
  description: string;
  mechanicalDetails?: string;
  narrativeNote?: string;
}

export interface Character {
  name: string;
  species: Species;
  homeworld: string;
  backgroundNotes: string;
  characteristics: Characteristics;
  skills: Record<string, number>;
  specialties: Record<string, number>;
  age: number;
  currentTerm: number;
  careers: CareerTerm[];
  contacts: Contact[];
  cash: number;
  benefits: string[];
  benefitDMs: number;
  pensionPerYear: number;
  timeline: TimelineEntry[];
}

/** Creates a blank Character with default values. */
export function createBlankCharacter(): Character {
  return {
    name: '',
    species: 'human',
    homeworld: '',
    backgroundNotes: '',
    characteristics: { STR: 0, DEX: 0, END: 0, INT: 0, EDU: 0, SOC: 0 },
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
}
