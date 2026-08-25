# Mongoose Traveller 2e Character Creator

A browser-based character creator for the Mongoose Traveller 2nd Edition tabletop RPG, hosted on GitHub Pages.

**Live:** [https://jhkidd.github.io/MongooseTravellerCharacterGeneratorApp/](https://jhkidd.github.io/MongooseTravellerCharacterGeneratorApp/)

## Features

- **Full character creation flow** — species selection, characteristic rolling (drag-and-drop assignment), background skills, career terms, mustering out
- **Career system** — qualification rolls, basic training, survival checks, events, commission/advancement, assignment changes
- **Pre-career education** — university and military academy paths (terms 1–3)
- **Probability display** — shows success chance as a percentage for all dice checks
- **Dice animations** — 3D rolling dice with animated results
- **Dark "Faithful" theme** — hexagonal motifs, chamfered headers, sci-fi aesthetic
- **Character export** — copy-to-clipboard plain-text sheet for VTTs and documents
- **Data-driven** — careers defined as JSON with an effect DSL for easy extension

## Tech Stack

- React 19 + TypeScript
- Vite 5
- Vitest + Testing Library (417 tests)
- CSS custom properties (no framework)
- GitHub Pages via GitHub Actions

## Getting Started

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run test      # Run test suite
```

## Project Structure

```
src/
├── components/     # UI components (wizard steps, shared, ui primitives)
├── context/        # React Context (character state)
├── data/           # Career JSON, skills registry, species
├── engine/         # Dice, state machine, character reducer, effect interpreter
├── hooks/          # useWizard
├── models/         # TypeScript types
└── theme/          # CSS variables
```

## Reusable Components

Before creating new components, check whether one of these already covers your use case.

### UI Primitives (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `ChamferedHeader` | Styled section header with angled/chamfered corners |
| `Dice3D` | Single 3D animated die |
| `DiceGroup` | Renders multiple `Dice3D` together |
| `DiceCheckRoll` | Full skill/characteristic check UI (roll button, DMs, pass/fail result) |
| `HexBadge` | Hexagonal badge for displaying characteristic scores |
| `SuccessChance` | Displays probability percentage for a given target number |

### Shared Components (`components/shared/`)

| Component | Purpose |
|-----------|---------|
| `EffectResolver` | Master effect handler - interprets the effect DSL, routes to sub-resolvers, chains compound/interactive effects |
| `ChoicePanel` | Renders a list of labelled options for the player to pick from |
| `SkillPicker` | Multi-select skill list with toggle buttons |
| `NarrativeField` | Freeform text area for narrative/roleplay input |

`EffectResolver` also contains internal sub-resolvers (ChoiceResolver, PickSkillResolver, SkillCheckResolver, PickOneResolver, NarrativeResolver, GainContactResolver, FallbackResolver) which handle specific effect types but are not exported individually.

## Deployment

Push to `main` triggers automatic deployment to GitHub Pages via `.github/workflows/deploy.yml`.

## License

Personal project — not for redistribution.
