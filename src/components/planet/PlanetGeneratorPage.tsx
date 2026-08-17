import { useState } from 'react';
import { BackToHomeLink } from '../home/BackToHomeLink';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { HexBadge } from '../ui/HexBadge/HexBadge';
import { generatePlanet, formatUwp, getTravelZoneReasons } from '../../engine/planet-generator';
import {
  SIZE_DESCRIPTIONS,
  ATMOSPHERE_DESCRIPTIONS,
  HYDROGRAPHICS_DESCRIPTIONS,
  POPULATION_DESCRIPTIONS,
  TEMPERATURE_BANDS,
  GOVERNMENT_TYPES,
  STARPORT_INFO,
  getLawLevelInfo,
  getTemperatureBandIndex,
  getFactionStrengthLabel,
} from '../../data/planet-tables';
import type { Planet } from '../../models/planet';
import './PlanetGeneratorPage.css';

const NAME_SYLLABLES = [
  'co', 'gri', 'sha', 'lek', 'tor', 'ven', 'mira', 'dun', 'zol', 'ath',
  'bre', 'kai', 'nor', 'rus', 'vel', 'pax', 'quin', 'sol', 'tera', 'wyn',
];

function randomName(): string {
  const parts = 2 + Math.floor(Math.random() * 2);
  let name = '';
  for (let i = 0; i < parts; i++) {
    name += NAME_SYLLABLES[Math.floor(Math.random() * NAME_SYLLABLES.length)];
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function randomHexLocation(): string {
  return String(Math.floor(Math.random() * 4000) + 1).padStart(4, '0');
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Clipboard copy failed.');
  }
}

type CopyState = 'idle' | 'success' | 'error';

export function PlanetGeneratorPage() {
  const [name, setName] = useState('');
  const [hexLocation, setHexLocation] = useState('');
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  function handleRandomizeIdentity() {
    setName(randomName());
    setHexLocation(randomHexLocation());
  }

  function handleGenerate() {
    setPlanet(generatePlanet(name, hexLocation));
    setCopyState('idle');
  }

  async function handleCopyToClipboard() {
    if (!planet) return;
    try {
      await copyTextToClipboard(formatUwp(planet));
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <div className="planet-generator-page">
      <BackToHomeLink />

      <div className="planet-generator-page__hero">
        <div className="planet-generator-page__hero-copy">
          <p className="planet-generator-page__eyebrow">Universal World Profile</p>
          <ChamferedHeader level={1}>Planet Generator</ChamferedHeader>
          <p className="planet-generator-page__subtitle">
            Roll up a single world, the most important and most travelled in its system, per the
            Mongoose Traveller 2e world creation rules.
          </p>
        </div>

        <div className="planet-generator-page__identity-form">
          <label className="planet-generator-page__field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Unnamed"
            />
          </label>
          <label className="planet-generator-page__field">
            <span>Sector Location</span>
            <input
              type="text"
              value={hexLocation}
              onChange={(e) => setHexLocation(e.target.value)}
              placeholder="0000"
            />
          </label>
          <div className="planet-generator-page__form-actions">
            <button
              type="button"
              className="planet-generator-page__button planet-generator-page__button--secondary"
              onClick={handleRandomizeIdentity}
            >
              Randomize Name
            </button>
            <button
              type="button"
              className="planet-generator-page__button"
              onClick={handleGenerate}
            >
              {planet ? 'Generate Another' : 'Generate Planet'}
            </button>
          </div>
        </div>
      </div>

      {planet ? (
        <PlanetResults planet={planet} copyState={copyState} onCopy={() => { void handleCopyToClipboard(); }} />
      ) : (
        <p className="planet-generator-page__empty-state">No world generated yet. Click Generate Planet to roll one up.</p>
      )}
    </div>
  );
}

function PlanetResults({ planet, copyState, onCopy }: { planet: Planet; copyState: CopyState; onCopy: () => void }) {
  const temperatureBand = TEMPERATURE_BANDS[getTemperatureBandIndex(planet.temperature)];
  const government = GOVERNMENT_TYPES[planet.government];
  const lawLevelInfo = getLawLevelInfo(planet.lawLevel);
  const starportInfo = STARPORT_INFO[planet.starport];
  const baseChips = [
    planet.bases.highport && 'Highport',
    planet.bases.scout && 'Scout Base',
    planet.bases.naval && 'Naval Base',
    planet.bases.military && 'Military Base',
    planet.bases.corsair && 'Corsair Base',
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className="planet-generator-page__grid">
      <section className="planet-generator-page__section planet-generator-page__section--overview">
        <ChamferedHeader level={3}>Overview</ChamferedHeader>
        <div className="planet-generator-page__uwp-row">
          <code className="planet-generator-page__uwp-string">{formatUwp(planet)}</code>
          <button type="button" className="planet-generator-page__button planet-generator-page__button--secondary" onClick={onCopy}>
            Copy UWP
          </button>
          <div className="planet-generator-page__overview-chips">
            <span className="planet-generator-page__chip">{planet.hasGasGiant ? 'Gas Giant' : 'No Gas Giant'}</span>
            <span className="planet-generator-page__chip planet-generator-page__chip--travelzone">
              {planet.travelZone ? `${planet.travelZone} Zone` : 'Green Zone'}
            </span>
          </div>
        </div>
        {copyState === 'success' && <span className="planet-generator-page__copy-status planet-generator-page__copy-status--success">Copied to clipboard.</span>}
        {copyState === 'error' && <span className="planet-generator-page__copy-status planet-generator-page__copy-status--error">Copy failed. Please try again.</span>}
      </section>

      <section className="planet-generator-page__section planet-generator-page__section--physical">
        <ChamferedHeader level={3}>Physical</ChamferedHeader>
        <div className="planet-generator-page__stat-grid">
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.size.toString(16).toUpperCase()} label="Size" size="lg" />
            <p>{SIZE_DESCRIPTIONS[planet.size]}</p>
          </div>
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.atmosphere.toString(16).toUpperCase()} label="Atm" size="lg" />
            <p>{ATMOSPHERE_DESCRIPTIONS[planet.atmosphere]}</p>
          </div>
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.hydrographics.toString(16).toUpperCase()} label="Hydro" size="lg" />
            <p>{HYDROGRAPHICS_DESCRIPTIONS[planet.hydrographics]}</p>
          </div>
        </div>
        <div className="planet-generator-page__temperature">
          <span className="planet-generator-page__temperature-label">Temperature: {temperatureBand.label}</span>
          <p>{temperatureBand.description}</p>
        </div>
      </section>

      <section className="planet-generator-page__section planet-generator-page__section--society">
        <ChamferedHeader level={3}>Society</ChamferedHeader>
        <div className="planet-generator-page__stat-grid planet-generator-page__stat-grid--society">
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.population.toString(16).toUpperCase()} label="Pop" size="lg" />
            <p>{POPULATION_DESCRIPTIONS[planet.population]}</p>
          </div>
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.government.toString(16).toUpperCase()} label="Gov" size="lg" />
            <p><strong>{government.name}</strong>: {government.description}</p>
          </div>
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.lawLevel.toString(16).toUpperCase()} label="Law" size="lg" />
            <p>Weapons banned: {lawLevelInfo.weaponsBanned}</p>
            <p>Armour banned: {lawLevelInfo.armourBanned}</p>
          </div>
          <div className="planet-generator-page__stat-block">
            <HexBadge value={planet.techLevel.toString(16).toUpperCase()} label="Tech" size="lg" />
            <p>Tech Level {planet.techLevel}</p>
          </div>
        </div>
      </section>

      <section className="planet-generator-page__section planet-generator-page__section--starport">
        <ChamferedHeader level={3}>Starport &amp; Bases</ChamferedHeader>
        <div className="planet-generator-page__starport-summary">
          <span className="planet-generator-page__starport-class">Class {planet.starport}</span>
          <span>{starportInfo.quality}</span>
        </div>
        <ul className="planet-generator-page__fact-list">
          <li>Berthing cost: {starportInfo.berthingCost}</li>
          <li>Fuel: {starportInfo.fuel}</li>
          <li>Facilities: {starportInfo.facilities}</li>
        </ul>
        {baseChips.length > 0 ? (
          <div className="planet-generator-page__chip-row">
            {baseChips.map((chip) => (
              <span key={chip} className="planet-generator-page__chip">{chip}</span>
            ))}
          </div>
        ) : (
          <p className="planet-generator-page__empty-state">No additional bases present.</p>
        )}
      </section>

      <section className="planet-generator-page__section planet-generator-page__section--trade">
        <ChamferedHeader level={3}>Trade Codes &amp; Travel Zone</ChamferedHeader>
        {planet.tradeCodes.length > 0 ? (
          <div className="planet-generator-page__chip-row">
            {planet.tradeCodes.map((tc) => (
              <span key={tc.code} className="planet-generator-page__chip" title={tc.name}>{tc.code} - {tc.name}</span>
            ))}
          </div>
        ) : (
          <p className="planet-generator-page__empty-state">No trade code classifications.</p>
        )}
        <p className="planet-generator-page__travel-zone">
          {planet.travelZone
            ? `${planet.travelZone} Zone advisory: ${getTravelZoneReasons(planet.atmosphere, planet.government, planet.lawLevel).join(', ')}.`
            : 'Green Zone - no travel advisory.'}
        </p>
      </section>

      {planet.factions.length > 0 && (
        <section className="planet-generator-page__section planet-generator-page__section--factions">
          <ChamferedHeader level={3}>Rival Factions</ChamferedHeader>
          <ul className="planet-generator-page__fact-list">
            {planet.factions.map((faction, index) => (
              <li key={index}>
                <strong>{GOVERNMENT_TYPES[faction.government].name}</strong> - {getFactionStrengthLabel(faction.strength)} (strength {faction.strength})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
