# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up React+Vite+TypeScript project scaffolding, define all core TypeScript types, implement the dice/probability engine, and create the data layer (skills registry, species modifiers, Agent and Army career JSON files with effect DSL trees).

**Architecture:** A React SPA driven by a finite state machine. Character creation steps are wizard screens; complex events are encoded as declarative JSON action trees interpreted at runtime. Career data lives in standalone JSON files — adding a career requires zero code changes. State is managed via `useReducer` + React Context. This phase builds the non-visual foundation that all subsequent phases depend on.

**Tech Stack:** React 18, Vite 6, TypeScript (strict), Vitest + React Testing Library, CSS custom properties

## Global Constraints

- TypeScript strict mode (`"strict": true` in tsconfig)
- No external state libraries — React Context + `useReducer` only
- No CSS framework — CSS custom properties for theming
- All career data in standalone JSON files — no code changes to add a career
- Skills with specialties: incrementing the skill always means picking and incrementing a specialty instead
- DM table: 0→-3, 1-2→-2, 3-5→-1, 6-8→+0, 9-11→+1, 12-14→+2, 15+→+3 (**ASK USER to verify this**)
- Prisoner and Psionic careers have `isSpecial: true` — cannot be player-selected, only forced by events
- Target deployment: GitHub Pages (static build via `vite build` → `dist/`)
- **ASK THE USER** about any design decisions you're unsure about. The user has the official Mongoose Traveller 2e rulebook PDF and can clarify rules, resolve ambiguities, and weigh in on UI decisions.

### Data Gaps (require user input from official rules — don't block Phase 1)

1. Pre-career education: University/Military Academy entry requirements, skills, events, graduation rules
2. Life Events Table (referenced by career event 7 in both Agent and Army)
3. Injury Table (referenced by multiple mishaps)
4. Rogue/Citizen Events/Mishap tables (referenced by Agent event 8)
5. Draft table: which careers can be drafted into?
6. Aging rules: at what ages do checks kick in? What are the effects?
7. Pension rules: when earned? What amounts?
8. Commission timing: when during a term can it be attempted?
9. Mustering out: how many benefit rolls per term/rank?
10. Maximum terms limit?

---

## File Structure Map

```
package.json
vite.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.node.json
index.html
vitest.config.ts
src/
├── main.tsx                          Entry point — renders <App />
├── App.tsx                           Root component (placeholder for Phase 1)
├── App.css                           App-level styles
├── setupTests.ts                     Vitest setup (testing-library matchers)
├── vite-env.d.ts                     Vite client type reference
├── models/
│   ├── types.ts                      Character, Characteristics, Contact, CareerTerm, TimelineEntry
│   ├── career-types.ts               CareerData, Assignment, SkillTable, RankStructure, MusteringOut
│   └── effect-types.ts               EffectNode union type, all effect interfaces
├── engine/
│   ├── dice.ts                       rollD6, roll2D6, getDM, getSuccessChance
│   └── __tests__/
│       └── dice.test.ts
├── data/
│   ├── skills.ts                     SKILLS_REGISTRY: Map<name, specialties[]>
│   ├── background-skills.ts          BACKGROUND_SKILLS list (the 17 chooseable ones)
│   ├── species.ts                    SPECIES_MODIFIERS: species → characteristic deltas
│   ├── careers/
│   │   ├── agent.json                Full Agent career data with effect DSL trees
│   │   └── army.json                 Full Army career data with effect DSL trees
│   ├── career-loader.ts              loadCareer(), getAllCareerIds(), validateCareer()
│   └── __tests__/
│       ├── skills.test.ts
│       ├── species.test.ts
│       └── career-loader.test.ts
└── theme/
    ├── variables.css                 CSS custom properties (colors, spacing, hex clip-path)
    └── global.css                    Base resets, body, typography, utility classes
```

---

## Task 1: Project Scaffolding & Theme

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `vitest.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/setupTests.ts`, `src/vite-env.d.ts`, `src/theme/variables.css`, `src/theme/global.css`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: Working Vite dev server, Vitest runner, CSS custom properties available to all components

- [ ] **Step 1: Scaffold Vite project**

```bash
npm create vite@latest . -- --template react-ts
```

Accept overwrite prompts for any existing files. This creates the base React+TypeScript project structure.

- [ ] **Step 2: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
});
```

- [ ] **Step 4: Create `src/setupTests.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create `src/theme/variables.css`**

```css
:root {
  /* ── Palette ─────────────────────────────────── */
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #222222;
  --color-bg-surface: #2a2a2a;
  --color-bg-elevated: #333333;

  --color-accent: #c47a2a;
  --color-accent-light: #d4943e;
  --color-accent-dim: #8a5520;

  --color-text-primary: #e8e8e8;
  --color-text-secondary: #aaaaaa;
  --color-text-muted: #777777;

  --color-success-bg: #1a2a1a;
  --color-success-border: #2a4a2a;
  --color-success-text: #6abf6a;

  --color-failure-bg: #2a1a1a;
  --color-failure-border: #4a2a2a;
  --color-failure-text: #bf6a6a;

  --color-border: #444444;
  --color-border-light: #555555;

  /* ── Typography ──────────────────────────────── */
  --font-body: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-mono: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  /* ── Spacing ─────────────────────────────────── */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* ── Hex motif ───────────────────────────────── */
  --hex-clip: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);

  /* ── Chamfered header ────────────────────────── */
  --chamfer-size: 10px;
  --chamfer-bg: linear-gradient(135deg, transparent var(--chamfer-size), var(--color-bg-elevated) var(--chamfer-size));

  /* ── Borders & Radii ─────────────────────────── */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --border-width: 1px;
}
```

- [ ] **Step 6: Create `src/theme/global.css`**

```css
@import './variables.css';

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  line-height: 1.6;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  line-height: 1.2;
}

a {
  color: var(--color-accent-light);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  font-family: var(--font-body);
  cursor: pointer;
}

#root {
  min-height: 100vh;
}
```

- [ ] **Step 7: Update `src/App.tsx` to import theme**

```tsx
import './theme/global.css';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>Mongoose Traveller Character Creator</h1>
      <p>Phase 1 scaffolding complete.</p>
    </div>
  );
}

export default App;
```

- [ ] **Step 8: Update `src/App.css`**

```css
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl);
  text-align: center;
}
```

