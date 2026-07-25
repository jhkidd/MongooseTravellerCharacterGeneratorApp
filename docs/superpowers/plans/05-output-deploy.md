# Phase 5: Output & Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the final character sheet view, narrative biography generator, JSON export/import functionality, and deploy the app to GitHub Pages.

**Architecture:** The character sheet and narrative biography are read-only views rendered from the completed `Character` state. The sheet uses the same UI primitives (HexBadge, ChamferedHeader) for visual consistency. The narrative generator walks the character's timeline + career history + contacts to produce a structured life story. Export produces a JSON file; import reads one back to display (read-only in v1). GitHub Pages deployment uses `vite build` → `dist/` with a GitHub Actions workflow.

**Tech Stack:** React 18, TypeScript (strict), Vitest + React Testing Library, Vite build, GitHub Pages

## Global Constraints

- TypeScript strict mode
- No CSS framework — CSS custom properties from `src/theme/variables.css`
- JSON export format must include the full `Character` interface
- Import is read-only in v1 — no editing imported characters
- GitHub Pages base path must be set in `vite.config.ts`
- **ASK THE USER** about the repository name for the correct GitHub Pages base path

## File Structure Map

```
src/components/
├── character-sheet/
│   ├── CharacterSheet.tsx         Full character sheet view
│   ├── CharacterSheet.css
│   ├── NarrativeBiography.tsx     Generated life story
│   ├── NarrativeBiography.css
│   ├── ContactCard.tsx            Individual contact display
│   ├── ContactCard.css
│   └── __tests__/
│       ├── CharacterSheet.test.tsx
│       └── NarrativeBiography.test.tsx
├── shared/
│   ├── ExportImport.tsx           JSON export/import buttons
│   └── __tests__/
│       └── ExportImport.test.tsx
.github/
└── workflows/
    └── deploy.yml                 GitHub Pages deployment workflow
vite.config.ts                     Updated: base path for GitHub Pages
```

---

## Task 1: Character Sheet & Narrative Biography

**Files:**
- Create: `src/components/character-sheet/CharacterSheet.tsx`, `src/components/character-sheet/CharacterSheet.css`, `src/components/character-sheet/NarrativeBiography.tsx`, `src/components/character-sheet/NarrativeBiography.css`, `src/components/character-sheet/ContactCard.tsx`, `src/components/character-sheet/ContactCard.css`
- Test: `src/components/character-sheet/__tests__/CharacterSheet.test.tsx`, `src/components/character-sheet/__tests__/NarrativeBiography.test.tsx`

**Interfaces:**
- Consumes:
  - `useCharacter()` from `src/context/CharacterContext.tsx`
  - `HexBadge` from `src/components/ui/HexBadge/HexBadge.tsx`
  - `ChamferedHeader` from `src/components/ui/ChamferedHeader/ChamferedHeader.tsx`
  - `getDM()` from `src/engine/dice.ts`
  - `Character`, `CharacteristicName`, `Contact`, `TimelineEntry` from `src/models/types.ts`
- Produces:
  - `CharacterSheet` component: `() => JSX.Element`
  - `NarrativeBiography` component: `({ character: Character }) => JSX.Element`
  - `ContactCard` component: `({ contact: Contact }) => JSX.Element`

- [ ] **Step 1: Write ContactCard**

Create `src/components/character-sheet/ContactCard.css`:

```css
.contact-card {
  background: var(--color-bg-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
}

.contact-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.contact-card__name {
  font-weight: 700;
  color: var(--color-text-primary);
}

.contact-card__type {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.contact-card__type--ally {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.contact-card__type--contact {
  background: var(--color-bg-elevated);
  color: var(--color-accent-light);
  border: 1px solid var(--color-accent-dim);
}

.contact-card__type--rival {
  background: #2a2a1a;
  color: #bfbf6a;
  border: 1px solid #4a4a2a;
}

.contact-card__type--enemy {
  background: var(--color-failure-bg);
  color: var(--color-failure-text);
  border: 1px solid var(--color-failure-border);
}

.contact-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.contact-card__history {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.contact-card__history-entry {
  padding-left: var(--space-sm);
  border-left: 2px solid var(--color-border);
  margin-bottom: var(--space-xs);
}
```

Create `src/components/character-sheet/ContactCard.tsx`:

```tsx
import type { Contact } from '../../models/types';
import './ContactCard.css';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="contact-card">
      <div className="contact-card__header">
        <span className="contact-card__name">{contact.name || 'Unnamed Contact'}</span>
        <span className={`contact-card__type contact-card__type--${contact.type}`}>
          {contact.type}
        </span>
      </div>
      {contact.description && (
        <div className="contact-card__description">{contact.description}</div>
      )}
      {contact.history.length > 0 && (
        <div className="contact-card__history">
          {contact.history.map((entry, i) => (
            <div key={i} className="contact-card__history-entry">
              Term {entry.term}: {entry.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write CharacterSheet tests**

Create `src/components/character-sheet/__tests__/CharacterSheet.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { CharacterSheet } from '../CharacterSheet';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider() {
  return render(
    <CharacterProvider>
      <CharacterSheet />
    </CharacterProvider>
  );
}

describe('CharacterSheet', () => {
  it('renders the character sheet heading', () => {
    renderWithProvider();
    expect(screen.getByText(/character sheet/i)).toBeInTheDocument();
  });

  it('displays all six characteristic labels', () => {
    renderWithProvider();
    ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('shows the age', () => {
    renderWithProvider();
    expect(screen.getByText(/age/i)).toBeInTheDocument();
  });

  it('has a tab for narrative biography', () => {
    renderWithProvider();
    expect(screen.getByText(/biography/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Implement CharacterSheet**

Create `src/components/character-sheet/CharacterSheet.css`:

```css
.character-sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.character-sheet__tabs {
  display: flex;
  gap: var(--space-xs);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--space-xs);
}

.character-sheet__tab {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  padding: var(--space-xs) var(--space-md);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.character-sheet__tab--active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.character-sheet__header {
  text-align: center;
}

.character-sheet__name {
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}

.character-sheet__subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.character-sheet__characteristics {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.character-sheet__section {
  margin-bottom: var(--space-lg);
}

.character-sheet__skills-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-xs);
}

.character-sheet__skill-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg-surface);
  border-radius: var(--radius-sm);
}

.character-sheet__skill-name {
  color: var(--color-text-primary);
}

.character-sheet__skill-level {
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-weight: 700;
}

.character-sheet__contacts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

.character-sheet__careers-table {
  width: 100%;
  border-collapse: collapse;
}

.character-sheet__careers-table th,
.character-sheet__careers-table td {
  text-align: left;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.character-sheet__careers-table th {
  color: var(--color-accent);
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
}

.character-sheet__finances {
  display: flex;
  gap: var(--space-xl);
}

.character-sheet__finance-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.character-sheet__finance-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.character-sheet__finance-value {
  font-size: var(--text-xl);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
}

.character-sheet__export-area {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
}
```

Create `src/components/character-sheet/CharacterSheet.tsx`:

```tsx
import { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import { HexBadge } from '../ui/HexBadge/HexBadge';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { ContactCard } from './ContactCard';
import { NarrativeBiography } from './NarrativeBiography';
import { ExportImport } from '../shared/ExportImport';
import type { CharacteristicName } from '../../models/types';
import './CharacterSheet.css';

const CHARS: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];

type Tab = 'sheet' | 'biography';

export function CharacterSheet() {
  const { character } = useCharacter();
  const [activeTab, setActiveTab] = useState<Tab>('sheet');

  // Sort skills by level descending
  const allSkills = [
    ...Object.entries(character.skills).map(([name, level]) => ({ name, level })),
    ...Object.entries(character.specialties).map(([key, level]) => {
      const [skill, specialty] = key.split(':');
      return { name: `${skill} (${specialty})`, level };
    }),
  ].sort((a, b) => b.level - a.level);

  // Group contacts by type
  const contactsByType = {
    ally: character.contacts.filter((c) => c.type === 'ally'),
    contact: character.contacts.filter((c) => c.type === 'contact'),
    rival: character.contacts.filter((c) => c.type === 'rival'),
    enemy: character.contacts.filter((c) => c.type === 'enemy'),
  };

  return (
    <div className="character-sheet">
      <ChamferedHeader level={1}>Character Sheet</ChamferedHeader>

      <div className="character-sheet__tabs">
        <button
          className={`character-sheet__tab ${activeTab === 'sheet' ? 'character-sheet__tab--active' : ''}`}
          onClick={() => setActiveTab('sheet')}
        >
          Sheet
        </button>
        <button
          className={`character-sheet__tab ${activeTab === 'biography' ? 'character-sheet__tab--active' : ''}`}
          onClick={() => setActiveTab('biography')}
        >
          Biography
        </button>
      </div>

      {activeTab === 'biography' ? (
        <NarrativeBiography character={character} />
      ) : (
        <>
          <div className="character-sheet__header">
            <div className="character-sheet__name">
              {character.name || 'Unnamed Traveller'}
            </div>
            <div className="character-sheet__subtitle">
              {character.species.charAt(0).toUpperCase() + character.species.slice(1)} — Age {character.age} — {character.careers.length} term{character.careers.length !== 1 ? 's' : ''} of service
            </div>
          </div>

          <div className="character-sheet__characteristics">
            {CHARS.map((name) => (
              <HexBadge
                key={name}
                value={character.characteristics[name]}
                label={name}
                dm={getDM(character.characteristics[name])}
                size="lg"
              />
            ))}
          </div>

          <div className="character-sheet__section">
            <ChamferedHeader level={2}>Skills</ChamferedHeader>
            <div className="character-sheet__skills-list">
              {allSkills.map(({ name, level }) => (
                <div key={name} className="character-sheet__skill-item">
                  <span className="character-sheet__skill-name">{name}</span>
                  <span className="character-sheet__skill-level">{level}</span>
                </div>
              ))}
            </div>
          </div>

          {character.careers.length > 0 && (
            <div className="character-sheet__section">
              <ChamferedHeader level={2}>Career History</ChamferedHeader>
              <table className="character-sheet__careers-table">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Career</th>
                    <th>Assignment</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {character.careers.map((ct, i) => (
                    <tr key={i}>
                      <td>{ct.term}</td>
                      <td>{ct.career}</td>
                      <td>{ct.assignment ?? '—'}</td>
                      <td>{ct.rankTitle || `Rank ${ct.rank}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {character.contacts.length > 0 && (
            <div className="character-sheet__section">
              <ChamferedHeader level={2}>Contacts</ChamferedHeader>
              {Object.entries(contactsByType).map(([type, contacts]) =>
                contacts.length > 0 ? (
                  <div key={type}>
                    <h3 style={{ textTransform: 'capitalize', marginBottom: '8px' }}>{type}s</h3>
                    <div className="character-sheet__contacts">
                      {contacts.map((c) => (
                        <ContactCard key={c.id} contact={c} />
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}

          <div className="character-sheet__section">
            <ChamferedHeader level={2}>Finances & Equipment</ChamferedHeader>
            <div className="character-sheet__finances">
              <div className="character-sheet__finance-item">
                <span className="character-sheet__finance-label">Cash</span>
                <span className="character-sheet__finance-value">
                  Cr{character.cash.toLocaleString()}
                </span>
              </div>
              {character.pensionPerYear > 0 && (
                <div className="character-sheet__finance-item">
                  <span className="character-sheet__finance-label">Pension / Year</span>
                  <span className="character-sheet__finance-value">
                    Cr{character.pensionPerYear.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {character.benefits.length > 0 && (
              <ul>
                {character.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="character-sheet__export-area">
            <ExportImport />
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write NarrativeBiography tests**

Create `src/components/character-sheet/__tests__/NarrativeBiography.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { NarrativeBiography } from '../NarrativeBiography';
import { createBlankCharacter } from '../../../models/types';
import type { Character } from '../../../models/types';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    ...createBlankCharacter(),
    name: 'Marcus Cole',
    species: 'human',
    homeworld: 'Regina',
    age: 34,
    ...overrides,
  };
}

describe('NarrativeBiography', () => {
  it('renders the character name in the opening', () => {
    render(<NarrativeBiography character={makeCharacter()} />);
    expect(screen.getByText(/Marcus Cole/)).toBeInTheDocument();
  });

  it('mentions the homeworld', () => {
    render(<NarrativeBiography character={makeCharacter()} />);
    expect(screen.getByText(/Regina/)).toBeInTheDocument();
  });

  it('includes career history if present', () => {
    render(
      <NarrativeBiography
        character={makeCharacter({
          careers: [{
            term: 1,
            career: 'army',
            assignment: 'infantry',
            rank: 1,
            rankTitle: 'Lance Corporal',
            commissioned: false,
            events: ['Survived a border skirmish'],
            survived: true,
            advanced: true,
          }],
        })}
      />
    );
    expect(screen.getByText(/army/i)).toBeInTheDocument();
  });

  it('renders a closing capabilities section', () => {
    render(<NarrativeBiography character={makeCharacter({ skills: { Recon: 3, Stealth: 2 } })} />);
    expect(screen.getByText(/capabilities/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Implement NarrativeBiography**

Create `src/components/character-sheet/NarrativeBiography.css`:

```css
.narrative-biography {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  line-height: 1.8;
  max-width: 700px;
}

.narrative-biography__section {
  margin-bottom: var(--space-md);
}

.narrative-biography__section h3 {
  color: var(--color-accent);
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: var(--text-base);
}

.narrative-biography__paragraph {
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.narrative-biography__highlight {
  color: var(--color-accent-light);
  font-weight: 600;
}

.narrative-biography__user-note {
  font-style: italic;
  color: var(--color-text-secondary);
  border-left: 2px solid var(--color-accent-dim);
  padding-left: var(--space-sm);
  margin: var(--space-sm) 0;
}
```

Create `src/components/character-sheet/NarrativeBiography.tsx`:

```tsx
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import type { Character } from '../../models/types';
import './NarrativeBiography.css';

interface NarrativeBiographyProps {
  character: Character;
}

/** Map skill levels to descriptive phrases. */
function describeSkillLevel(level: number): string {
  if (level === 0) return 'competent, with little practical experience';
  if (level === 1) return 'a trained professional';
  if (level <= 3) return 'a skilled professional';
  return 'a well-respected expert, potentially system-renowned';
}

export function NarrativeBiography({ character }: NarrativeBiographyProps) {
  const speciesLabel = character.species.charAt(0).toUpperCase() + character.species.slice(1);

  // Find notable skills (level 2+)
  const notableSkills = Object.entries(character.skills)
    .filter(([, level]) => level >= 2)
    .sort(([, a], [, b]) => b - a);

  // Find extreme characteristics
  const extremeChars = Object.entries(character.characteristics)
    .filter(([, val]) => val >= 10 || val <= 4)
    .map(([name, val]) => ({
      name,
      val,
      desc: val >= 10 ? 'exceptionally high' : 'notably low',
    }));

  return (
    <div className="narrative-biography">
      <ChamferedHeader level={2}>Biography</ChamferedHeader>

      <div className="narrative-biography__section">
        <h3>Early Life</h3>
        <p className="narrative-biography__paragraph">
          <span className="narrative-biography__highlight">{character.name}</span> is
          a {speciesLabel} born on {character.homeworld || 'an unknown world'}.
          {character.backgroundNotes && (
            <span className="narrative-biography__user-note">
              {' '}{character.backgroundNotes}
            </span>
          )}
        </p>
      </div>

      {character.careers.length > 0 && (
        <div className="narrative-biography__section">
          <h3>Career</h3>
          {character.careers.map((ct, i) => (
            <p key={i} className="narrative-biography__paragraph">
              At age {18 + ct.term * 4 - 4}, {character.name}{' '}
              {i === 0 ? 'began' : 'continued'} a career as{' '}
              <span className="narrative-biography__highlight">
                {ct.career}{ct.assignment ? ` (${ct.assignment})` : ''}
              </span>
              {ct.rankTitle ? `, achieving the rank of ${ct.rankTitle}` : ''}.
              {ct.events.length > 0 && (
                <> During this term: {ct.events.join('. ')}.</>
              )}
              {!ct.survived && ' This term ended prematurely due to a mishap.'}
            </p>
          ))}
        </div>
      )}

      {character.contacts.length > 0 && (
        <div className="narrative-biography__section">
          <h3>Connections</h3>
          {character.contacts.map((c) => (
            <p key={c.id} className="narrative-biography__paragraph">
              {c.name || 'An unnamed individual'} — {c.type}.
              {c.description && ` ${c.description}`}
              {c.history.length > 0 && c.history.map((h, i) => (
                <span key={i} className="narrative-biography__user-note">
                  {' '}(Term {h.term}: {h.description})
                </span>
              ))}
            </p>
          ))}
        </div>
      )}

      <div className="narrative-biography__section">
        <h3>Capabilities</h3>
        {extremeChars.length > 0 && (
          <p className="narrative-biography__paragraph">
            Physically, {character.name} has{' '}
            {extremeChars.map((c, i) => (
              <span key={c.name}>
                {i > 0 ? ', and ' : ''}
                {c.desc} {c.name} ({c.val})
              </span>
            ))}.
          </p>
        )}
        {notableSkills.length > 0 ? (
          <p className="narrative-biography__paragraph">
            In terms of training, {character.name} is{' '}
            {notableSkills.map(([skill, level], i) => (
              <span key={skill}>
                {i > 0 ? '; ' : ''}
                {describeSkillLevel(level)} in {skill} (level {level})
              </span>
            ))}.
          </p>
        ) : (
          <p className="narrative-biography__paragraph">
            {character.name} has broad foundational training but no deep specialization yet.
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run character sheet tests**

```bash
npx vitest run src/components/character-sheet/
```

Expected: PASS — all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/character-sheet/
git commit -m "feat: add character sheet and narrative biography views

- CharacterSheet: tabbed view with characteristics (HexBadge),
  skills list, career history table, contacts by type, finances
- NarrativeBiography: generated life story from timeline,
  career history, contacts, and player notes
- ContactCard: displays contact with type badge and history
- Skill level descriptions for narrative flavor

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: JSON Export/Import & GitHub Pages Deployment

**Files:**
- Create: `src/components/shared/ExportImport.tsx`
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts` (add base path)
- Test: `src/components/shared/__tests__/ExportImport.test.tsx`

**Interfaces:**
- Consumes:
  - `useCharacter()` from `src/context/CharacterContext.tsx`
  - `Character` from `src/models/types.ts`
- Produces:
  - `ExportImport` component: `() => JSX.Element`
  - `exportCharacter(character: Character): void` (triggers file download)
  - GitHub Pages deployment workflow

- [ ] **Step 1: Write ExportImport tests**

Create `src/components/shared/__tests__/ExportImport.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { ExportImport } from '../ExportImport';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider() {
  return render(
    <CharacterProvider>
      <ExportImport />
    </CharacterProvider>
  );
}

describe('ExportImport', () => {
  it('renders an Export button', () => {
    renderWithProvider();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('renders an Import button/label', () => {
    renderWithProvider();
    expect(screen.getByText(/import/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement ExportImport**

Create `src/components/shared/ExportImport.tsx`:

```tsx
import { useRef } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import type { Character } from '../../models/types';

function exportCharacter(character: Character) {
  const json = JSON.stringify(character, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${character.name || 'traveller'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportImport() {
  const { character } = useCharacter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    exportCharacter(character);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string) as Character;
        // For v1, import is read-only — just log it
        // In a future version, this would load the character into context
        console.log('Imported character:', imported.name);
        alert(`Imported character: ${imported.name}. (Read-only view coming soon.)`);
      } catch {
        alert('Failed to parse character file. Please ensure it is a valid JSON export.');
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-imported
    e.target.value = '';
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button
        onClick={handleExport}
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-bg-primary)',
          border: 'none',
          padding: '8px 20px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 700,
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        Export JSON
      </button>
      <button
        onClick={handleImportClick}
        style={{
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          padding: '8px 20px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        Import JSON
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run ExportImport tests**

```bash
npx vitest run src/components/shared/__tests__/ExportImport.test.tsx
```

Expected: PASS — both tests pass.

- [ ] **Step 4: Update vite.config.ts for GitHub Pages base path**

**ASK USER:** What is the repository name? The base path needs to match: `/<repo-name>/`.

Modify `vite.config.ts`:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ASK USER: replace with actual repo name for GitHub Pages
  base: '/MongooseTravellerCharacterGeneratorApp/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
});
```

- [ ] **Step 5: Create GitHub Actions deployment workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npx vitest run

      - name: Build
        run: npx vite build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Test the build**

```bash
npx vite build
```

Expected: Build succeeds, output in `dist/`. Verify `dist/index.html` exists.

- [ ] **Step 7: Run all tests one final time**

```bash
npx vitest run
```

Expected: ALL tests across all phases pass.

- [ ] **Step 8: Commit and push**

```bash
git add src/components/shared/ExportImport.tsx src/components/shared/__tests__/ExportImport.test.tsx vite.config.ts .github/workflows/deploy.yml
git commit -m "feat: add JSON export/import and GitHub Pages deployment

- ExportImport: download character as JSON, import from file
  (read-only in v1)
- Vite base path configured for GitHub Pages
- GitHub Actions workflow: test → build → deploy on push to main
- Full deployment pipeline ready

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

```bash
git push origin main
```

After push, GitHub Actions will deploy to: `https://<username>.github.io/MongooseTravellerCharacterGeneratorApp/`
