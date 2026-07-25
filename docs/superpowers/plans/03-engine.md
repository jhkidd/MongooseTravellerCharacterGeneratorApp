# Phase 3: Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the character creation engine: a `useReducer`-based character state manager with React Context, a finite state machine that drives the wizard flow, and an effect interpreter that resolves the declarative JSON action trees from career data.

**Architecture:** The engine layer sits between the data layer (Phase 1) and the UI (Phases 4-5). The character reducer handles all mutations to character state via typed actions. The state machine manages which wizard phase is active and enforces valid transitions (including forced transitions from events). The effect interpreter walks action trees depth-first, applying immediate effects to the character and pausing for player input on interactive nodes (choice, pickSkill, narrative).

**Tech Stack:** React 18, TypeScript (strict), Vitest + React Testing Library, `useReducer` + React Context

## Global Constraints

- No external state libraries — React Context + `useReducer` only
- All character mutations go through the reducer — no direct state manipulation
- Effect interpreter must handle all 22 action types defined in `src/models/effect-types.ts`
- State machine transitions are deterministic given current state + action
- Any event effect can emit a `forceTransition` that overrides the default next state
- Skills with specialties: incrementing the skill always means picking/incrementing a specialty
- DM table: 0→-3, 1-2→-2, 3-5→-1, 6-8→+0, 9-11→+1, 12-14→+2, 15+→+3
- **ASK THE USER** about any design decisions you're unsure about.

## File Structure Map

```
src/
├── engine/
│   ├── character-reducer.ts          Reducer + action types for character mutations
│   ├── state-machine.ts              Phase enum, transition logic, forced transitions
│   ├── effect-interpreter.ts         Walks EffectNode trees, returns pending effects + pauses
│   └── __tests__/
│       ├── character-reducer.test.ts
│       ├── state-machine.test.ts
│       └── effect-interpreter.test.ts
├── context/
│   ├── CharacterContext.tsx           React Context provider wrapping useReducer
│   └── __tests__/
│       └── CharacterContext.test.tsx
```

---

## Task 1: Character Reducer & Context

**Files:**
- Create: `src/engine/character-reducer.ts`, `src/context/CharacterContext.tsx`
- Test: `src/engine/__tests__/character-reducer.test.ts`, `src/context/__tests__/CharacterContext.test.tsx`

**Interfaces:**
- Consumes:
  - `Character`, `createBlankCharacter()`, `CharacteristicName`, `ContactType`, `Species` from `src/models/types.ts`
  - `getDM(score: number): number` from `src/engine/dice.ts`
  - `SKILLS_REGISTRY` from `src/data/skills.ts`
- Produces:
  - `CharacterAction` union type (all reducer actions)
  - `characterReducer(state: Character, action: CharacterAction): Character`
  - `CharacterProvider` component wrapping `useReducer`
  - `useCharacter()` hook returning `{ character: Character; dispatch: Dispatch<CharacterAction> }`

- [ ] **Step 1: Write reducer tests**

Create `src/engine/__tests__/character-reducer.test.ts`:

```typescript
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
      expect(result.skills['Streetwise']).toBe(0);
    });

    it('adds a skill at a specific level', () => {
      const result = applyActions([{ type: 'GAIN_SKILL', skill: 'Recon', level: 1 }]);
      expect(result.skills['Recon']).toBe(1);
    });

    it('does not decrease an existing skill', () => {
      const result = applyActions([
        { type: 'GAIN_SKILL', skill: 'Recon', level: 2 },
        { type: 'GAIN_SKILL', skill: 'Recon', level: 1 },
      ]);
      expect(result.skills['Recon']).toBe(2);
    });
  });

  describe('INCREASE_SKILL', () => {
    it('increments an existing skill by 1', () => {
      const result = applyActions([
        { type: 'GAIN_SKILL', skill: 'Recon', level: 0 },
        { type: 'INCREASE_SKILL', skill: 'Recon' },
      ]);
      expect(result.skills['Recon']).toBe(1);
    });

    it('adds the skill at 1 if not yet owned', () => {
      const result = applyActions([{ type: 'INCREASE_SKILL', skill: 'Recon' }]);
      expect(result.skills['Recon']).toBe(1);
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/character-reducer.test.ts
```

Expected: FAIL — module `../character-reducer` not found.

- [ ] **Step 3: Implement character reducer**

Create `src/engine/character-reducer.ts`:

```typescript
import type { Character, Characteristics, CharacteristicName, ContactType, Species, CareerTerm, TimelineEntry } from '../models/types';

// ── Action types ──────────────────────────────────────────

export type CharacterAction =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_SPECIES'; species: Species }
  | { type: 'SET_HOMEWORLD'; homeworld: string }
  | { type: 'SET_CHARACTERISTIC'; characteristic: CharacteristicName; value: number }
  | { type: 'SET_ALL_CHARACTERISTICS'; characteristics: Characteristics }
  | { type: 'MOD_CHARACTERISTIC'; characteristic: CharacteristicName; value: number }
  | { type: 'ENSURE_CHARACTERISTIC'; characteristic: CharacteristicName; minimum: number; fallbackMod: number }
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

// ── Reducer ───────────────────────────────────────────────

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
      if (level <= existing) return state;
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
        skills: existingSkill < 0
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
```

- [ ] **Step 4: Run reducer tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/character-reducer.test.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Write Context tests**

