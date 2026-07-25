# Mongoose Traveller 2e Character Creator — Design Spec

**Date:** 2026-07-25  
**Status:** Approved

## Overview

A browser-based interactive character creator for Mongoose Traveller 2nd Edition, hosted on GitHub Pages. The app guides players through the full lifepath character creation process with dice rolling, branching events, and narrative storytelling — producing both a traditional character sheet and a written biography of the Traveller's life.

## Tech Stack

- **Framework:** React 18+ with Vite
- **Language:** TypeScript (strict mode)
- **Styling:** CSS with custom properties (dark theme, hexagonal motifs, chamfered headers)
- **State:** React `useReducer` + Context (no external state library)
- **Deployment:** GitHub Pages via `vite build` → `dist/`
- **Persistence:** JSON export/import (no backend, no localStorage)

## Architecture: State Machine + Effect Interpreter

### State Machine

The character creation flow is modeled as a finite state machine. Each state maps to a single UI screen. Transitions are triggered by dice rolls, player choices, or effect resolution.

**States:**

```
BACKGROUND → CHARACTERISTICS → BACKGROUND_SKILLS → TERM_START
```

At TERM_START, the machine branches:

- **Pre-career education path** (available terms 1–3 only):
  - PRE_CAREER_SELECTION → EDUCATION_ENTRY_ROLL → (fail: forced to CAREER_SELECTION) → EDUCATION_EVENTS → GRADUATION_ROLL

- **Career path:**
  - CAREER_SELECTION → QUALIFICATION_ROLL → (fail: DRAFT_OR_DRIFTER) → CAREER_ACTIVE

Once in a career for the term:
```
SURVIVAL_ROLL → (fail: MISHAP_RESOLUTION → EJECTED)
             → (pass: EVENT_ROLL → EVENT_RESOLUTION → SKILL_TRAINING
                → ADVANCEMENT_ROLL → RANK_BONUS → TERM_NARRATIVE → AGING_CHECK)
             → TERM_END_DECISION
```

From TERM_END_DECISION:
- Continue same career → CAREER_ACTIVE (no re-qualification)
- Switch career → CAREER_SELECTION (new qualification roll)
- Pre-career education → PRE_CAREER_SELECTION (terms 1-3 only)
- Muster out → MUSTERING_OUT → FINALIZE_CONTACTS → CHARACTER_SHEET

**Key design decisions:**
- Any event effect can emit a `forceTransition` that overrides the default next state (e.g., forced into Prisoner career, auto-promotion skipping advancement)
- States carry context: current career, current term, pending effects, officer status
- Sub-states exist for complex event resolution (an event may trigger a skill check → choice → nested table roll)
- Full transition history is tracked for the narrative timeline

### Effect Interpreter (DSL)

Complex events/mishaps are encoded as declarative JSON action trees. The interpreter walks the tree depth-first, pausing for player input when needed.

**Core action types:**

| Action Type | Purpose |
|---|---|
| `gainSkill` | Add or increment a skill |
| `gainSpecialty` | Add or increment a specialty |
| `modCharacteristic` | Modify STR, DEX, END, INT, EDU, or SOC |
| `gainContact` | Add an ally, contact, enemy, or rival |
| `gainBenefitDM` | +DM to a benefit roll |
| `gainAdvancementDM` | +DM to next advancement check |
| `rollOnTable` | Roll on another table (injury, life events, etc.) |
| `forceCareer` | Force entry into a specific career next term |
| `autoPromote` | Automatic promotion (skip advancement roll) |
| `ejectFromCareer` | Remove from current career |
| `loseBenefitRoll` | Lose benefit roll for this term |
| `skillCheck` | Roll skill check with success/failure branches |
| `choice` | Present player with options, each with different effects |
| `pickSkill` | Player picks one skill from a list |
| `pickOne` | Player picks one effect from options |
| `diceRoll` | Roll dice for variable amounts (e.g., D3 contacts) |
| `narrative` | Prompt for free-text flavor from the player |

**Interpreter flow:**
1. Receive action tree from current event
2. Walk depth-first
3. On `choice`, `pickSkill`, `pickOne`, or `narrative` → pause, render UI for input
4. On player response → resume with selected branch
5. Accumulate effects → apply to character state