- [ ] **Step 9: Write smoke test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the title', () => {
    render(<App />);
    expect(screen.getByText(/Mongoose Traveller/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Verify build and tests**

```bash
npx vite build
npx vitest run
```

Expected: Build succeeds with no errors. Test passes: 1 test, 1 suite.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite React-TS project with theme and Vitest

Set up project structure with:
- Vite + React 18 + TypeScript strict
- Vitest + React Testing Library
- Faithful Dark theme CSS custom properties
- Hex clip-path and chamfered header variables
- Smoke test for App component

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Core Types & Data Models

**Files:**
- Create: `src/models/types.ts`, `src/models/career-types.ts`, `src/models/effect-types.ts`
- Test: `src/models/__tests__/types.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: All TypeScript interfaces used by every subsequent phase — `Character`, `Characteristics`, `CharacteristicName`, `Contact`, `CareerTerm`, `TimelineEntry`, `Species` (from `types.ts`); `CareerData`, `Assignment`, `SkillTable`, `RankStructure` (from `career-types.ts`); `EffectNode` union and all individual effect interfaces (from `effect-types.ts`)

- [ ] **Step 1: Write type validation test**

Create `src/models/__tests__/types.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/models/__tests__/types.test.ts
```

Expected: FAIL — modules `../types`, `../career-types`, `../effect-types` not found.

- [ ] **Step 3: Create `src/models/types.ts`**

```typescript
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
```

- [ ] **Step 4: Create `src/models/career-types.ts`**

```typescript
import type { CharacteristicName } from './types';
import type { EffectNode } from './effect-types';

export interface QualificationModifier {
  /** 'previousCareers': DM per previous career. 'age': DM if over threshold. */
  type: 'previousCareers' | 'age';
  dmPer?: number;
  threshold?: number;
  dm?: number;
}

export interface QualificationCheck {
  characteristic: CharacteristicName;
  target: number;
  modifiers?: QualificationModifier[];
}

export interface CommissionCheck {
  characteristic: CharacteristicName;
  target: number;
}

export interface CharacteristicCheck {
  characteristic: CharacteristicName;
  target: number;
}

export interface Assignment {
  id: string;
  name: string;
  description: string;
  survivalCheck: CharacteristicCheck;
  advancementCheck: CharacteristicCheck;
}

export type SkillTableRestriction =
  | { type: 'minEdu'; value: number }
  | { type: 'officer' }
  | { type: 'assignment'; assignmentId: string };

export type SkillTableEntry =
  | { type: 'skill'; skill: string; specialty?: string }
  | { type: 'characteristic'; characteristic: CharacteristicName; value: number }
  | { type: 'choice'; options: SkillTableEntry[] };

export interface SkillTable {
  id: string;
  name: string;
  restriction?: SkillTableRestriction;
  entries: Record<number, SkillTableEntry>;
}

export interface RankEntry {
  title: string;
  bonus?: EffectNode;
}

export type RankTrack = Record<number, RankEntry>;

/**
 * Rank structure variants:
 * - 'default': single rank track (most careers)
 * - 'split': enlisted + officer tracks (Army, Marines, Navy)
 * - 'assignment': per-assignment rank tracks (Agent)
 */
export interface RankStructure {
  type: 'default' | 'split' | 'assignment';
  tracks: Record<string, RankTrack>;
}

export interface MishapEntry {
  description: string;
  effects: EffectNode;
}

export interface EventEntry {
  description: string;
  effects: EffectNode;
}

export interface MusterBenefit {
  description: string;
  effects: EffectNode;
}

export interface MusteringOutTable {
  cash: Record<number, number>;
  benefits: Record<number, MusterBenefit>;
}

export interface CareerData {
  id: string;
  name: string;
  description: string;
  qualification: QualificationCheck | null;
  commission?: CommissionCheck;
  assignments: Assignment[];
  skillTables: SkillTable[];
  ranks: RankStructure;
  mishaps: Record<number, MishapEntry>;
  events: Record<number, EventEntry>;
  musteringOut: MusteringOutTable;
  isSpecial?: boolean;
}
```

- [ ] **Step 5: Create `src/models/effect-types.ts`**

```typescript
import type { CharacteristicName, ContactType } from './types';

// ── Individual effect interfaces ──────────────────────────

/** Set skill to at least `level` (default 0). For rank bonuses like "Streetwise 1". */
export interface GainSkillEffect {
  type: 'gainSkill';
  skill: string;
  level?: number;
}

/** Increment a skill by 1. For training/events like "increase Recon by one level". */
export interface IncreaseSkillEffect {
  type: 'increaseSkill';
  skill: string;
}

export interface GainSpecialtyEffect {
  type: 'gainSpecialty';
  skill: string;
  specialty: string;
  level?: number;
}

export interface ModCharacteristicEffect {
  type: 'modCharacteristic';
  characteristic: CharacteristicName;
  value: number;
}

/**
 * "SOC 10 or SOC +1, whichever is higher" (Army General rank).
 * If characteristic < minimum, set to minimum. Otherwise apply fallback.
 */
export interface EnsureCharacteristicEffect {
  type: 'ensureCharacteristic';
  characteristic: CharacteristicName;
  minimum: number;
  fallback: ModCharacteristicEffect;
}

export interface GainContactEffect {
  type: 'gainContact';
  contactType: ContactType;
  count?: number;
}

export interface GainBenefitDMEffect {
  type: 'gainBenefitDM';
  value: number;
}

export interface GainAdvancementDMEffect {
  type: 'gainAdvancementDM';
  value: number;
}

export interface RollOnTableEffect {
  type: 'rollOnTable';
  table: string;
  modifier?: 'takeLower' | 'takeHigher';
  fixedResult?: number;
}

export interface ForceCareerEffect {
  type: 'forceCareer';
  career: string;
}

export interface AutoPromoteEffect {
  type: 'autoPromote';
}

export interface EjectFromCareerEffect {
  type: 'ejectFromCareer';
}

export interface LoseBenefitRollEffect {
  type: 'loseBenefitRoll';
}

export interface SkillCheckEffect {
  type: 'skillCheck';
  skill?: string;
  characteristic?: CharacteristicName;
  target: number;
  success: EffectNode;
  failure: EffectNode;
  /** Extra effect triggered on unmodified roll of 2 (e.g., Agent mishap 3 → Prisoner). */
  naturalTwo?: EffectNode;
}

export interface ChoiceEffect {
  type: 'choice';
  prompt: string;
  options: ChoiceOption[];
}

export interface ChoiceOption {
  label: string;
  effects: EffectNode[];
}

export interface PickSkillEffect {
  type: 'pickSkill';
  options: string[];
  level?: number;
}

export interface PickOneEffect {
  type: 'pickOne';
  prompt: string;
  options: { label: string; effect: EffectNode }[];
}

export interface DiceRollEffect {
  type: 'diceRoll';
  dice: string;
  effectPerUnit: EffectNode;
}

export interface NarrativeEffect {
  type: 'narrative';
  prompt: string;
}

export interface CompoundEffect {
  type: 'compound';
  effects: EffectNode[];
}

export interface GainEquipmentEffect {
  type: 'gainEquipment';
  item: string;
}

export interface IncreaseExistingSkillEffect {
  type: 'increaseExistingSkill';
  /** If provided, restrict to skills the player already has. Otherwise, any skill. */
  filter?: 'owned';
}

export interface NoEffect {
  type: 'none';
}

// ── Union type ────────────────────────────────────────────

export type EffectNode =
  | GainSkillEffect
  | IncreaseSkillEffect
  | GainSpecialtyEffect
  | ModCharacteristicEffect
  | EnsureCharacteristicEffect
  | GainContactEffect
  | GainBenefitDMEffect
  | GainAdvancementDMEffect
  | RollOnTableEffect
  | ForceCareerEffect
  | AutoPromoteEffect
  | EjectFromCareerEffect
  | LoseBenefitRollEffect
  | SkillCheckEffect
  | ChoiceEffect
  | PickSkillEffect
  | PickOneEffect
  | DiceRollEffect
  | NarrativeEffect
  | CompoundEffect
  | GainEquipmentEffect
  | IncreaseExistingSkillEffect
  | NoEffect;
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run src/models/__tests__/types.test.ts
```

Expected: PASS — all 7 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/models/
git commit -m "feat: define core TypeScript types for character, career, and effect DSL

- Character model with characteristics, skills/specialties, contacts, timeline
- Career data types with qualification, assignments, skill tables, rank structures
- Effect DSL union type with 22 action types for event/mishap encoding
- createBlankCharacter() factory function

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Dice Engine, DM Calculation & Probability

**Files:**
- Create: `src/engine/dice.ts`, `src/engine/__tests__/dice.test.ts`

**Interfaces:**
- Consumes: `CharacteristicName` from `src/models/types.ts`
- Produces: `rollD6(): number`, `roll2D6(): number`, `getDM(score: number): number`, `getSuccessChance(target: number): number`, `getEffectiveTarget(baseTarget: number, dm: number): number`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/dice.test.ts`:

```typescript
import { rollD6, roll2D6, getDM, getSuccessChance, getEffectiveTarget } from '../dice';

describe('rollD6', () => {
  it('returns a value between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD6();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('returns an integer', () => {
    const result = rollD6();
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('roll2D6', () => {
  it('returns a value between 2 and 12', () => {
    for (let i = 0; i < 100; i++) {
      const result = roll2D6();
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(12);
    }
  });

  it('returns an integer', () => {
    const result = roll2D6();
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('getDM', () => {
  it.each([
    [0, -3],
    [1, -2],
    [2, -2],
    [3, -1],
    [4, -1],
    [5, -1],
    [6, 0],
    [7, 0],
    [8, 0],
    [9, 1],
    [10, 1],
    [11, 1],
    [12, 2],
    [13, 2],
    [14, 2],
    [15, 3],
    [20, 3],
  ])('getDM(%i) returns %i', (score, expected) => {
    expect(getDM(score)).toBe(expected);
  });
});

describe('getSuccessChance', () => {
  it.each([
    [2, 100],
    [3, 97],
    [4, 92],
    [5, 83],
    [6, 72],
    [7, 58],
    [8, 42],
    [9, 28],
    [10, 17],
    [11, 8],
    [12, 3],
  ])('getSuccessChance(%i) returns %i%%', (target, expected) => {
    expect(getSuccessChance(target)).toBe(expected);
  });

  it('returns 100 for targets <= 2', () => {
    expect(getSuccessChance(1)).toBe(100);
    expect(getSuccessChance(0)).toBe(100);
    expect(getSuccessChance(-1)).toBe(100);
  });

  it('returns 0 for targets > 12', () => {
    expect(getSuccessChance(13)).toBe(0);
    expect(getSuccessChance(15)).toBe(0);
  });
});

describe('getEffectiveTarget', () => {
  it('subtracts DM from base target', () => {
    expect(getEffectiveTarget(8, 1)).toBe(7);
    expect(getEffectiveTarget(8, -1)).toBe(9);
    expect(getEffectiveTarget(6, 0)).toBe(6);
  });

  it('clamps to 2-12 range', () => {
    expect(getEffectiveTarget(5, 10)).toBe(2);
    expect(getEffectiveTarget(10, -5)).toBe(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/engine/__tests__/dice.test.ts
```

Expected: FAIL — module `../dice` not found.

- [ ] **Step 3: Implement `src/engine/dice.ts`**

```typescript
/** Roll a single D6 (1–6). */
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** Roll 2D6 (2–12). */
export function roll2D6(): number {
  return rollD6() + rollD6();
}

/**
 * Mongoose Traveller 2e Dice Modifier table.
 * Score 0 → -3, 1-2 → -2, 3-5 → -1, 6-8 → 0, 9-11 → +1, 12-14 → +2, 15+ → +3
 */
export function getDM(score: number): number {
  if (score <= 0) return -3;
  if (score <= 2) return -2;
  if (score <= 5) return -1;
  if (score <= 8) return 0;
  if (score <= 11) return 1;
  if (score <= 14) return 2;
  return 3;
}

/**
 * Cumulative probability of rolling `target` or higher on 2D6.
 * Returns a rounded percentage (0–100).
 *
 * 2D6 has 36 outcomes. The number of ways to roll exactly N:
 * 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:5, 9:4, 10:3, 11:2, 12:1
 */
const WAYS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

export function getSuccessChance(target: number): number {
  if (target <= 2) return 100;
  if (target > 12) return 0;
  let ways = 0;
  for (let i = target; i <= 12; i++) {
    ways += WAYS[i];
  }
  return Math.round((ways / 36) * 100);
}

/**
 * Calculate the effective target number after applying DM.
 * effectiveTarget = baseTarget - dm, clamped to [2, 12].
 * A DM of +1 means you need 1 less on the dice.
 */
export function getEffectiveTarget(baseTarget: number, dm: number): number {
  return Math.max(2, Math.min(12, baseTarget - dm));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/engine/__tests__/dice.test.ts
```

Expected: PASS — all tests pass (getDM: 17 cases, getSuccessChance: 14 cases, rolls: 4 cases, getEffectiveTarget: 5 cases).

- [ ] **Step 5: Commit**

```bash
git add src/engine/
git commit -m "feat: implement dice engine with DM calculation and success probability

- rollD6() and roll2D6() random dice functions
- getDM() implements the Mongoose 2e DM table
- getSuccessChance() returns cumulative 2D6 probability as percentage
- getEffectiveTarget() calculates effective target after DM
- Full test coverage for all edge cases

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Data Layer — Skills, Species & Career JSON

**Files:**
- Create: `src/data/skills.ts`, `src/data/background-skills.ts`, `src/data/species.ts`, `src/data/careers/agent.json`, `src/data/careers/army.json`, `src/data/career-loader.ts`
- Test: `src/data/__tests__/skills.test.ts`, `src/data/__tests__/species.test.ts`, `src/data/__tests__/career-loader.test.ts`

**Interfaces:**
- Consumes: `Species`, `CharacteristicName` from `types.ts`; `CareerData` from `career-types.ts`; `EffectNode` from `effect-types.ts`
- Produces: `SKILLS_REGISTRY: Record<string, string[]>` (skill name → specialty names), `BACKGROUND_SKILLS: string[]` (17 chooseable skills), `SPECIES_MODIFIERS: Record<Species, Partial<Record<CharacteristicName, number>>>`, `loadCareer(id: string): CareerData`, `getAllCareerIds(): string[]`

- [ ] **Step 1: Write skills test**

Create `src/data/__tests__/skills.test.ts`:

```typescript
import { SKILLS_REGISTRY } from '../skills';
import { BACKGROUND_SKILLS } from '../background-skills';

describe('SKILLS_REGISTRY', () => {
  it('contains all core skills', () => {
    const expected = [
      'Admin', 'Advocate', 'Animals', 'Art', 'Astrogation', 'Athletics',
      'Broker', 'Carouse', 'Deception', 'Diplomat', 'Drive', 'Electronics',
      'Engineer', 'Explosives', 'Flyer', 'Gambler', 'Gunner', 'Gun Combat',
      'Heavy Weapons', 'Investigate', 'Jack-of-All-Trades', 'Language',
      'Leadership', 'Mechanic', 'Medic', 'Melee', 'Navigation', 'Persuade',
      'Pilot', 'Profession', 'Recon', 'Science', 'Seafarer', 'Stealth',
      'Steward', 'Streetwise', 'Survival', 'Tactics', 'Vacc Suit',
    ];
    for (const skill of expected) {
      expect(SKILLS_REGISTRY).toHaveProperty(skill);
    }
  });

  it('Animals has correct specialties', () => {
    expect(SKILLS_REGISTRY['Animals']).toEqual(['Handling', 'Veterinary', 'Training']);
  });

  it('Science has 18 specialties', () => {
    expect(SKILLS_REGISTRY['Science']).toHaveLength(18);
  });

  it('Admin has no specialties', () => {
    expect(SKILLS_REGISTRY['Admin']).toEqual([]);
  });

  it('skills without specialties have empty array', () => {
    const noSpecialty = ['Admin', 'Advocate', 'Broker', 'Carouse', 'Deception',
      'Diplomat', 'Explosives', 'Gambler', 'Investigate', 'Jack-of-All-Trades',
      'Leadership', 'Mechanic', 'Medic', 'Navigation', 'Persuade', 'Recon',
      'Stealth', 'Steward', 'Streetwise', 'Survival', 'Vacc Suit'];
    for (const skill of noSpecialty) {
      expect(SKILLS_REGISTRY[skill]).toEqual([]);
    }
  });
});

describe('BACKGROUND_SKILLS', () => {
  it('contains exactly 17 skills', () => {
    expect(BACKGROUND_SKILLS).toHaveLength(17);
  });

  it('contains all background-eligible skills', () => {
    const expected = [
      'Admin', 'Animals', 'Art', 'Athletics', 'Carouse', 'Drive',
      'Electronics', 'Flyer', 'Language', 'Mechanic', 'Medic',
      'Profession', 'Science', 'Seafarer', 'Streetwise', 'Survival', 'Vacc Suit',
    ];
    expect(BACKGROUND_SKILLS.sort()).toEqual(expected.sort());
  });

  it('every background skill exists in SKILLS_REGISTRY', () => {
    for (const skill of BACKGROUND_SKILLS) {
      expect(SKILLS_REGISTRY).toHaveProperty(skill);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/data/__tests__/skills.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/data/skills.ts`**

```typescript
/**
 * Complete skill registry: skill name → array of specialty names.
 * Skills with no specialties have an empty array.
 * Source: docs/list of skills.md
 */
export const SKILLS_REGISTRY: Record<string, string[]> = {
  'Admin': [],
  'Advocate': [],
  'Animals': ['Handling', 'Veterinary', 'Training'],
  'Art': ['Performer', 'Holography', 'Instrument', 'Visual Media', 'Write'],
  'Astrogation': [],
  'Athletics': ['Dexterity', 'Endurance', 'Strength'],
  'Broker': [],
  'Carouse': [],
  'Deception': [],
  'Diplomat': [],
  'Drive': ['Hovercraft', 'Mole', 'Track', 'Walker', 'Wheel'],
  'Electronics': ['Comms', 'Computers', 'Remote Ops', 'Sensors'],
  'Engineer': ['M-drive', 'J-Drive', 'Life Support', 'Power'],
  'Explosives': [],
  'Flyer': ['Airship', 'Grav', 'Ornithopter', 'Rotor', 'Wing'],
  'Gambler': [],
  'Gunner': ['Turret', 'Ortillery', 'Screen', 'Capital'],
  'Gun Combat': ['Archaic', 'Energy', 'Slug'],
  'Heavy Weapons': ['Artillery', 'Man Portable', 'Vehicle'],
  'Investigate': [],
  'Jack-of-All-Trades': [],
  'Language': ['Anglic', 'Vilani', 'Zdetl', 'Oynprith', 'Trokh'],
  'Leadership': [],
  'Mechanic': [],
  'Medic': [],
  'Melee': ['Unarmed', 'Blade', 'Bludgeon', 'Natural'],
  'Navigation': [],
  'Persuade': [],
  'Pilot': ['Small Craft', 'Spacecraft', 'Capital Ships'],
  'Profession': ['Belter', 'Biologicals', 'Civil Engineering', 'Construction', 'Hydroponics', 'Polymers'],
  'Recon': [],
  'Science': [
    'Archaeology', 'Astronomy', 'Biology', 'Chemistry', 'Cosmology',
    'Cybernetics', 'Economics', 'Genetics', 'History', 'Linguistics',
    'Philosophy', 'Physics', 'Planetology', 'Psionicology', 'Psychology',
    'Robotics', 'Sophontology', 'Xenology',
  ],
  'Seafarer': ['Ocean Ships', 'Sail', 'Submarine'],
  'Stealth': [],
  'Steward': [],
  'Streetwise': [],
  'Survival': [],
  'Tactics': ['Military', 'Naval'],
  'Vacc Suit': [],
};

/** Returns true if the skill has specialties. */
export function hasSpecialties(skill: string): boolean {
  return (SKILLS_REGISTRY[skill]?.length ?? 0) > 0;
}
```

- [ ] **Step 4: Implement `src/data/background-skills.ts`**

```typescript
/**
 * The 17 skills available during the Background Skills phase.
 * Players pick (3 + EDU DM) skills at level 0.
 * Source: user-provided rules clarification.
 */
export const BACKGROUND_SKILLS: string[] = [
  'Admin',
  'Animals',
  'Art',
  'Athletics',
  'Carouse',
  'Drive',
  'Electronics',
  'Flyer',
  'Language',
  'Mechanic',
  'Medic',
  'Profession',
  'Science',
  'Seafarer',
  'Streetwise',
  'Survival',
  'Vacc Suit',
];
```

- [ ] **Step 5: Run skills test to verify it passes**

```bash
npx vitest run src/data/__tests__/skills.test.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 6: Write species test**

Create `src/data/__tests__/species.test.ts`:

```typescript
import { SPECIES_MODIFIERS, SPECIES_LIST } from '../species';
import type { Species } from '../../models/types';

describe('SPECIES_MODIFIERS', () => {
  it('human has no modifiers', () => {
    expect(SPECIES_MODIFIERS['human']).toEqual({});
  });

  it('aslan has STR +2, DEX -2', () => {
    expect(SPECIES_MODIFIERS['aslan']).toEqual({ STR: 2, DEX: -2 });
  });

  it('vargr has STR -1, DEX +1, END -1', () => {
    expect(SPECIES_MODIFIERS['vargr']).toEqual({ STR: -1, DEX: 1, END: -1 });
  });
});

describe('SPECIES_LIST', () => {
  it('contains all three species', () => {
    expect(SPECIES_LIST).toEqual(['human', 'aslan', 'vargr']);
  });
});
```

- [ ] **Step 7: Implement `src/data/species.ts`**

```typescript
import type { Species, CharacteristicName } from '../models/types';

export const SPECIES_MODIFIERS: Record<Species, Partial<Record<CharacteristicName, number>>> = {
  human: {},
  aslan: { STR: 2, DEX: -2 },
  vargr: { STR: -1, DEX: 1, END: -1 },
};

export const SPECIES_LIST: Species[] = ['human', 'aslan', 'vargr'];
```

- [ ] **Step 8: Run species test to verify it passes**

```bash
npx vitest run src/data/__tests__/species.test.ts
```

Expected: PASS — all tests pass.

- [ ] **Step 9: Create `src/data/careers/agent.json`**

This is the complete Agent career data transcribed from `docs/careers/agent.md` into the `CareerData` JSON schema. Every mishap and event includes its full effect tree.

```json
{
  "id": "agent",
  "name": "Agent",
  "description": "Law enforcement agencies, corporate operatives, spies, and others who work in the shadows.",
  "qualification": {
    "characteristic": "INT",
    "target": 6,
    "modifiers": [{ "type": "previousCareers", "dmPer": -1 }]
  },
  "assignments": [
    {
      "id": "law-enforcement",
      "name": "Law Enforcement",
      "description": "You are a police officer or detective.",
      "survivalCheck": { "characteristic": "END", "target": 6 },
      "advancementCheck": { "characteristic": "INT", "target": 6 }
    },
    {
      "id": "intelligence",
      "name": "Intelligence",
      "description": "You work as a spy or saboteur.",
      "survivalCheck": { "characteristic": "INT", "target": 7 },
      "advancementCheck": { "characteristic": "INT", "target": 5 }
    },
    {
      "id": "corporate",
      "name": "Corporate",
      "description": "You work for a corporation, spying on rival organisations.",
      "survivalCheck": { "characteristic": "INT", "target": 5 },
      "advancementCheck": { "characteristic": "INT", "target": 7 }
    }
  ],
  "skillTables": [
    {
      "id": "personal-development",
      "name": "Personal Development",
      "entries": {
        "1": { "type": "skill", "skill": "Gun Combat" },
        "2": { "type": "characteristic", "characteristic": "DEX", "value": 1 },
        "3": { "type": "characteristic", "characteristic": "END", "value": 1 },
        "4": { "type": "skill", "skill": "Melee" },
        "5": { "type": "characteristic", "characteristic": "INT", "value": 1 },
        "6": { "type": "skill", "skill": "Athletics" }
      }
    },
    {
      "id": "service-skills",
      "name": "Service Skills",
      "entries": {
        "1": { "type": "skill", "skill": "Streetwise" },
        "2": { "type": "skill", "skill": "Drive" },
        "3": { "type": "skill", "skill": "Investigate" },
        "4": { "type": "skill", "skill": "Flyer" },
        "5": { "type": "skill", "skill": "Recon" },
        "6": { "type": "skill", "skill": "Gun Combat" }
      }
    },
    {
      "id": "advanced-education",
      "name": "Advanced Education",
      "restriction": { "type": "minEdu", "value": 8 },
      "entries": {
        "1": { "type": "skill", "skill": "Advocate" },
        "2": { "type": "skill", "skill": "Language" },
        "3": { "type": "skill", "skill": "Explosives" },
        "4": { "type": "skill", "skill": "Medic" },
        "5": { "type": "skill", "skill": "Vacc Suit" },
        "6": { "type": "skill", "skill": "Electronics" }
      }
    },
    {
      "id": "law-enforcement-skills",
      "name": "Law Enforcement",
      "restriction": { "type": "assignment", "assignmentId": "law-enforcement" },
      "entries": {
        "1": { "type": "skill", "skill": "Investigate" },
        "2": { "type": "skill", "skill": "Recon" },
        "3": { "type": "skill", "skill": "Streetwise" },
        "4": { "type": "skill", "skill": "Stealth" },
        "5": { "type": "skill", "skill": "Melee" },
        "6": { "type": "skill", "skill": "Advocate" }
      }
    },
    {
      "id": "intelligence-skills",
      "name": "Intelligence",
      "restriction": { "type": "assignment", "assignmentId": "intelligence" },
      "entries": {
        "1": { "type": "skill", "skill": "Investigate" },
        "2": { "type": "skill", "skill": "Recon" },
        "3": { "type": "skill", "skill": "Electronics", "specialty": "Comms" },
        "4": { "type": "skill", "skill": "Stealth" },
        "5": { "type": "skill", "skill": "Persuade" },
        "6": { "type": "skill", "skill": "Deception" }
      }
    },
    {
      "id": "corporate-skills",
      "name": "Corporate",
      "restriction": { "type": "assignment", "assignmentId": "corporate" },
      "entries": {
        "1": { "type": "skill", "skill": "Investigate" },
        "2": { "type": "skill", "skill": "Electronics", "specialty": "Computers" },
        "3": { "type": "skill", "skill": "Stealth" },
        "4": { "type": "skill", "skill": "Carouse" },
        "5": { "type": "skill", "skill": "Deception" },
        "6": { "type": "skill", "skill": "Streetwise" }
      }
    }
  ],
  "ranks": {
    "type": "assignment",
    "tracks": {
      "law-enforcement": {
        "0": { "title": "Rookie" },
        "1": { "title": "Corporal", "bonus": { "type": "gainSkill", "skill": "Streetwise", "level": 1 } },
        "2": { "title": "Sergeant" },
        "3": { "title": "Detective" },
        "4": { "title": "Lieutenant", "bonus": { "type": "gainSkill", "skill": "Investigate", "level": 1 } },
        "5": { "title": "Chief", "bonus": { "type": "gainSkill", "skill": "Admin", "level": 1 } },
        "6": { "title": "Commissioner", "bonus": { "type": "modCharacteristic", "characteristic": "SOC", "value": 1 } }
      },
      "intelligence": {
        "0": { "title": "" },
        "1": { "title": "Agent", "bonus": { "type": "gainSkill", "skill": "Deception", "level": 1 } },
        "2": { "title": "Field Agent", "bonus": { "type": "gainSkill", "skill": "Investigate", "level": 1 } },
        "3": { "title": "Field Agent" },
        "4": { "title": "Special Agent", "bonus": { "type": "gainSkill", "skill": "Gun Combat", "level": 1 } },
        "5": { "title": "Assistant Director" },
        "6": { "title": "Director" }
      },
      "corporate": {
        "0": { "title": "" },
        "1": { "title": "Agent", "bonus": { "type": "gainSkill", "skill": "Deception", "level": 1 } },
        "2": { "title": "Field Agent", "bonus": { "type": "gainSkill", "skill": "Investigate", "level": 1 } },
        "3": { "title": "Field Agent" },
        "4": { "title": "Special Agent", "bonus": { "type": "gainSkill", "skill": "Gun Combat", "level": 1 } },
        "5": { "title": "Assistant Director" },
        "6": { "title": "Director" }
      }
    }
  },
  "mishaps": {
    "1": {
      "description": "Severely injured (this is the same as a result of 2 on the Injury Table). Alternatively, roll twice on the Injury Table and take the lower result.",
      "effects": {
        "type": "choice",
        "prompt": "Choose how to handle your severe injury:",
        "options": [
          {
            "label": "Standard severe injury (Injury Table result 2)",
            "effects": [{ "type": "rollOnTable", "table": "injury", "fixedResult": 2 }]
          },
          {
            "label": "Roll twice on Injury Table, take the lower result",
            "effects": [{ "type": "rollOnTable", "table": "injury", "modifier": "takeLower" }]
          }
        ]
      }
    },
    "2": {
      "description": "A criminal or other figure under investigation offers you a deal. Accept, and you leave this career without further penalty (although you lose the Benefit roll as normal). Refuse, and you must roll twice on the Injury Table and take the lower result. You gain an Enemy and one level in any skill you choose.",
      "effects": {
        "type": "choice",
        "prompt": "A criminal under investigation offers you a deal:",
        "options": [
          {
            "label": "Accept the deal (leave career, lose benefit roll)",
            "effects": [{ "type": "none" }]
          },
          {
            "label": "Refuse the deal (injury risk, but gain Enemy and a skill)",
            "effects": [
              { "type": "rollOnTable", "table": "injury", "modifier": "takeLower" },
              { "type": "gainContact", "contactType": "enemy" },
              { "type": "increaseExistingSkill" }
            ]
          }
        ]
      }
    },
    "3": {
      "description": "An investigation goes critically wrong or leads to the top, ruining your career. Roll Advocate 8+. If you succeed, you may keep the Benefit roll from this term. If you roll 2, you must take the Prisoner career in your next term.",
      "effects": {
        "type": "skillCheck",
        "skill": "Advocate",
        "target": 8,
        "success": { "type": "narrative", "prompt": "Your legal skills saved your benefit roll. How did you argue your case?" },
        "failure": { "type": "loseBenefitRoll" },
        "naturalTwo": {
          "type": "compound",
          "effects": [
            { "type": "loseBenefitRoll" },
            { "type": "forceCareer", "career": "prisoner" }
          ]
        }
      }
    },
    "4": {
      "description": "You learn something you should not know, and people want to kill you for it. Gain an Enemy and Deception 1.",
      "effects": {
        "type": "compound",
        "effects": [
          { "type": "gainContact", "contactType": "enemy" },
          { "type": "gainSkill", "skill": "Deception", "level": 1 },
          { "type": "narrative", "prompt": "What dangerous secret did you uncover?" }
        ]
      }
    },
    "5": {
      "description": "Your work ends up coming home with you, and someone gets hurt. Choose one of your Contacts, Allies or family members, and roll twice on the Injury Table for them, taking the lower result.",
      "effects": {
        "type": "compound",
        "effects": [
          { "type": "narrative", "prompt": "Which contact, ally, or family member was hurt because of your work?" },
          { "type": "rollOnTable", "table": "injury", "modifier": "takeLower" }
        ]
      }
    },
    "6": {
      "description": "Injured. Roll on the Injury Table.",
      "effects": { "type": "rollOnTable", "table": "injury" }
    }
  },
  "events": {
    "2": {
      "description": "Disaster! Roll on the Mishap Table, but you are not ejected from this career.",
      "effects": { "type": "rollOnTable", "table": "mishap" }
    },
    "3": {
      "description": "An investigation takes on a dangerous turn. Roll Investigate 8+ or Streetwise 8+. If you fail, roll on the Mishap Table. If you succeed, increase one of these skills by one level: Deception, Jack-of-all-Trades, Persuade or Tactics.",
      "effects": {
        "type": "pickOne",
        "prompt": "Choose which skill to use for your investigation check:",
        "options": [
          {
            "label": "Investigate 8+",
            "effect": {
              "type": "skillCheck",
              "skill": "Investigate",
              "target": 8,
              "success": {
                "type": "pickSkill",
                "options": ["Deception", "Jack-of-All-Trades", "Persuade", "Tactics"],
                "level": 1
              },
              "failure": { "type": "rollOnTable", "table": "mishap" }
            }
          },
          {
            "label": "Streetwise 8+",
            "effect": {
              "type": "skillCheck",
              "skill": "Streetwise",
              "target": 8,
              "success": {
                "type": "pickSkill",
                "options": ["Deception", "Jack-of-All-Trades", "Persuade", "Tactics"],
                "level": 1
              },
              "failure": { "type": "rollOnTable", "table": "mishap" }
            }
          }
        ]
      }
    },
    "4": {
      "description": "You complete a mission for your superiors, and are suitably rewarded. Gain DM+1 to any one Benefit roll from this career.",
      "effects": { "type": "gainBenefitDM", "value": 1 }
    },
    "5": {
      "description": "You establish a network of contacts. Gain D3 Contacts.",
      "effects": {
        "type": "diceRoll",
        "dice": "1d3",
        "effectPerUnit": { "type": "gainContact", "contactType": "contact" }
      }
    },
    "6": {
      "description": "You are given advanced training in a specialist field. Roll EDU 8+ to increase any one skill you already have by one level.",
      "effects": {
        "type": "skillCheck",
        "characteristic": "EDU",
        "target": 8,
        "success": { "type": "increaseExistingSkill", "filter": "owned" },
        "failure": { "type": "none" }
      }
    },
    "7": {
      "description": "Life Event. Roll on the Life Events Table.",
      "effects": { "type": "rollOnTable", "table": "life-events" }
    },
    "8": {
      "description": "You go undercover to investigate an enemy. Roll Deception 8+. If you succeed, roll immediately on the Rogue or Citizen Events Table and make one roll on any Specialist skill table for that career. If you fail, roll immediately on the Rogue or Citizen Mishap Table.",
      "effects": {
        "type": "skillCheck",
        "skill": "Deception",
        "target": 8,
        "success": {
          "type": "compound",
          "effects": [
            { "type": "rollOnTable", "table": "rogue-citizen-events" },
            { "type": "narrative", "prompt": "Your undercover work was a success. What did you learn?" }
          ]
        },
        "failure": { "type": "rollOnTable", "table": "rogue-citizen-mishaps" }
      }
    },
    "9": {
      "description": "You go above and beyond the call of duty. Gain DM+2 to your next Advancement check.",
      "effects": { "type": "gainAdvancementDM", "value": 2 }
    },
    "10": {
      "description": "You are given specialist training in vehicles. Gain one of Drive 1, Flyer 1, Pilot 1 or Gunner 1.",
      "effects": {
        "type": "pickSkill",
        "options": ["Drive", "Flyer", "Pilot", "Gunner"],
        "level": 1
      }
    },
    "11": {
      "description": "You are befriended by a senior agent. Either increase Investigate by one level or DM+4 to an Advancement roll thanks to their aid.",
      "effects": {
        "type": "pickOne",
        "prompt": "A senior agent befriends you. Choose your reward:",
        "options": [
          { "label": "Increase Investigate by one level", "effect": { "type": "increaseSkill", "skill": "Investigate" } },
          { "label": "DM+4 to next Advancement roll", "effect": { "type": "gainAdvancementDM", "value": 4 } }
        ]
      }
    },
    "12": {
      "description": "Your efforts uncover a major conspiracy against your employers. You are automatically promoted.",
      "effects": { "type": "autoPromote" }
    }
  },
  "musteringOut": {
    "cash": { "1": 1000, "2": 2000, "3": 5000, "4": 7500, "5": 10000, "6": 25000, "7": 50000 },
    "benefits": {
      "1": { "description": "Scientific Equipment", "effects": { "type": "gainEquipment", "item": "Scientific Equipment" } },
      "2": { "description": "INT +1", "effects": { "type": "modCharacteristic", "characteristic": "INT", "value": 1 } },
      "3": { "description": "Ship Share", "effects": { "type": "gainEquipment", "item": "Ship Share" } },
      "4": { "description": "Weapon", "effects": { "type": "gainEquipment", "item": "Weapon" } },
      "5": { "description": "Combat Implant", "effects": { "type": "gainEquipment", "item": "Combat Implant" } },
      "6": {
        "description": "SOC +1 or Combat Implant",
        "effects": {
          "type": "pickOne",
          "prompt": "Choose your benefit:",
          "options": [
            { "label": "SOC +1", "effect": { "type": "modCharacteristic", "characteristic": "SOC", "value": 1 } },
            { "label": "Combat Implant", "effect": { "type": "gainEquipment", "item": "Combat Implant" } }
          ]
        }
      },
      "7": { "description": "TAS Membership", "effects": { "type": "gainEquipment", "item": "TAS Membership" } }
    }
  }
}
```

- [ ] **Step 10: Create `src/data/careers/army.json`**

This is the complete Army career data transcribed from `docs/careers/army.md`. Note: Army has a commission mechanic and split enlisted/officer rank tracks.

```json
{
  "id": "army",
  "name": "Army",
  "description": "Members of the planetary armed fighting forces. Soldiers deal with planetary surface actions, battles and campaigns. Such individuals may also be mercenaries for hire.",
  "qualification": {
    "characteristic": "END",
    "target": 5,
    "modifiers": [
      { "type": "previousCareers", "dmPer": -1 },
      { "type": "age", "threshold": 30, "dm": -2 }
    ]
  },
  "commission": {
    "characteristic": "SOC",
    "target": 8
  },
  "assignments": [
    {
      "id": "support",
      "name": "Support",
      "description": "You are an engineer, cook or in some other role behind the front lines.",
      "survivalCheck": { "characteristic": "END", "target": 5 },
      "advancementCheck": { "characteristic": "EDU", "target": 7 }
    },
    {
      "id": "infantry",
      "name": "Infantry",
      "description": "You are one of the Poor Bloody Infantry on the ground.",
      "survivalCheck": { "characteristic": "STR", "target": 6 },
      "advancementCheck": { "characteristic": "EDU", "target": 6 }
    },
    {
      "id": "cavalry",
      "name": "Cavalry",
      "description": "You are one of the crew of a gunship or tank.",
      "survivalCheck": { "characteristic": "INT", "target": 7 },
      "advancementCheck": { "characteristic": "INT", "target": 5 }
    }
  ],
  "skillTables": [
    {
      "id": "personal-development",
      "name": "Personal Development",
      "entries": {
        "1": { "type": "characteristic", "characteristic": "STR", "value": 1 },
        "2": { "type": "characteristic", "characteristic": "DEX", "value": 1 },
        "3": { "type": "characteristic", "characteristic": "END", "value": 1 },
        "4": { "type": "skill", "skill": "Gambler" },
        "5": { "type": "skill", "skill": "Medic" },
        "6": { "type": "skill", "skill": "Melee" }
      }
    },
    {
      "id": "service-skills",
      "name": "Service Skills",
      "entries": {
        "1": { "type": "choice", "options": [{ "type": "skill", "skill": "Drive" }, { "type": "skill", "skill": "Vacc Suit" }] },
        "2": { "type": "skill", "skill": "Athletics" },
        "3": { "type": "skill", "skill": "Gun Combat" },
        "4": { "type": "skill", "skill": "Recon" },
        "5": { "type": "skill", "skill": "Melee" },
        "6": { "type": "skill", "skill": "Heavy Weapons" }
      }
    },
    {
      "id": "advanced-education",
      "name": "Advanced Education",
      "restriction": { "type": "minEdu", "value": 8 },
      "entries": {
        "1": { "type": "skill", "skill": "Tactics", "specialty": "Military" },
        "2": { "type": "skill", "skill": "Electronics" },
        "3": { "type": "skill", "skill": "Navigation" },
        "4": { "type": "skill", "skill": "Explosives" },
        "5": { "type": "skill", "skill": "Engineer" },
        "6": { "type": "skill", "skill": "Survival" }
      }
    },
    {
      "id": "officer",
      "name": "Officer",
      "restriction": { "type": "officer" },
      "entries": {
        "1": { "type": "skill", "skill": "Tactics", "specialty": "Military" },
        "2": { "type": "skill", "skill": "Leadership" },
        "3": { "type": "skill", "skill": "Advocate" },
        "4": { "type": "skill", "skill": "Diplomat" },
        "5": { "type": "skill", "skill": "Electronics" },
        "6": { "type": "skill", "skill": "Admin" }
      }
    },
    {
      "id": "support-skills",
      "name": "Support",
      "restriction": { "type": "assignment", "assignmentId": "support" },
      "entries": {
        "1": { "type": "skill", "skill": "Mechanic" },
        "2": { "type": "choice", "options": [{ "type": "skill", "skill": "Drive" }, { "type": "skill", "skill": "Flyer" }] },
        "3": { "type": "skill", "skill": "Profession" },
        "4": { "type": "skill", "skill": "Explosives" },
        "5": { "type": "skill", "skill": "Electronics", "specialty": "Comms" },
        "6": { "type": "skill", "skill": "Medic" }
      }
    },
    {
      "id": "infantry-skills",
      "name": "Infantry",
      "restriction": { "type": "assignment", "assignmentId": "infantry" },
      "entries": {
        "1": { "type": "skill", "skill": "Gun Combat" },
        "2": { "type": "skill", "skill": "Melee" },
        "3": { "type": "skill", "skill": "Heavy Weapons" },
        "4": { "type": "skill", "skill": "Stealth" },
        "5": { "type": "skill", "skill": "Athletics" },
        "6": { "type": "skill", "skill": "Recon" }
      }
    },
    {
      "id": "cavalry-skills",
      "name": "Cavalry",
      "restriction": { "type": "assignment", "assignmentId": "cavalry" },
      "entries": {
        "1": { "type": "skill", "skill": "Mechanic" },
        "2": { "type": "skill", "skill": "Drive" },
        "3": { "type": "skill", "skill": "Flyer" },
        "4": { "type": "skill", "skill": "Recon" },
        "5": { "type": "skill", "skill": "Heavy Weapons", "specialty": "Vehicle" },
        "6": { "type": "skill", "skill": "Electronics", "specialty": "Sensors" }
      }
    }
  ],
  "ranks": {
    "type": "split",
    "tracks": {
      "enlisted": {
        "0": { "title": "Private", "bonus": { "type": "gainSkill", "skill": "Gun Combat", "level": 1 } },
        "1": { "title": "Lance Corporal", "bonus": { "type": "gainSkill", "skill": "Recon", "level": 1 } },
        "2": { "title": "Corporal" },
        "3": { "title": "Lance Sergeant", "bonus": { "type": "gainSkill", "skill": "Leadership", "level": 1 } },
        "4": { "title": "Sergeant" },
        "5": { "title": "Gunnery Sergeant" },
        "6": { "title": "Sergeant Major" }
      },
      "officer": {
        "1": { "title": "Lieutenant", "bonus": { "type": "gainSkill", "skill": "Leadership", "level": 1 } },
        "2": { "title": "Captain" },
        "3": { "title": "Major", "bonus": { "type": "gainSpecialty", "skill": "Tactics", "specialty": "Military", "level": 1 } },
        "4": { "title": "Lieutenant Colonel" },
        "5": { "title": "Colonel" },
        "6": {
          "title": "General",
          "bonus": {
            "type": "ensureCharacteristic",
            "characteristic": "SOC",
            "minimum": 10,
            "fallback": { "type": "modCharacteristic", "characteristic": "SOC", "value": 1 }
          }
        }
      }
    }
  },
  "mishaps": {
    "1": {
      "description": "Severely injured in action (this is the same as a result of 2 on the Injury Table). Alternatively, roll twice on the Injury Table and take the lower result.",
      "effects": {
        "type": "choice",
        "prompt": "Choose how to handle your severe injury:",
        "options": [
          {
            "label": "Standard severe injury (Injury Table result 2)",
            "effects": [{ "type": "rollOnTable", "table": "injury", "fixedResult": 2 }]
          },
          {
            "label": "Roll twice on Injury Table, take the lower result",
            "effects": [{ "type": "rollOnTable", "table": "injury", "modifier": "takeLower" }]
          }
        ]
      }
    },
    "2": {
      "description": "Your unit is slaughtered in a disastrous battle, for which you blame your commander. Gain them as an Enemy as they have you removed from the service.",
      "effects": {
        "type": "compound",
        "effects": [
          { "type": "gainContact", "contactType": "enemy" },
          { "type": "narrative", "prompt": "Who was the commander you blame for the disaster? What happened?" }
        ]
      }
    },
    "3": {
      "description": "You are sent to a very unpleasant region to battle against guerrilla fighters and rebels. You are discharged because of stress, injury or because the government wishes to bury the whole incident. Increase Recon or Survival by one level but also gain the rebels as an Enemy.",
      "effects": {
        "type": "compound",
        "effects": [
          {
            "type": "pickOne",
            "prompt": "Choose a skill to increase:",
            "options": [
              { "label": "Increase Recon", "effect": { "type": "increaseSkill", "skill": "Recon" } },
              { "label": "Increase Survival", "effect": { "type": "increaseSkill", "skill": "Survival" } }
            ]
          },
          { "type": "gainContact", "contactType": "enemy" },
          { "type": "narrative", "prompt": "Describe the unpleasant region and your experience fighting guerrillas." }
        ]
      }
    },
    "4": {
      "description": "You discover that your commanding officer is engaged in some illegal activity, such as weapon smuggling. You can join their ring and gain them as an Ally before being discharged, or cooperate with the military police and keep your Benefit roll.",
      "effects": {
        "type": "choice",
        "prompt": "Your commanding officer is involved in illegal activity:",
        "options": [
          {
            "label": "Join the ring (gain Ally, lose benefit)",
            "effects": [
              { "type": "gainContact", "contactType": "ally" },
              { "type": "loseBenefitRoll" }
            ]
          },
          {
            "label": "Cooperate with military police (keep benefit roll)",
            "effects": [{ "type": "narrative", "prompt": "How did the investigation play out?" }]
          }
        ]
      }
    },
    "5": {
      "description": "You are tormented by or quarrel with an officer or fellow soldier. Gain that officer as a Rival as they drive you out of the service.",
      "effects": {
        "type": "compound",
        "effects": [
          { "type": "gainContact", "contactType": "rival" },
          { "type": "narrative", "prompt": "Who was the officer or soldier who tormented you? What was the quarrel about?" }
        ]
      }
    },
    "6": {
      "description": "Injured. Roll on the Injury Table.",
      "effects": { "type": "rollOnTable", "table": "injury" }
    }
  },
  "events": {
    "2": {
      "description": "Disaster! Roll on the Mishap Table, but you are not ejected from this career.",
      "effects": { "type": "rollOnTable", "table": "mishap" }
    },
    "3": {
      "description": "You are assigned to a planet with a hostile or wild environment. Gain one of Vacc Suit 1, Engineer 1, Animals (riding or training) 1 or Recon 1.",
      "effects": {
        "type": "pickOne",
        "prompt": "Choose a skill gained from your hostile environment assignment:",
        "options": [
          { "label": "Vacc Suit 1", "effect": { "type": "gainSkill", "skill": "Vacc Suit", "level": 1 } },
          { "label": "Engineer 1", "effect": { "type": "gainSkill", "skill": "Engineer", "level": 1 } },
          { "label": "Animals (Handling) 1", "effect": { "type": "gainSpecialty", "skill": "Animals", "specialty": "Handling", "level": 1 } },
          { "label": "Animals (Training) 1", "effect": { "type": "gainSpecialty", "skill": "Animals", "specialty": "Training", "level": 1 } },
          { "label": "Recon 1", "effect": { "type": "gainSkill", "skill": "Recon", "level": 1 } }
        ]
      }
    },
    "4": {
      "description": "You are assigned to an urbanised planet torn by war. Gain one of Stealth 1, Streetwise 1, Persuade 1 or Recon 1.",
      "effects": {
        "type": "pickSkill",
        "options": ["Stealth", "Streetwise", "Persuade", "Recon"],
        "level": 1
      }
    },
    "5": {
      "description": "You are given a special assignment or duty in your unit. Gain DM+1 to any one Benefit roll.",
      "effects": { "type": "gainBenefitDM", "value": 1 }
    },
    "6": {
      "description": "You are thrown into a brutal ground war. Roll EDU 8+ to avoid injury; if you succeed, you gain one level in Gun Combat or Leadership.",
      "effects": {
        "type": "skillCheck",
        "characteristic": "EDU",
        "target": 8,
        "success": {
          "type": "pickOne",
          "prompt": "You survived the ground war. Choose a skill to improve:",
          "options": [
            { "label": "Gun Combat", "effect": { "type": "increaseSkill", "skill": "Gun Combat" } },
            { "label": "Leadership", "effect": { "type": "increaseSkill", "skill": "Leadership" } }
          ]
        },
        "failure": { "type": "rollOnTable", "table": "injury" }
      }
    },
    "7": {
      "description": "Life Event. Roll on the Life Events Table.",
      "effects": { "type": "rollOnTable", "table": "life-events" }
    },
    "8": {
      "description": "You are given advanced training in a specialist field. Roll EDU 8+ to increase any one skill you already have by one level.",
      "effects": {
        "type": "skillCheck",
        "characteristic": "EDU",
        "target": 8,
        "success": { "type": "increaseExistingSkill", "filter": "owned" },
        "failure": { "type": "none" }
      }
    },
    "9": {
      "description": "Surrounded and outnumbered by the enemy, you hold out until relief arrives. Gain DM+2 to your next Advancement check.",
      "effects": { "type": "gainAdvancementDM", "value": 2 }
    },
    "10": {
      "description": "You are assigned to a peacekeeping role. Gain one of Admin 1, Investigate 1, Deception 1 or Recon 1.",
      "effects": {
        "type": "pickSkill",
        "options": ["Admin", "Investigate", "Deception", "Recon"],
        "level": 1
      }
    },
    "11": {
      "description": "Your commanding officer takes an interest in your career. Either gain Tactics (military) 1 or DM+4 to your next Advancement roll thanks to their aid.",
      "effects": {
        "type": "pickOne",
        "prompt": "Your commanding officer takes an interest in you:",
        "options": [
          { "label": "Gain Tactics (Military) 1", "effect": { "type": "gainSpecialty", "skill": "Tactics", "specialty": "Military", "level": 1 } },
          { "label": "DM+4 to next Advancement roll", "effect": { "type": "gainAdvancementDM", "value": 4 } }
        ]
      }
    },
    "12": {
      "description": "You display heroism in battle. You may gain a promotion or a commission automatically.",
      "effects": {
        "type": "pickOne",
        "prompt": "Your heroism is recognized! Choose your reward:",
        "options": [
          { "label": "Automatic promotion", "effect": { "type": "autoPromote" } },
          { "label": "Automatic commission", "effect": { "type": "autoPromote" } }
        ]
      }
    }
  },
  "musteringOut": {
    "cash": { "1": 2000, "2": 5000, "3": 10000, "4": 10000, "5": 10000, "6": 20000, "7": 30000 },
    "benefits": {
      "1": { "description": "Combat Implant", "effects": { "type": "gainEquipment", "item": "Combat Implant" } },
      "2": { "description": "INT +1", "effects": { "type": "modCharacteristic", "characteristic": "INT", "value": 1 } },
      "3": { "description": "EDU +1", "effects": { "type": "modCharacteristic", "characteristic": "EDU", "value": 1 } },
      "4": { "description": "Weapon", "effects": { "type": "gainEquipment", "item": "Weapon" } },
      "5": { "description": "Armour", "effects": { "type": "gainEquipment", "item": "Armour" } },
      "6": {
        "description": "END +1 or Combat Implant",
        "effects": {
          "type": "pickOne",
          "prompt": "Choose your benefit:",
          "options": [
            { "label": "END +1", "effect": { "type": "modCharacteristic", "characteristic": "END", "value": 1 } },
            { "label": "Combat Implant", "effect": { "type": "gainEquipment", "item": "Combat Implant" } }
          ]
        }
      },
      "7": { "description": "SOC +1", "effects": { "type": "modCharacteristic", "characteristic": "SOC", "value": 1 } }
    }
  }
}
```

**NOTE on Army event 3:** The original text says "Animals (riding or training) 1". The skills list has "Handling", "Veterinary", "Training" as Animals specialties — no "Riding". This JSON uses "Handling" and "Training" as the options. **ASK USER** to verify whether "riding" should be "Handling" or if it's a separate specialty.

**NOTE on Army event 12:** The text says "You may gain a promotion or a commission automatically." For the commission option, the effect type should arguably be a distinct `autoCommission` type rather than reusing `autoPromote`. **ASK USER** for clarification on how auto-commission should work — does it replace the normal commission check, or does it grant both commission and first officer rank?

- [ ] **Step 11: Write career-loader test**

Create `src/data/__tests__/career-loader.test.ts`:

```typescript
import { loadCareer, getAllCareerIds } from '../career-loader';
import type { CareerData } from '../../models/career-types';

describe('getAllCareerIds', () => {
  it('returns agent and army', () => {
    const ids = getAllCareerIds();
    expect(ids).toContain('agent');
    expect(ids).toContain('army');
    expect(ids.length).toBeGreaterThanOrEqual(2);
  });
});

describe('loadCareer', () => {
  it('loads agent career data', () => {
    const career = loadCareer('agent');
    expect(career.id).toBe('agent');
    expect(career.name).toBe('Agent');
    expect(career.qualification?.characteristic).toBe('INT');
    expect(career.qualification?.target).toBe(6);
    expect(career.assignments).toHaveLength(3);
  });

  it('loads army career data', () => {
    const career = loadCareer('army');
    expect(career.id).toBe('army');
    expect(career.name).toBe('Army');
    expect(career.qualification?.characteristic).toBe('END');
    expect(career.commission).toBeDefined();
    expect(career.commission?.characteristic).toBe('SOC');
    expect(career.commission?.target).toBe(8);
  });

  it('agent has 3 assignment-based rank tracks', () => {
    const career = loadCareer('agent');
    expect(career.ranks.type).toBe('assignment');
    expect(Object.keys(career.ranks.tracks)).toEqual(
      expect.arrayContaining(['law-enforcement', 'intelligence', 'corporate'])
    );
  });

  it('army has enlisted and officer rank tracks', () => {
    const career = loadCareer('army');
    expect(career.ranks.type).toBe('split');
    expect(career.ranks.tracks).toHaveProperty('enlisted');
    expect(career.ranks.tracks).toHaveProperty('officer');
  });

  it('agent has 6 mishaps and 11 events', () => {
    const career = loadCareer('agent');
    expect(Object.keys(career.mishaps)).toHaveLength(6);
    expect(Object.keys(career.events)).toHaveLength(11);
  });

  it('army has 6 mishaps and 11 events', () => {
    const career = loadCareer('army');
    expect(Object.keys(career.mishaps)).toHaveLength(6);
    expect(Object.keys(career.events)).toHaveLength(11);
  });

  it('army has 7 skill tables (including officer)', () => {
    const career = loadCareer('army');
    expect(career.skillTables).toHaveLength(7);
    const officerTable = career.skillTables.find(t => t.id === 'officer');
    expect(officerTable).toBeDefined();
    expect(officerTable?.restriction).toEqual({ type: 'officer' });
  });

  it('agent has no commission', () => {
    const career = loadCareer('agent');
    expect(career.commission).toBeUndefined();
  });

  it('throws on unknown career id', () => {
    expect(() => loadCareer('unknown')).toThrow();
  });
});
```

- [ ] **Step 12: Implement `src/data/career-loader.ts`**

```typescript
import type { CareerData } from '../models/career-types';
import agentData from './careers/agent.json';
import armyData from './careers/army.json';

const CAREERS: Record<string, CareerData> = {
  agent: agentData as unknown as CareerData,
  army: armyData as unknown as CareerData,
};

/**
 * Load a career by its id.
 * @throws if the career id is not found.
 */
export function loadCareer(id: string): CareerData {
  const career = CAREERS[id];
  if (!career) {
    throw new Error(`Unknown career: "${id}". Available careers: ${getAllCareerIds().join(', ')}`);
  }
  return career;
}

/** Returns all available career ids. */
export function getAllCareerIds(): string[] {
  return Object.keys(CAREERS);
}

/** Returns all available careers (non-special ones that players can choose). */
export function getSelectableCareers(): CareerData[] {
  return Object.values(CAREERS).filter(c => !c.isSpecial);
}
```

- [ ] **Step 13: Ensure `tsconfig.app.json` allows JSON imports**

Verify that `tsconfig.app.json` (created by Vite scaffold) includes `"resolveJsonModule": true` and `"esModuleInterop": true`. If not, add them under `compilerOptions`.

- [ ] **Step 14: Run all tests**

```bash
npx vitest run
```

Expected: ALL tests pass — skills (5 tests), species (2 tests), career-loader (9 tests), types (7 tests), dice (all), App (1).

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: add skills registry, species modifiers, and Agent/Army career data

- SKILLS_REGISTRY with all 39 skills and specialties
- BACKGROUND_SKILLS list of 17 chooseable background skills
- SPECIES_MODIFIERS for Human, Aslan, Vargr
- Complete Agent career JSON with effect DSL trees
- Complete Army career JSON with commission and split ranks
- career-loader with loadCareer(), getAllCareerIds(), getSelectableCareers()
- Full test coverage for data layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