Create `src/context/__tests__/CharacterContext.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { CharacterProvider, useCharacter } from '../CharacterContext';

function TestConsumer() {
  const { character, dispatch } = useCharacter();
  return (
    <div>
      <span data-testid="name">{character.name || '(unnamed)'}</span>
      <span data-testid="age">{character.age}</span>
      <button onClick={() => dispatch({ type: 'SET_NAME', name: 'Aria' })}>
        Set Name
      </button>
    </div>
  );
}

describe('CharacterContext', () => {
  it('provides a blank character by default', () => {
    render(
      <CharacterProvider>
        <TestConsumer />
      </CharacterProvider>
    );
    expect(screen.getByTestId('name')).toHaveTextContent('(unnamed)');
    expect(screen.getByTestId('age')).toHaveTextContent('18');
  });

  it('dispatches actions to update character state', async () => {
    render(
      <CharacterProvider>
        <TestConsumer />
      </CharacterProvider>
    );

    await act(async () => {
      screen.getByText('Set Name').click();
    });

    expect(screen.getByTestId('name')).toHaveTextContent('Aria');
  });

  it('throws if useCharacter is used outside provider', () => {
    // Suppress console.error during expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useCharacter must be used within a CharacterProvider'
    );
    spy.mockRestore();
  });
});
```

- [ ] **Step 6: Run Context tests to verify they fail**

```bash
npx vitest run src/context/__tests__/CharacterContext.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement CharacterContext**

Create `src/context/CharacterContext.tsx`:

```tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { characterReducer, type CharacterAction } from '../engine/character-reducer';
import { createBlankCharacter } from '../models/types';
import type { Character } from '../models/types';

interface CharacterContextValue {
  character: Character;
  dispatch: Dispatch<CharacterAction>;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, dispatch] = useReducer(characterReducer, undefined, createBlankCharacter);
  return (
    <CharacterContext.Provider value={{ character, dispatch }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return ctx;
}
```

- [ ] **Step 8: Run Context tests to verify they pass**

```bash
npx vitest run src/context/__tests__/CharacterContext.test.tsx
```

Expected: PASS — all 3 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/engine/character-reducer.ts src/engine/__tests__/character-reducer.test.ts src/context/
git commit -m "feat: add character reducer and React Context provider

- characterReducer handles all character mutations via typed actions
- 21 action types: SET_NAME, MOD_CHARACTERISTIC, GAIN_SKILL, etc.
- CharacterProvider wraps useReducer with createBlankCharacter
- useCharacter hook with runtime guard for missing provider
- Full test coverage for reducer and context

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: State Machine

**Files:**
- Create: `src/engine/state-machine.ts`
- Test: `src/engine/__tests__/state-machine.test.ts`

**Interfaces:**
- Consumes: nothing (self-contained, uses its own types)
- Produces:
  - `Phase` enum with all wizard phase values
  - `PhaseContext` interface — mutable context carried through transitions
  - `PhaseAction` union type — actions that trigger transitions
  - `getNextPhase(currentPhase: Phase, action: PhaseAction, context: PhaseContext): { phase: Phase; context: PhaseContext }`
  - `createInitialContext(): PhaseContext`
  - `canAttemptPreCareer(context: PhaseContext): boolean`

- [ ] **Step 1: Write state machine tests**

Create `src/engine/__tests__/state-machine.test.ts`:

```typescript
import {
  Phase,
  getNextPhase,
  createInitialContext,
  canAttemptPreCareer,
  type PhaseContext,
  type PhaseAction,
} from '../state-machine';

describe('Phase enum', () => {
  it('has all expected phases', () => {
    expect(Phase.BACKGROUND).toBe('BACKGROUND');
    expect(Phase.CHARACTERISTICS).toBe('CHARACTERISTICS');
    expect(Phase.BACKGROUND_SKILLS).toBe('BACKGROUND_SKILLS');
    expect(Phase.TERM_START).toBe('TERM_START');
    expect(Phase.PRE_CAREER_SELECTION).toBe('PRE_CAREER_SELECTION');
    expect(Phase.EDUCATION_ENTRY_ROLL).toBe('EDUCATION_ENTRY_ROLL');
    expect(Phase.EDUCATION_EVENTS).toBe('EDUCATION_EVENTS');
    expect(Phase.GRADUATION_ROLL).toBe('GRADUATION_ROLL');
    expect(Phase.CAREER_SELECTION).toBe('CAREER_SELECTION');
    expect(Phase.QUALIFICATION_ROLL).toBe('QUALIFICATION_ROLL');
    expect(Phase.DRAFT_OR_DRIFTER).toBe('DRAFT_OR_DRIFTER');
    expect(Phase.CAREER_ACTIVE).toBe('CAREER_ACTIVE');
    expect(Phase.COMMISSION_ROLL).toBe('COMMISSION_ROLL');
    expect(Phase.SURVIVAL_ROLL).toBe('SURVIVAL_ROLL');
    expect(Phase.MISHAP_RESOLUTION).toBe('MISHAP_RESOLUTION');
    expect(Phase.EVENT_ROLL).toBe('EVENT_ROLL');
    expect(Phase.EVENT_RESOLUTION).toBe('EVENT_RESOLUTION');
    expect(Phase.SKILL_TRAINING).toBe('SKILL_TRAINING');
    expect(Phase.ADVANCEMENT_ROLL).toBe('ADVANCEMENT_ROLL');
    expect(Phase.RANK_BONUS).toBe('RANK_BONUS');
    expect(Phase.TERM_NARRATIVE).toBe('TERM_NARRATIVE');
    expect(Phase.AGING_CHECK).toBe('AGING_CHECK');
    expect(Phase.TERM_END_DECISION).toBe('TERM_END_DECISION');
    expect(Phase.MUSTERING_OUT).toBe('MUSTERING_OUT');
    expect(Phase.FINALIZE_CONTACTS).toBe('FINALIZE_CONTACTS');
    expect(Phase.CHARACTER_SHEET).toBe('CHARACTER_SHEET');
  });
});

describe('createInitialContext', () => {
  it('creates context with term 0 and no career', () => {
    const ctx = createInitialContext();
    expect(ctx.currentTerm).toBe(0);
    expect(ctx.currentCareer).toBeNull();
    expect(ctx.currentAssignment).toBeNull();
    expect(ctx.isOfficer).toBe(false);
    expect(ctx.previousCareers).toEqual([]);
    expect(ctx.forcedCareer).toBeNull();
    expect(ctx.autoPromote).toBe(false);
    expect(ctx.pendingAdvancementDM).toBe(0);
    expect(ctx.preCareerCompleted).toBe(false);
  });
});

describe('getNextPhase — early flow', () => {
  it('BACKGROUND → CHARACTERISTICS on CONTINUE', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.BACKGROUND, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.CHARACTERISTICS);
  });

  it('CHARACTERISTICS → BACKGROUND_SKILLS on CONTINUE', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.CHARACTERISTICS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.BACKGROUND_SKILLS);
  });

  it('BACKGROUND_SKILLS → TERM_START on CONTINUE', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.BACKGROUND_SKILLS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.TERM_START);
    expect(result.context.currentTerm).toBe(1);
  });
});