**Table chaining:** `rollOnTable` references a table definition (itself a JSON file with entries containing action trees). Tables are infinitely nestable.

## Career Data Format

Each career is a standalone JSON file in `src/data/careers/`. Adding a new career requires no code changes — just a new JSON file following the schema.

**Schema highlights:**
- `qualification`: characteristic + target number + modifiers (or `null` for Drifter)
- `commission`: optional, for military careers (Army, Marines, Navy)
- `assignments`: array with survival/advancement rolls per assignment
- `skillTables`: 6-7 tables with optional restrictions (min EDU 8, officer only, assignment-specific)
- `ranks`: supports `enlisted`/`officer` split (military) or single `default` track
- `mishaps`: 1D6 indexed, each with action tree effects
- `events`: 2D6 indexed, each with action tree effects
- `musteringOut`: cash table + benefits table with effects
- `isSpecial`: flag for Prisoner/Psionic (cannot be player-chosen)

## Character Data Model

```typescript
interface Character {
  name: string;
  species: 'human' | 'aslan' | 'vargr';
  homeworld: string;
  backgroundNotes: string;

  characteristics: {
    STR: number; DEX: number; END: number;
    INT: number; EDU: number; SOC: number;
  };

  skills: Map<string, number>;          // "Gun Combat" → 0
  specialties: Map<string, number>;     // "Gun Combat:Slug" → 2

  age: number;
  currentTerm: number;
  careers: CareerTerm[];

  contacts: Contact[];                  // with per-contact history

  cash: number;
  benefits: string[];
  benefitDMs: number[];
  pensionPerYear: number;

  timeline: TimelineEntry[];            // append-only event log
}
```

**Contacts** have a `history[]` array tracking relationship changes over time (e.g., "friend turned rival"), with term references and player notes at each transition.

**Skills and specialties** are stored separately. `skills["Animals"] = 0` means base competency; `specialties["Animals:Handling"] = 1` means trained specialty. Incrementing a skill with specialties always increments a chosen specialty instead.

## Background Skills

Available in the BACKGROUND_SKILLS phase. Player freely picks from: Admin, Animals, Art, Athletics, Carouse, Drive, Electronics, Flyer, Language, Mechanic, Medic, Profession, Science, Seafarer, Streetwise, Survival, Vacc Suit.

Number of picks = 3 + Education DM. All gained at level 0.

## Pre-Career Education

Available terms 1–3 only. One attempt per term. Options:
- **University** — roll for entry, gain skills, roll events, attempt graduation
- **Military Academy** (Army, Marines, or Navy) — same structure

On failed entry: must immediately attempt a career (or Drifter/draft on that failure too). On success: gain noted skills, roll education events, attempt graduation for benefits. No mustering out from pre-career education.

## Qualification & Draft Rules

- Qualification roll only required when *entering* a new career (not continuing)
- On failed qualification: only two options — Drifter (no check) or submit to draft (randomly assigned a career)
- Cannot attempt another career after a failed qualification in the same term (no shopping around)
- DM-1 per previous career on qualification rolls
- Some careers have additional modifiers (e.g., Army DM-2 if aged 30+)

## UI Design

### Layout
- **Sidebar (left, fixed):** Live character summary — name, age, term, hex characteristics, career history, top skills
- **Main area (center):** Step-by-step wizard with progress indicator, current phase content, dice area, narrative text fields, and action buttons

