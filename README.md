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
- Vitest + Testing Library (238 tests)
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

## Deployment

Push to `main` triggers automatic deployment to GitHub Pages via `.github/workflows/deploy.yml`.

## License

Personal project — not for redistribution.