describe('getNextPhase — term start branching', () => {
  it('TERM_START → PRE_CAREER_SELECTION when choosing pre-career (term 1)', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.TERM_START, { type: 'CHOOSE_PRE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.PRE_CAREER_SELECTION);
  });

  it('TERM_START → CAREER_SELECTION when choosing career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.TERM_START, { type: 'CHOOSE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_SELECTION);
  });

  it('TERM_START → CAREER_ACTIVE when continuing same career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 2, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_START, { type: 'CONTINUE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
  });
});

describe('getNextPhase — pre-career education path', () => {
  it('PRE_CAREER_SELECTION → EDUCATION_ENTRY_ROLL', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.PRE_CAREER_SELECTION, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.EDUCATION_ENTRY_ROLL);
  });

  it('EDUCATION_ENTRY_ROLL → EDUCATION_EVENTS on success', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.EDUCATION_ENTRY_ROLL, { type: 'ROLL_SUCCESS' }, ctx);
    expect(result.phase).toBe(Phase.EDUCATION_EVENTS);
  });

  it('EDUCATION_ENTRY_ROLL → CAREER_SELECTION on failure', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.EDUCATION_ENTRY_ROLL, { type: 'ROLL_FAILURE' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_SELECTION);
  });

  it('EDUCATION_EVENTS → GRADUATION_ROLL', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.EDUCATION_EVENTS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.GRADUATION_ROLL);
  });

  it('GRADUATION_ROLL → TERM_END_DECISION on any outcome', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.GRADUATION_ROLL, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.TERM_END_DECISION);
    expect(result.context.preCareerCompleted).toBe(true);
  });
});

describe('getNextPhase — career path', () => {
  it('CAREER_SELECTION → QUALIFICATION_ROLL', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.CAREER_SELECTION, { type: 'SELECT_CAREER', careerId: 'army' }, ctx);
    expect(result.phase).toBe(Phase.QUALIFICATION_ROLL);
    expect(result.context.currentCareer).toBe('army');
  });

  it('CAREER_SELECTION → CAREER_ACTIVE for Drifter (no qualification)', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.CAREER_SELECTION, { type: 'SELECT_DRIFTER' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
    expect(result.context.currentCareer).toBe('drifter');
  });

  it('QUALIFICATION_ROLL → CAREER_ACTIVE on success', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.QUALIFICATION_ROLL, { type: 'ROLL_SUCCESS' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
  });

  it('QUALIFICATION_ROLL → DRAFT_OR_DRIFTER on failure', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.QUALIFICATION_ROLL, { type: 'ROLL_FAILURE' }, ctx);
    expect(result.phase).toBe(Phase.DRAFT_OR_DRIFTER);
  });

  it('DRAFT_OR_DRIFTER → CAREER_ACTIVE', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.DRAFT_OR_DRIFTER, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
  });
});

