import type {
  CareerTerm,
  Character,
  Characteristics,
  CharacteristicName,
  ContactType,
  Species,
  TimelineEntry,
} from '../models/types';

export type CharacterAction =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_SPECIES'; species: Species }
  | { type: 'SET_HOMEWORLD'; homeworld: string }
  | { type: 'SET_CHARACTERISTIC'; characteristic: CharacteristicName; value: number }
  | { type: 'SET_ALL_CHARACTERISTICS'; characteristics: Characteristics }
  | { type: 'MOD_CHARACTERISTIC'; characteristic: CharacteristicName; value: number }
  | {
      type: 'ENSURE_CHARACTERISTIC';
      characteristic: CharacteristicName;
      minimum: number;
      fallbackMod: number;
    }
  | { type: 'GAIN_SKILL'; skill: string; level?: number }
  | { type: 'INCREASE_SKILL'; skill: string }
  | { type: 'GAIN_SPECIALTY'; skill: string; specialty: string; level?: number }
  | { type: 'GAIN_CONTACT'; contactType: ContactType; name: string; description: string }
  | { type: 'ADD_CASH'; amount: number }
  | { type: 'ADD_BENEFIT'; benefit: string }
  | { type: 'MOD_BENEFIT_DM'; value: number }
  | { type: 'ADD_EQUIPMENT'; item: string }
  | { type: 'INCREMENT_AGE'; years: number }
  | { type: 'INCREMENT_TERM' }
  | { type: 'ADD_CAREER_TERM'; careerTerm: CareerTerm }
  | { type: 'ADD_TIMELINE_ENTRY'; entry: TimelineEntry }
  | { type: 'SET_BACKGROUND_NOTES'; notes: string }
  | { type: 'SET_PENSION'; amount: number };

export function characterReducer(state: Character, action: CharacterAction): Character {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.name };

    case 'SET_SPECIES':
      return { ...state, species: action.species };

    case 'SET_HOMEWORLD':
      return { ...state, homeworld: action.homeworld };

    case 'SET_CHARACTERISTIC':
      return {
        ...state,
        characteristics: {
          ...state.characteristics,
          [action.characteristic]: action.value,
        },
      };

    case 'SET_ALL_CHARACTERISTICS':
      return { ...state, characteristics: { ...action.characteristics } };

    case 'MOD_CHARACTERISTIC': {
      const current = state.characteristics[action.characteristic];
      return {
        ...state,
        characteristics: {
          ...state.characteristics,
          [action.characteristic]: Math.max(0, current + action.value),
        },
      };
    }

    case 'ENSURE_CHARACTERISTIC': {
      const current = state.characteristics[action.characteristic];
      const newValue = current < action.minimum
        ? action.minimum
        : current + action.fallbackMod;
      return {
        ...state,
        characteristics: {
          ...state.characteristics,
          [action.characteristic]: newValue,
        },
      };
    }

    case 'GAIN_SKILL': {
      const level = action.level ?? 0;
      const existing = state.skills[action.skill] ?? -1;
      if (level <= existing) {
        return state;
      }

      return {
        ...state,
        skills: { ...state.skills, [action.skill]: level },
      };
    }

    case 'INCREASE_SKILL': {
      const existing = state.skills[action.skill] ?? 0;
      return {
        ...state,
        skills: { ...state.skills, [action.skill]: existing + 1 },
      };
    }

    case 'GAIN_SPECIALTY': {
      const level = action.level ?? 1;
      const key = `${action.skill}:${action.specialty}`;
      const existingSpecialty = state.specialties[key] ?? 0;
      const existingSkill = state.skills[action.skill] ?? -1;

      return {
        ...state,
        skills:
          existingSkill < 0
            ? { ...state.skills, [action.skill]: 0 }
            : state.skills,
        specialties: {
          ...state.specialties,
          [key]: Math.max(existingSpecialty, level),
        },
      };
    }

    case 'GAIN_CONTACT': {
      const id = `contact-${state.contacts.length + 1}`;
      const newContact = {
        id,
        name: action.name,
        type: action.contactType,
        description: action.description,
        history: [{ term: state.currentTerm, description: action.description }],
      };

      return { ...state, contacts: [...state.contacts, newContact] };
    }

    case 'ADD_CASH':
      return { ...state, cash: state.cash + action.amount };

    case 'ADD_BENEFIT':
      return { ...state, benefits: [...state.benefits, action.benefit] };

    case 'MOD_BENEFIT_DM':
      return { ...state, benefitDMs: state.benefitDMs + action.value };

    case 'ADD_EQUIPMENT':
      return { ...state, benefits: [...state.benefits, action.item] };

    case 'INCREMENT_AGE':
      return { ...state, age: state.age + action.years };

    case 'INCREMENT_TERM':
      return { ...state, currentTerm: state.currentTerm + 1 };

    case 'ADD_CAREER_TERM':
      return { ...state, careers: [...state.careers, action.careerTerm] };

    case 'ADD_TIMELINE_ENTRY':
      return { ...state, timeline: [...state.timeline, action.entry] };

    case 'SET_BACKGROUND_NOTES':
      return { ...state, backgroundNotes: action.notes };

    case 'SET_PENSION':
      return { ...state, pensionPerYear: action.amount };

    default:
      return state;
  }
}
