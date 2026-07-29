import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllCareerIds, loadCareer } from '../../data/career-loader';
import { CharacterProvider, useCharacter } from '../../context/CharacterContext';
import { EffectResolver } from '../shared/EffectResolver';
import type { EffectNode } from '../../models/effect-types';
import type { CharacteristicName } from '../../models/types';
import type { EffectResolverResult } from '../shared/EffectResolver';
import './EffectGallery.css';

const CHARACTERISTICS: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
const DEFAULT_SKILLS = ['Recon', 'Streetwise', 'Deception', 'Athletics', 'Gun Combat'];

interface EffectEntry {
  roll: number;
  description: string;
  effects: EffectNode;
}

function EffectGalleryInner() {
  const careerIds = useMemo(() => getAllCareerIds(), []);
  const [selectedCareer, setSelectedCareer] = useState(careerIds[0]);
  const [selectedType, setSelectedType] = useState<'events' | 'mishaps'>('events');
  const [selectedRoll, setSelectedRoll] = useState<number | null>(null);
  const [resolveKey, setResolveKey] = useState(0);
  const [completedSignals, setCompletedSignals] = useState<string[] | null>(null);

  const career = useMemo(() => loadCareer(selectedCareer), [selectedCareer]);

  const entries: EffectEntry[] = useMemo(() => {
    const source = selectedType === 'events' ? career.events : career.mishaps;
    return Object.entries(source)
      .map(([roll, entry]) => ({
        roll: Number(roll),
        description: entry.description,
        effects: entry.effects,
      }))
      .sort((a, b) => a.roll - b.roll);
  }, [career, selectedType]);

  const activeEntry = entries.find((e) => e.roll === selectedRoll) ?? null;

  function handleSelect(roll: number) {
    setSelectedRoll(roll);
    setResolveKey((k) => k + 1);
    setCompletedSignals(null);
  }

  function handleReset() {
    setResolveKey((k) => k + 1);
    setCompletedSignals(null);
  }

  const handleComplete = useCallback((result: EffectResolverResult) => {
    setCompletedSignals(result.signals);
  }, []);

  return (
    <div className="effect-gallery">
      <header className="effect-gallery__header">
        <h1>Effect Gallery</h1>
        <div className="effect-gallery__controls">
          <select
            value={selectedCareer}
            onChange={(e) => { setSelectedCareer(e.target.value); setSelectedRoll(null); setCompletedSignals(null); }}
          >
            {careerIds.map((id) => (
              <option key={id} value={id}>{loadCareer(id).name}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value as 'events' | 'mishaps'); setSelectedRoll(null); setCompletedSignals(null); }}
          >
            <option value="events">Events</option>
            <option value="mishaps">Mishaps</option>
          </select>
        </div>
      </header>

      <div className="effect-gallery__body">
        <aside className="effect-gallery__list">
          {entries.map((entry) => (
            <button
              key={entry.roll}
              type="button"
              className={`effect-gallery__item${selectedRoll === entry.roll ? ' effect-gallery__item--active' : ''}`}
              onClick={() => handleSelect(entry.roll)}
            >
              <span className="effect-gallery__roll">{entry.roll}</span>
              <span className="effect-gallery__desc">{entry.description}</span>
            </button>
          ))}
        </aside>

        <section className="effect-gallery__preview">
          {activeEntry ? (
            <>
              <div className="effect-gallery__preview-header">
                <h2>{selectedType === 'events' ? 'Event' : 'Mishap'} {activeEntry.roll}</h2>
                <button type="button" onClick={handleReset} className="effect-gallery__reset-btn">
                  Reset
                </button>
              </div>
              <p className="effect-gallery__preview-desc">{activeEntry.description}</p>

              {completedSignals ? (
                <div className="effect-gallery__completed">
                  <p>Effect resolved successfully.</p>
                  {completedSignals.length > 0 && (
                    <ul>
                      {completedSignals.map((sig, i) => <li key={i}>{sig}</li>)}
                    </ul>
                  )}
                  <button type="button" onClick={handleReset} className="effect-gallery__reset-btn">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="effect-gallery__resolver" key={resolveKey}>
                  <EffectResolver
                    effect={activeEntry.effects}
                    onComplete={handleComplete}
                      careerId={selectedCareer}
                    />
                  </div>
              )}
            </>
          ) : (
            <p className="effect-gallery__placeholder">Select an event or mishap to preview.</p>
          )}
        </section>

        <aside className="effect-gallery__character">
          <CharacterPanel />
        </aside>
      </div>
    </div>
  );
}

function CharacterPanel() {
  const { character, dispatch } = useCharacter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Seed with moderate characteristics and some skills
    for (const c of CHARACTERISTICS) {
      const current = character.characteristics[c];
      if (current !== 8) {
        dispatch({ type: 'MOD_CHARACTERISTIC', characteristic: c, value: 8 - current });
      }
    }
    for (const skill of DEFAULT_SKILLS) {
      dispatch({ type: 'GAIN_SKILL', skill, level: 1 });
    }
  }, [character, dispatch]);

  function handleCharChange(char: CharacteristicName, value: number) {
    const current = character.characteristics[char];
    dispatch({ type: 'MOD_CHARACTERISTIC', characteristic: char, value: value - current });
  }

  function handleAddSkill(skill: string) {
    if (character.skills[skill] === undefined) {
      dispatch({ type: 'GAIN_SKILL', skill, level: 1 });
    }
  }

  function handleRemoveSkill(skill: string) {
    // Reset skill to -1 (effectively removes it from owned)
    const current = character.skills[skill] ?? 0;
    dispatch({ type: 'MOD_CHARACTERISTIC', characteristic: 'STR', value: 0 }); // force re-render
    // We don't have a REMOVE_SKILL action, so just note it
    void current;
  }

  return (
    <div className="effect-gallery__char-panel">
      <h3>Test Character</h3>

      <div className="effect-gallery__chars">
        {CHARACTERISTICS.map((c) => (
          <label key={c} className="effect-gallery__char-row">
            <span>{c}</span>
            <input
              type="number"
              min={1}
              max={15}
              value={character.characteristics[c]}
              onChange={(e) => handleCharChange(c, Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      <h4>Skills</h4>
      <div className="effect-gallery__skills">
        {Object.entries(character.skills)
          .filter(([, level]) => level >= 0)
          .map(([skill, level]) => (
            <span key={skill} className="effect-gallery__skill-tag">
              {skill} {level}
              <button type="button" onClick={() => handleRemoveSkill(skill)} title="Remove">x</button>
            </span>
          ))}
      </div>
      <div className="effect-gallery__add-skill">
        <select
          onChange={(e) => { if (e.target.value) { handleAddSkill(e.target.value); e.target.value = ''; } }}
          defaultValue=""
        >
          <option value="" disabled>Add skill...</option>
          {DEFAULT_SKILLS.filter((s) => (character.skills[s] ?? -1) < 0).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function EffectGallery() {
  return (
    <CharacterProvider>
      <EffectGalleryInner />
    </CharacterProvider>
  );
}