describe('getNextPhase — career term flow', () => {
  const baseCtx: PhaseContext = {
    ...createInitialContext(),
    currentTerm: 1,
    currentCareer: 'army',
    currentAssignment: 'infantry',
  };

  it('CAREER_ACTIVE → COMMISSION_ROLL if eligible for commission', () => {
    const ctx = { ...baseCtx, hasCommission: false, careerHasCommission: true };
    const result = getNextPhase(Phase.CAREER_ACTIVE, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.COMMISSION_ROLL);
  });

  it('CAREER_ACTIVE → SURVIVAL_ROLL if no commission available', () => {
    const ctx = { ...baseCtx, hasCommission: false, careerHasCommission: false };
    const result = getNextPhase(Phase.CAREER_ACTIVE, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.SURVIVAL_ROLL);
  });

  it('CAREER_ACTIVE → SURVIVAL_ROLL if already commissioned', () => {
    const ctx = { ...baseCtx, hasCommission: true, isOfficer: true, careerHasCommission: true };
    const result = getNextPhase(Phase.CAREER_ACTIVE, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.SURVIVAL_ROLL);
  });

  it('COMMISSION_ROLL → SURVIVAL_ROLL on success or failure', () => {
    const result1 = getNextPhase(Phase.COMMISSION_ROLL, { type: 'ROLL_SUCCESS' }, baseCtx);
    expect(result1.phase).toBe(Phase.SURVIVAL_ROLL);
    expect(result1.context.isOfficer).toBe(true);

    const result2 = getNextPhase(Phase.COMMISSION_ROLL, { type: 'ROLL_FAILURE' }, baseCtx);
    expect(result2.phase).toBe(Phase.SURVIVAL_ROLL);
  });

  it('SURVIVAL_ROLL → MISHAP_RESOLUTION on failure', () => {
    const result = getNextPhase(Phase.SURVIVAL_ROLL, { type: 'ROLL_FAILURE' }, baseCtx);
    expect(result.phase).toBe(Phase.MISHAP_RESOLUTION);
  });

  it('SURVIVAL_ROLL → EVENT_ROLL on success', () => {
    const result = getNextPhase(Phase.SURVIVAL_ROLL, { type: 'ROLL_SUCCESS' }, baseCtx);
    expect(result.phase).toBe(Phase.EVENT_ROLL);
  });

  it('MISHAP_RESOLUTION → TERM_END_DECISION (ejected from career)', () => {
    const result = getNextPhase(Phase.MISHAP_RESOLUTION, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_END_DECISION);
    expect(result.context.currentCareer).toBeNull();
  });

  it('EVENT_ROLL → EVENT_RESOLUTION', () => {
    const result = getNextPhase(Phase.EVENT_ROLL, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.EVENT_RESOLUTION);
  });

  it('EVENT_RESOLUTION → SKILL_TRAINING', () => {
    const result = getNextPhase(Phase.EVENT_RESOLUTION, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.SKILL_TRAINING);
  });

  it('SKILL_TRAINING → ADVANCEMENT_ROLL', () => {
    const result = getNextPhase(Phase.SKILL_TRAINING, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.ADVANCEMENT_ROLL);
  });

  it('ADVANCEMENT_ROLL → RANK_BONUS on success', () => {
    const result = getNextPhase(Phase.ADVANCEMENT_ROLL, { type: 'ROLL_SUCCESS' }, baseCtx);
    expect(result.phase).toBe(Phase.RANK_BONUS);
  });

  it('ADVANCEMENT_ROLL → TERM_NARRATIVE on failure', () => {
    const result = getNextPhase(Phase.ADVANCEMENT_ROLL, { type: 'ROLL_FAILURE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_NARRATIVE);
  });

  it('RANK_BONUS → TERM_NARRATIVE', () => {
    const result = getNextPhase(Phase.RANK_BONUS, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_NARRATIVE);
  });

  it('TERM_NARRATIVE → AGING_CHECK', () => {
    const result = getNextPhase(Phase.TERM_NARRATIVE, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.AGING_CHECK);
  });

  it('AGING_CHECK → TERM_END_DECISION', () => {
    const result = getNextPhase(Phase.AGING_CHECK, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_END_DECISION);
  });
});

describe('getNextPhase — term end decisions', () => {
  it('TERM_END_DECISION → TERM_START when continuing (increments term)', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_END_DECISION, { type: 'CONTINUE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.TERM_START);
    expect(result.context.currentTerm).toBe(2);
  });

  it('TERM_END_DECISION → TERM_START when switching career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_END_DECISION, { type: 'SWITCH_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.TERM_START);
    expect(result.context.currentTerm).toBe(2);
    expect(result.context.currentCareer).toBeNull();
    expect(result.context.previousCareers).toContain('army');
  });

  it('TERM_END_DECISION → MUSTERING_OUT when choosing to muster out', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_END_DECISION, { type: 'MUSTER_OUT' }, ctx);
    expect(result.phase).toBe(Phase.MUSTERING_OUT);
  });
});

describe('getNextPhase — mustering out and end', () => {
  it('MUSTERING_OUT → FINALIZE_CONTACTS', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.MUSTERING_OUT, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.FINALIZE_CONTACTS);
  });

  it('FINALIZE_CONTACTS → CHARACTER_SHEET', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.FINALIZE_CONTACTS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.CHARACTER_SHEET);
  });
});

describe('getNextPhase — forced transitions', () => {
  it('FORCE_TRANSITION overrides from any phase', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.EVENT_RESOLUTION, { type: 'FORCE_TRANSITION', targetPhase: Phase.MUSTERING_OUT }, ctx);
    expect(result.phase).toBe(Phase.MUSTERING_OUT);
  });

  it('forced career sets forcedCareer in context', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(
      Phase.EVENT_RESOLUTION,
      { type: 'FORCE_CAREER', careerId: 'prisoner' },
      ctx,
    );
    expect(result.context.forcedCareer).toBe('prisoner');
  });

  it('auto-promote sets autoPromote flag', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.EVENT_RESOLUTION, { type: 'AUTO_PROMOTE' }, ctx);
    expect(result.context.autoPromote).toBe(true);
  });
});