### Visual Style (Faithful Dark)
- Dark charcoal background (#1a1a1a – #222)
- Copper/amber accent color (#c47a2a) for hex borders, highlights, skill levels
- Chamfered section headers (CSS `linear-gradient` cut corners)
- Hexagonal badges for characteristics (CSS `clip-path: polygon(...)`)
- White dice with dark pips on light backgrounds
- Success/failure feedback with green/red tinted panels
- Sans-serif typography, uppercase headers with letter-spacing
- Progress bar showing phase completion

### Success Probability Display

For any 2D6 skill/characteristic check, the app displays the percentage chance of success (rounded to nearest integer). The probability is computed from the static 2D6 distribution — the 36 possible outcomes map to cumulative "N or higher" probabilities:

| Need to roll | Probability |
|---|---|
| 2+ | 100% |
| 3+ | 97% |
| 4+ | 92% |
| 5+ | 83% |
| 6+ | 72% |
| 7+ | 58% |
| 8+ | 42% |
| 9+ | 28% |
| 10+ | 17% |
| 11+ | 8% |
| 12+ | 3% |

The effective target = base target − total DM (characteristic DM + any situational modifiers). For example, EDU 8+ with EDU DM +1 means the player needs a raw 7+, which is 58%.

This is shown via a reusable `SuccessChance` component displayed alongside any check — qualification rolls, survival rolls, advancement rolls, skill checks within events, graduation rolls, etc. Not used for random result tables (mishap/event rolls) since those aren't pass/fail.

For tiered outcomes (e.g., university graduation vs. graduation with honors), the component shows two separate probabilities stacked: "Graduate: 72%" and "With Honors: 42%".

### Key Components
- `SuccessChance` — displays percentage chance of success for 2D6 checks, with optional tiered outcomes
- `HexBadge` — hexagonal characteristic display with value + DM
- `ChamferedHeader` — angled section headers
- `DiceRoller` — 3D CSS dice (ported from existing Svelte component) with spin → settle animation
- `SkillPicker` — multi-select from filtered skill list
- `ChoicePanel` — presents branching options from events
- `NarrativeField` — text area for player flavor text with contextual prompts
- `ContactCard` — displays contact with relationship history
- `TimelineView` — chronological career history for the narrative tab

### Dice Roller
Ported from existing Svelte `Dice3d.svelte` component. Uses:
- CSS `transform-style: preserve-3d` with 6 faces
- `requestAnimationFrame` spin loop with random speeds
- Settle phase via CSS transition to target face
- Pip-dot face layouts (1-6)
- React port uses `useRef` + `useEffect` instead of Svelte's `$effect`

## Final Output

### Character Sheet View
- Characteristics with DMs in hexes
- Full skill list with levels (sorted by level descending)
- Career history table
- Contacts grouped by category
- Finances and equipment

### Narrative Biography View
- Generated from timeline + player narrative notes
- Structured by life phase: Early Life → Education → Career terms
- Each term combines mechanical events with player flavor text
- Contact stories woven in chronologically
- Closing capabilities summary: notable skills described in practical terms, extreme characteristics called out

**Skill level descriptions:**
- Level 0: Competent, little practical experience
- Level 1: Trained professional
- Levels 2-3: Skilled professional
- Levels 4-5: Well-respected expert, potentially system-renowned

### Export
- JSON file containing full character state
- Import to view/reference (no editing in v1)

## Project Structure

```
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── ui/                    (HexBadge, ChamferedHeader, DiceRoller, etc.)
│   ├── sidebar/               (CharacterSummary)
│   ├── wizard/                (phase-specific step components)
│   └── character-sheet/       (final output views)
├── engine/
│   ├── state-machine.ts       (phase transitions, current state)
│   ├── effect-interpreter.ts  (resolves DSL action trees)
│   ├── dice.ts                (D6 rolling utilities)
│   └── character.ts           (character mutation logic)
├── data/
│   ├── careers/               (JSON career files)
│   ├── skills.ts              (skills + specialties registry)
│   └── species.ts             (species modifiers)
├── models/
│   └── types.ts               (TypeScript interfaces)
├── hooks/                     (useStateMachine, useDiceRoll, etc.)
└── theme/                     (CSS variables, hex motif styles)
```

## Scope

### In scope (v1)
- Full creation wizard with all phases
- Pre-career education (University, Military Academy)
- State machine with forced transitions
- Effect DSL interpreter with branching, nesting, player input
- 3D dice roller
- Sidebar live summary
- Narrative text fields throughout
- Contact tracking with relationship history
- Final character sheet + narrative biography
- JSON export/import
- Agent and Army careers
- Species: Human, Aslan, Vargr
- GitHub Pages deployment
- Faithful Dark theme

### Out of scope (future)
- Remaining 10 core careers (added as JSON later)
- PDF export
- Psionic/Prisoner career data (forced-entry mechanics exist, data TBD)
- Equipment/weapon detail lookups
- Multi-character management
- Sound effects
- Mobile-optimized layout
- Aging crisis table data (placeholder in state machine)