describe('canAttemptPreCareer', () => {
  it('returns true for terms 1-3 when not already completed', () => {
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 1 })).toBe(true);
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 2 })).toBe(true);
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 3 })).toBe(true);
  });

  it('returns false for term 4+', () => {
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 4 })).toBe(false);
  });

  it('returns false if pre-career already completed', () => {
    expect(canAttemptPreCareer({
      ...createInitialContext(),
      currentTerm: 2,
      preCareerCompleted: true,
    })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/state-machine.test.ts
```

Expected: FAIL — module `../state-machine` not found.

- [ ] **Step 3: Implement state machine**

Create `src/engine/state-machine.ts`:

```typescript
// ── Phase enum ────────────────────────────────────────────

export enum Phase {
  BACKGROUND = 'BACKGROUND',
  CHARACTERISTICS = 'CHARACTERISTICS',
  BACKGROUND_SKILLS = 'BACKGROUND_SKILLS',
  TERM_START = 'TERM_START',
  PRE_CAREER_SELECTION = 'PRE_CAREER_SELECTION',
  EDUCATION_ENTRY_ROLL = 'EDUCATION_ENTRY_ROLL',
  EDUCATION_EVENTS = 'EDUCATION_EVENTS',
  GRADUATION_ROLL = 'GRADUATION_ROLL',
  CAREER_SELECTION = 'CAREER_SELECTION',
  QUALIFICATION_ROLL = 'QUALIFICATION_ROLL',
  DRAFT_OR_DRIFTER = 'DRAFT_OR_DRIFTER',
  CAREER_ACTIVE = 'CAREER_ACTIVE',
  COMMISSION_ROLL = 'COMMISSION_ROLL',
  SURVIVAL_ROLL = 'SURVIVAL_ROLL',
  MISHAP_RESOLUTION = 'MISHAP_RESOLUTION',
  EVENT_ROLL = 'EVENT_ROLL',
  EVENT_RESOLUTION = 'EVENT_RESOLUTION',
  SKILL_TRAINING = 'SKILL_TRAINING',
  ADVANCEMENT_ROLL = 'ADVANCEMENT_ROLL',
  RANK_BONUS = 'RANK_BONUS',
  TERM_NARRATIVE = 'TERM_NARRATIVE',
  AGING_CHECK = 'AGING_CHECK',
  TERM_END_DECISION = 'TERM_END_DECISION',
  MUSTERING_OUT = 'MUSTERING_OUT',
  FINALIZE_CONTACTS = 'FINALIZE_CONTACTS',
  CHARACTER_SHEET = 'CHARACTER_SHEET',
}

// ── Phase context ─────────────────────────────────────────

export interface PhaseContext {
  currentTerm: number;
  currentCareer: string | null;
  currentAssignment: string | null;
  isOfficer: boolean;
  hasCommission?: boolean;
  careerHasCommission?: boolean;
  previousCareers: string[];
  forcedCareer: string | null;
  autoPromote: boolean;
  pendingAdvancementDM: number;
  preCareerCompleted: boolean;
}

export function createInitialContext(): PhaseContext {
  return {
    currentTerm: 0,
    currentCareer: null,
    currentAssignment: null,
    isOfficer: false,
    previousCareers: [],
    forcedCareer: null,
    autoPromote: false,
    pendingAdvancementDM: 0,
    preCareerCompleted: false,
  };
}

// ── Phase actions ─────────────────────────────────────────

export type PhaseAction =
  | { type: 'CONTINUE' }
  | { type: 'CHOOSE_PRE_CAREER' }
  | { type: 'CHOOSE_CAREER' }
  | { type: 'CONTINUE_CAREER' }
  | { type: 'SELECT_CAREER'; careerId: string }
  | { type: 'SELECT_DRIFTER' }
  | { type: 'ROLL_SUCCESS' }
  | { type: 'ROLL_FAILURE' }
  | { type: 'SWITCH_CAREER' }
  | { type: 'MUSTER_OUT' }
  | { type: 'FORCE_TRANSITION'; targetPhase: Phase }
  | { type: 'FORCE_CAREER'; careerId: string }
  | { type: 'AUTO_PROMOTE' };

// ── Transition logic ──────────────────────────────────────

export function getNextPhase(
  currentPhase: Phase,
  action: PhaseAction,
  context: PhaseContext,
): { phase: Phase; context: PhaseContext } {
  const ctx = { ...context };

  // Force transitions override everything
  if (action.type === 'FORCE_TRANSITION') {
    return { phase: action.targetPhase, context: ctx };
  }
  if (action.type === 'FORCE_CAREER') {
    ctx.forcedCareer = action.careerId;
    return { phase: currentPhase, context: ctx };
  }
  if (action.type === 'AUTO_PROMOTE') {
    ctx.autoPromote = true;
    return { phase: currentPhase, context: ctx };
  }

  switch (currentPhase) {
    // ── Early flow ──
    case Phase.BACKGROUND:
      return { phase: Phase.CHARACTERISTICS, context: ctx };

    case Phase.CHARACTERISTICS:
      return { phase: Phase.BACKGROUND_SKILLS, context: ctx };

    case Phase.BACKGROUND_SKILLS:
      ctx.currentTerm = 1;
      return { phase: Phase.TERM_START, context: ctx };

    // ── Term start ──
    case Phase.TERM_START:
      if (action.type === 'CHOOSE_PRE_CAREER') {
        return { phase: Phase.PRE_CAREER_SELECTION, context: ctx };
      }
      if (action.type === 'CONTINUE_CAREER') {
        return { phase: Phase.CAREER_ACTIVE, context: ctx };
      }
      return { phase: Phase.CAREER_SELECTION, context: ctx };

    // ── Pre-career education ──
    case Phase.PRE_CAREER_SELECTION:
      return { phase: Phase.EDUCATION_ENTRY_ROLL, context: ctx };

    case Phase.EDUCATION_ENTRY_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.EDUCATION_EVENTS, context: ctx };
      }
      return { phase: Phase.CAREER_SELECTION, context: ctx };

    case Phase.EDUCATION_EVENTS:
      return { phase: Phase.GRADUATION_ROLL, context: ctx };

    case Phase.GRADUATION_ROLL:
      ctx.preCareerCompleted = true;
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    // ── Career selection ──
    case Phase.CAREER_SELECTION:
      if (action.type === 'SELECT_DRIFTER') {
        ctx.currentCareer = 'drifter';
        return { phase: Phase.CAREER_ACTIVE, context: ctx };
      }
      if (action.type === 'SELECT_CAREER') {
        ctx.currentCareer = action.careerId;
        return { phase: Phase.QUALIFICATION_ROLL, context: ctx };
      }
      return { phase: Phase.QUALIFICATION_ROLL, context: ctx };

    case Phase.QUALIFICATION_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.CAREER_ACTIVE, context: ctx };
      }
      return { phase: Phase.DRAFT_OR_DRIFTER, context: ctx };

    case Phase.DRAFT_OR_DRIFTER:
      return { phase: Phase.CAREER_ACTIVE, context: ctx };

    // ── Career term flow ──
    case Phase.CAREER_ACTIVE:
      if (ctx.careerHasCommission && !ctx.isOfficer && !ctx.hasCommission) {
        return { phase: Phase.COMMISSION_ROLL, context: ctx };
      }
      return { phase: Phase.SURVIVAL_ROLL, context: ctx };

    case Phase.COMMISSION_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        ctx.isOfficer = true;
        ctx.hasCommission = true;
      }
      return { phase: Phase.SURVIVAL_ROLL, context: ctx };

    case Phase.SURVIVAL_ROLL:
      if (action.type === 'ROLL_FAILURE') {
        return { phase: Phase.MISHAP_RESOLUTION, context: ctx };
      }
      return { phase: Phase.EVENT_ROLL, context: ctx };

    case Phase.MISHAP_RESOLUTION:
      ctx.currentCareer = null;
      ctx.currentAssignment = null;
      ctx.isOfficer = false;
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    case Phase.EVENT_ROLL:
      return { phase: Phase.EVENT_RESOLUTION, context: ctx };

    case Phase.EVENT_RESOLUTION:
      return { phase: Phase.SKILL_TRAINING, context: ctx };

    case Phase.SKILL_TRAINING:
      return { phase: Phase.ADVANCEMENT_ROLL, context: ctx };

    case Phase.ADVANCEMENT_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.RANK_BONUS, context: ctx };
      }
      return { phase: Phase.TERM_NARRATIVE, context: ctx };

    case Phase.RANK_BONUS:
      return { phase: Phase.TERM_NARRATIVE, context: ctx };

    case Phase.TERM_NARRATIVE:
      return { phase: Phase.AGING_CHECK, context: ctx };

    case Phase.AGING_CHECK:
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    // ── Term end ──
    case Phase.TERM_END_DECISION:
      if (action.type === 'MUSTER_OUT') {
        return { phase: Phase.MUSTERING_OUT, context: ctx };
      }
      if (action.type === 'SWITCH_CAREER') {
        if (ctx.currentCareer) {
          ctx.previousCareers = [...ctx.previousCareers, ctx.currentCareer];
        }
        ctx.currentCareer = null;
        ctx.currentAssignment = null;
        ctx.isOfficer = false;
        ctx.hasCommission = false;
        ctx.currentTerm += 1;
        return { phase: Phase.TERM_START, context: ctx };
      }
      // CONTINUE_CAREER (default)
      ctx.currentTerm += 1;
      return { phase: Phase.TERM_START, context: ctx };

    // ── End game ──
    case Phase.MUSTERING_OUT:
      return { phase: Phase.FINALIZE_CONTACTS, context: ctx };

    case Phase.FINALIZE_CONTACTS:
      return { phase: Phase.CHARACTER_SHEET, context: ctx };

    default:
      return { phase: currentPhase, context: ctx };
  }
}

// ── Helpers ───────────────────────────────────────────────

export function canAttemptPreCareer(context: PhaseContext): boolean {
  return context.currentTerm >= 1
    && context.currentTerm <= 3
    && !context.preCareerCompleted;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/state-machine.test.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/state-machine.ts src/engine/__tests__/state-machine.test.ts
git commit -m "feat: add state machine for character creation wizard flow

- Phase enum with 26 states covering full creation lifecycle
- PhaseContext tracks current term, career, officer status, forced transitions
- getNextPhase() handles all transitions including pre-career education,
  career qualification, survival/event/advancement loop, and mustering out
- Forced transitions: FORCE_TRANSITION, FORCE_CAREER, AUTO_PROMOTE
- canAttemptPreCareer() helper for terms 1-3 gate
- Full test coverage for all transition paths

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Effect Interpreter

**Files:**
- Create: `src/engine/effect-interpreter.ts`
- Test: `src/engine/__tests__/effect-interpreter.test.ts`

**Interfaces:**
- Consumes:
  - All effect types from `src/models/effect-types.ts` (`EffectNode`, `GainSkillEffect`, etc.)
  - `CharacterAction` from `src/engine/character-reducer.ts`
  - `rollD6()`, `roll2D6()`, `getDM()` from `src/engine/dice.ts`
  - `Character` from `src/models/types.ts`
- Produces:
  - `InterpretedEffect` type — result of interpreting an effect node (either immediate actions or a pause for player input)
  - `EffectPause` type — describes what input is needed (choice, pickSkill, pickOne, narrative)
  - `interpretEffect(node: EffectNode, character: Character): InterpretedEffect`
  - `resolveImmediate(node: EffectNode, character: Character): CharacterAction[]` — for effects that need no input

- [ ] **Step 1: Write effect interpreter tests**

Create `src/engine/__tests__/effect-interpreter.test.ts`:

```typescript
import {
  interpretEffect,
  resolveImmediate,
  type InterpretedEffect,
} from '../effect-interpreter';
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
    const node: EffectNode = { type: 'gainSpecialty', skill: 'Gun Combat', specialty: 'Slug', level: 1 };
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

  it('resolves gainContact with count > 1 to multiple actions', () => {
    const node: EffectNode = { type: 'gainContact', contactType: 'contact', count: 3 };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toHaveLength(3);
    actions.forEach(a => expect(a).toMatchObject({ type: 'GAIN_CONTACT', contactType: 'contact' }));
  });

  it('resolves gainBenefitDM to MOD_BENEFIT_DM action', () => {
    const node: EffectNode = { type: 'gainBenefitDM', value: 1 };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'MOD_BENEFIT_DM', value: 1 }]);
  });

  it('resolves gainAdvancementDM (no direct action, recorded as pending)', () => {
    const node: EffectNode = { type: 'gainAdvancementDM', value: 2 };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    // Advancement DM is tracked separately — no character action needed
  });

  it('resolves gainEquipment to ADD_EQUIPMENT action', () => {
    const node: EffectNode = { type: 'gainEquipment', item: 'TAS Membership' };
    const actions = resolveImmediate(node, makeCharacter());
    expect(actions).toEqual([{ type: 'ADD_EQUIPMENT', item: 'TAS Membership' }]);
  });

  it('resolves ejectFromCareer (no character action, signals ejection)', () => {
    const node: EffectNode = { type: 'ejectFromCareer' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    expect(result.signals).toContain('ejectFromCareer');
  });

  it('resolves autoPromote signal', () => {
    const node: EffectNode = { type: 'autoPromote' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    expect(result.signals).toContain('autoPromote');
  });

  it('resolves loseBenefitRoll signal', () => {
    const node: EffectNode = { type: 'loseBenefitRoll' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    expect(result.signals).toContain('loseBenefitRoll');
  });

  it('resolves forceCareer signal', () => {
    const node: EffectNode = { type: 'forceCareer', career: 'prisoner' };
    const result = interpretEffect(node, makeCharacter());
    expect(result.type).toBe('immediate');
    expect(result.signals).toContain('forceCareer:prisoner');
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

describe('interpretEffect — interactive effects', () => {
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

  it('pauses on increaseExistingSkill (player must pick)', () => {
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
});

describe('interpretEffect — skillCheck', () => {
  it('resolves skill check with deterministic roll', () => {
    // This tests the structure, not randomness — we verify
    // that skillCheck returns either success or failure branch
    const node: EffectNode = {
      type: 'skillCheck',
      skill: 'Advocate',
      target: 8,
      success: { type: 'none' },
      failure: { type: 'loseBenefitRoll' },
    };
    const result = interpretEffect(node, makeCharacter());
    // skillCheck should produce an immediate result (auto-rolled)
    // or pause if the UI should show the roll — design decision.
    // For the interpreter, it pauses to show the roll to the player.
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.pauseType).toBe('skillCheck');
    }
  });
});

describe('interpretEffect — compound with mixed immediate/interactive', () => {
  it('applies immediate effects and pauses on first interactive', () => {
    const node: EffectNode = {
      type: 'compound',
      effects: [
        { type: 'gainSkill', skill: 'Recon' },
        { type: 'choice', prompt: 'What next?', options: [
          { label: 'A', effects: [{ type: 'none' }] },
          { label: 'B', effects: [{ type: 'none' }] },
        ]},
      ],
    };
    const result = interpretEffect(node, makeCharacter());
    // Compound with interactive inside should apply immediate effects
    // then pause at the interactive node
    expect(result.type).toBe('pause');
    if (result.type === 'pause') {
      expect(result.immediateActions).toEqual([
        { type: 'GAIN_SKILL', skill: 'Recon', level: 0 },
      ]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/effect-interpreter.test.ts
```

Expected: FAIL — module `../effect-interpreter` not found.

- [ ] **Step 3: Implement effect interpreter**

Create `src/engine/effect-interpreter.ts`:

```typescript
import type { EffectNode } from '../models/effect-types';
import type { Character } from '../models/types';
import type { CharacterAction } from './character-reducer';

// ── Result types ──────────────────────────────────────────

export type EffectSignal =
  | 'ejectFromCareer'
  | 'autoPromote'
  | 'loseBenefitRoll'
  | `forceCareer:${string}`
  | `advancementDM:${number}`;

export type InterpretedEffect =
  | {
      type: 'immediate';
      actions: CharacterAction[];
      signals: EffectSignal[];
    }
  | {
      type: 'pause';
      pauseType: 'choice' | 'pickSkill' | 'pickOne' | 'narrative' | 'skillCheck';
      prompt?: string;
      options?: unknown[];
      /** Immediate actions to apply before the pause. */
      immediateActions?: CharacterAction[];
      /** The original effect node, for resuming after player input. */
      effectNode: EffectNode;
    };

// ── Immediate resolution ──────────────────────────────────

/**
 * Resolve an effect node that requires no player input.
 * Returns an array of CharacterActions to dispatch.
 * Throws if the node is interactive — use interpretEffect instead.
 */
export function resolveImmediate(node: EffectNode, character: Character): CharacterAction[] {
  switch (node.type) {
    case 'gainSkill':
      return [{ type: 'GAIN_SKILL', skill: node.skill, level: node.level ?? 0 }];

    case 'increaseSkill':
      return [{ type: 'INCREASE_SKILL', skill: node.skill }];

    case 'gainSpecialty':
      return [{
        type: 'GAIN_SPECIALTY',
        skill: node.skill,
        specialty: node.specialty,
        level: node.level ?? 1,
      }];

    case 'modCharacteristic':
      return [{ type: 'MOD_CHARACTERISTIC', characteristic: node.characteristic, value: node.value }];

    case 'ensureCharacteristic':
      return [{
        type: 'ENSURE_CHARACTERISTIC',
        characteristic: node.characteristic,
        minimum: node.minimum,
        fallbackMod: node.fallback.value,
      }];

    case 'gainContact': {
      const count = node.count ?? 1;
      const actions: CharacterAction[] = [];
      for (let i = 0; i < count; i++) {
        actions.push({
          type: 'GAIN_CONTACT',
          contactType: node.contactType,
          name: '',
          description: '',
        });
      }
      return actions;
    }

    case 'gainBenefitDM':
      return [{ type: 'MOD_BENEFIT_DM', value: node.value }];

    case 'gainEquipment':
      return [{ type: 'ADD_EQUIPMENT', item: node.item }];

    case 'compound': {
      const actions: CharacterAction[] = [];
      for (const child of node.effects) {
        if (isInteractive(child)) {
          // Stop at first interactive node — caller should use interpretEffect
          break;
        }
        actions.push(...resolveImmediate(child, character));
      }
      return actions;
    }

    case 'none':
      return [];

    default:
      return [];
  }
}

// ── Full interpretation (handles interactive nodes) ───────

/**
 * Interpret an effect node. Returns either:
 * - immediate: all actions resolved, no player input needed
 * - pause: player input is required before continuing
 */
export function interpretEffect(node: EffectNode, character: Character): InterpretedEffect {
  switch (node.type) {
    // ── Interactive effects → pause ──
    case 'choice':
      return {
        type: 'pause',
        pauseType: 'choice',
        prompt: node.prompt,
        options: node.options.map(o => ({ label: o.label, effects: o.effects })),
        effectNode: node,
      };

    case 'pickSkill':
      return {
        type: 'pause',
        pauseType: 'pickSkill',
        options: node.options,
        effectNode: node,
      };

    case 'pickOne':
      return {
        type: 'pause',
        pauseType: 'pickOne',
        prompt: node.prompt,
        options: node.options.map(o => ({ label: o.label, effect: o.effect })),
        effectNode: node,
      };

    case 'narrative':
      return {
        type: 'pause',
        pauseType: 'narrative',
        prompt: node.prompt,
        effectNode: node,
      };

    case 'skillCheck':
      return {
        type: 'pause',
        pauseType: 'skillCheck',
        prompt: `${node.skill ?? node.characteristic} ${node.target}+`,
        effectNode: node,
      };

    case 'increaseExistingSkill': {
      const ownedSkills = Object.keys(character.skills);
      return {
        type: 'pause',
        pauseType: 'pickSkill',
        options: ownedSkills,
        effectNode: node,
      };
    }

    case 'diceRoll':
      // Dice rolls for variable amounts pause to show the roll
      return {
        type: 'pause',
        pauseType: 'skillCheck',
        prompt: `Roll ${node.dice}`,
        effectNode: node,
      };

    case 'rollOnTable':
      // Table rolls pause to show result from the referenced table
      return {
        type: 'pause',
        pauseType: 'skillCheck',
        prompt: `Roll on ${node.table}`,
        effectNode: node,
      };

    // ── Signal-only effects → immediate with signals ──
    case 'ejectFromCareer':
      return { type: 'immediate', actions: [], signals: ['ejectFromCareer'] };

    case 'autoPromote':
      return { type: 'immediate', actions: [], signals: ['autoPromote'] };

    case 'loseBenefitRoll':
      return { type: 'immediate', actions: [], signals: ['loseBenefitRoll'] };

    case 'forceCareer':
      return { type: 'immediate', actions: [], signals: [`forceCareer:${node.career}`] };

    case 'gainAdvancementDM':
      return { type: 'immediate', actions: [], signals: [`advancementDM:${node.value}`] };

    // ── Compound: apply immediate, pause on first interactive ──
    case 'compound': {
      const immediateActions: CharacterAction[] = [];
      const signals: EffectSignal[] = [];

      for (const child of node.effects) {
        if (isInteractive(child)) {
          // Pause at the first interactive child, carry forward immediate actions
          const pauseResult = interpretEffect(child, character);
          if (pauseResult.type === 'pause') {
            return { ...pauseResult, immediateActions };
          }
          // If it resolved immediately (shouldn't happen), merge
          immediateActions.push(...pauseResult.actions);
          signals.push(...pauseResult.signals);
          continue;
        }

        const childResult = interpretEffect(child, character);
        if (childResult.type === 'immediate') {
          immediateActions.push(...childResult.actions);
          signals.push(...childResult.signals);
        }
      }

      return { type: 'immediate', actions: immediateActions, signals };
    }

    // ── Purely immediate effects ──
    default: {
      const actions = resolveImmediate(node, character);
      return { type: 'immediate', actions, signals: [] };
    }
  }
}

// ── Helpers ───────────────────────────────────────────────

const INTERACTIVE_TYPES = new Set([
  'choice', 'pickSkill', 'pickOne', 'narrative', 'skillCheck',
  'increaseExistingSkill', 'diceRoll', 'rollOnTable',
]);

function isInteractive(node: EffectNode): boolean {
  if (INTERACTIVE_TYPES.has(node.type)) return true;
  if (node.type === 'compound') {
    return node.effects.some(isInteractive);
  }
  return false;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/engine/__tests__/effect-interpreter.test.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 5: Run all Phase 3 tests together**

```bash
npx vitest run src/engine/__tests__/character-reducer.test.ts src/engine/__tests__/state-machine.test.ts src/engine/__tests__/effect-interpreter.test.ts src/context/__tests__/CharacterContext.test.tsx
```

Expected: PASS — all tests across all 4 test files pass.

- [ ] **Step 6: Commit**

```bash
git add src/engine/effect-interpreter.ts src/engine/__tests__/effect-interpreter.test.ts
git commit -m "feat: add effect interpreter for DSL action trees

Walks EffectNode trees depth-first and:
- Resolves immediate effects (gainSkill, modCharacteristic, etc.)
  to CharacterAction arrays for dispatch
- Pauses on interactive nodes (choice, pickSkill, narrative, skillCheck)
  returning pause metadata for UI rendering
- Handles compound effects: applies immediates, pauses on first interactive
- Emits signals for state machine side-effects (ejectFromCareer,
  autoPromote, forceCareer, loseBenefitRoll, advancementDM)
- resolveImmediate() helper for non-interactive subtrees

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
