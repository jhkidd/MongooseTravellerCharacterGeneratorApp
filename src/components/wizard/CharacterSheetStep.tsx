import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { getDM } from '../../engine/dice';
import type { CharacteristicName, Contact, ContactType } from '../../models/types';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { HexBadge } from '../ui/HexBadge/HexBadge';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import './CharacterSheetStep.css';

const CHARS: CharacteristicName[] = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
const CONTACT_ORDER: ContactType[] = ['ally', 'contact', 'rival', 'enemy'];
const CONTACT_LABELS: Record<ContactType, { singular: string; plural: string }> = {
  ally: { singular: 'Ally', plural: 'Allies' },
  contact: { singular: 'Contact', plural: 'Contacts' },
  rival: { singular: 'Rival', plural: 'Rivals' },
  enemy: { singular: 'Enemy', plural: 'Enemies' },
};

type CopyState = 'idle' | 'success' | 'error';

interface SkillEntry {
  label: string;
  skill: string;
  specialty?: string;
  level: number;
}

interface CareerStint {
  career: string;
  careerDisplayName: string;
  assignment?: string;
  assignmentDisplayName?: string;
  startTerm: number;
  endTerm: number;
  terms: number;
  rank: number;
  rankTitle: string;
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDM(dm: number): string {
  return dm >= 0 ? `+${dm}` : `${dm}`;
}

function formatCredits(amount: number): string {
  const hasFraction = Math.abs(amount % 1) > Number.EPSILON;
  return `Cr${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`;
}

function getAssignmentDisplayName(careerId: string, assignmentId?: string): string | undefined {
  if (!assignmentId) {
    return undefined;
  }

  const career = tryLoadCareer(careerId);
  return career?.assignments.find((assignment) => assignment.id === assignmentId)?.name ?? titleCase(assignmentId);
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

export function CharacterSheetStep() {
  const { character } = useCharacter();
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const displayName = character.name.trim() || 'Unnamed Traveller';
  const displaySpecies = titleCase(character.species);
  const displayHomeworld = character.homeworld.trim() || 'Unknown';
  const monthlyPension = character.pensionPerYear / 12;
  const termsServed = Math.max(character.currentTerm, character.careers.length);

  const characteristicEntries = useMemo(() => (
    CHARS.map((name) => ({
      name,
      value: character.characteristics[name],
      dm: getDM(character.characteristics[name]),
    }))
  ), [character.characteristics]);

  const skillEntries = useMemo<SkillEntry[]>(() => {
    const baseSkills = Object.entries(character.skills).map(([skill, level]) => ({
      label: skill,
      skill,
      level,
    }));
    const specialtySkills = Object.entries(character.specialties).map(([key, level]) => {
      const [skill, specialty] = key.split(':');

      return {
        label: specialty ? `${skill} (${specialty})` : skill,
        skill,
        specialty,
        level,
      };
    });

    return [...baseSkills, ...specialtySkills].sort((left, right) => (
      left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
    ));
  }, [character.skills, character.specialties]);

  const careerStints = useMemo<CareerStint[]>(() => {
    const stints: CareerStint[] = [];

    for (const entry of character.careers) {
      const lastStint = stints[stints.length - 1];

      if (lastStint && lastStint.career === entry.career && lastStint.assignment === entry.assignment) {
        lastStint.endTerm = entry.term;
        lastStint.terms += 1;
        lastStint.rank = entry.rank;
        lastStint.rankTitle = entry.rankTitle;
        continue;
      }

      stints.push({
        career: entry.career,
        careerDisplayName: getCareerDisplayName(entry.career),
        assignment: entry.assignment,
        assignmentDisplayName: getAssignmentDisplayName(entry.career, entry.assignment),
        startTerm: entry.term,
        endTerm: entry.term,
        terms: 1,
        rank: entry.rank,
        rankTitle: entry.rankTitle,
      });
    }

    return stints;
  }, [character.careers]);

  const finalRank = careerStints[careerStints.length - 1]?.rankTitle ?? 'Unranked';
  const careerCount = new Set(careerStints.map((stint) => stint.career)).size;

  const contactGroups = useMemo(() => (
    CONTACT_ORDER.map((type) => ({
      type,
      label: CONTACT_LABELS[type].plural,
      entries: character.contacts
        .filter((contact) => contact.type === type)
        .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })),
    }))
  ), [character.contacts]);

  const narrativeEntries = useMemo(() => (
    [...character.timeline]
      .sort((left, right) => left.term - right.term || left.age - right.age)
      .map((entry) => ({
        label: `Term ${entry.term}`,
        text: entry.narrativeNote?.trim() || entry.description,
      }))
  ), [character.timeline]);

  const exportText = useMemo(() => {
    const contactLines = contactGroups.flatMap(({ entries }) => (
      entries.map((contact) => `${CONTACT_LABELS[contact.type].singular}: ${formatContactLine(contact)}`)
    ));

    const benefitLines = character.benefits.length > 0
      ? ['Benefits:', ...character.benefits.map((benefit) => `- ${benefit}`)]
      : ['Benefits: None'];

    const narrativeLines = [
      ...(character.backgroundNotes.trim()
        ? character.backgroundNotes.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        : []),
      ...narrativeEntries.map((entry) => `${entry.label}: ${entry.text}`),
    ];

    return [
      '=== TRAVELLER CHARACTER SHEET ===',
      `Name: ${displayName}`,
      `Species: ${displaySpecies}`,
      `Homeworld: ${displayHomeworld}`,
      `Age: ${character.age}`,
      '',
      '--- CHARACTERISTICS ---',
      ...characteristicEntries.map(({ name, value, dm }) => `${name}: ${value} (DM ${formatDM(dm)})`),
      '',
      '--- SKILLS ---',
      ...(skillEntries.length > 0
        ? skillEntries.map((entry) => entry.specialty
          ? `${entry.skill} (${entry.specialty}) ${entry.level}`
          : `${entry.skill} ${entry.level}`)
        : ['None recorded']),
      '',
      '--- CAREER HISTORY ---',
      ...(careerStints.length > 0
        ? careerStints.map((stint) => {
          const assignment = stint.assignmentDisplayName ? ` (${stint.assignmentDisplayName})` : '';
          const rank = stint.rankTitle || stint.rank;
          return `${stint.careerDisplayName}${assignment} - ${stint.terms} ${stint.terms === 1 ? 'term' : 'terms'}, Rank ${rank}`;
        })
        : ['No careers recorded']),
      '',
      '--- FINANCES ---',
      `Cash: ${formatCredits(character.cash)}`,
      `Pension: ${formatCredits(monthlyPension)}/month`,
      ...benefitLines,
      ...(character.benefitDMs !== 0 ? [`Benefit DM: ${formatDM(character.benefitDMs)}`] : []),
      '',
      '--- CONTACTS ---',
      ...(contactLines.length > 0 ? contactLines : ['None recorded']),
      '',
      '--- BACKGROUND & NARRATIVE ---',
      ...(narrativeLines.length > 0 ? narrativeLines : ['No notes recorded.']),
    ].join('\n');
  }, [
    character.age,
    character.backgroundNotes,
    character.benefitDMs,
    character.benefits,
    character.cash,
    characteristicEntries,
    contactGroups,
    displayHomeworld,
    displayName,
    displaySpecies,
    monthlyPension,
    narrativeEntries,
    careerStints,
    skillEntries,
  ]);

  async function handleCopyToClipboard() {
    try {
      await copyTextToClipboard(exportText);
      setCopyState('success');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <div className="character-sheet-step">
      <div className="character-sheet-step__hero">
        <div className="character-sheet-step__hero-copy">
          <p className="character-sheet-step__eyebrow">Final Traveller Record</p>
          <ChamferedHeader level={1}>Character Complete</ChamferedHeader>
          <p className="character-sheet-step__subtitle">
            Review the finished sheet, copy it for play, or start fresh for a new traveller.
          </p>
        </div>

        <div className="character-sheet-step__actions">
          <div className="character-sheet-step__action-row">
            <button
              type="button"
              className="character-sheet-step__button character-sheet-step__button--secondary"
              onClick={() => { void handleCopyToClipboard(); }}
            >
              Copy to Clipboard
            </button>
            <button
              type="button"
              className="character-sheet-step__button"
              onClick={() => window.location.reload()}
            >
              Start New Character
            </button>
          </div>
          <span
            className={[
              'character-sheet-step__copy-status',
              copyState === 'success' ? 'character-sheet-step__copy-status--success' : '',
              copyState === 'error' ? 'character-sheet-step__copy-status--error' : '',
            ].filter(Boolean).join(' ')}
          >
            {copyState === 'success' && 'Copied plain-text sheet to clipboard.'}
            {copyState === 'error' && 'Copy failed. Please try again.'}
          </span>
        </div>
      </div>

      <div className="character-sheet-step__grid">
        <section className="character-sheet-step__section character-sheet-step__section--identity">
          <ChamferedHeader level={3}>Identity</ChamferedHeader>
          <div className="character-sheet-step__identity-grid">
            <IdentityField label="Name" value={displayName} />
            <IdentityField label="Species" value={displaySpecies} />
            <IdentityField label="Homeworld" value={displayHomeworld} />
            <IdentityField label="Age" value={`${character.age}`} />
          </div>
        </section>

        <section className="character-sheet-step__section character-sheet-step__section--finances">
          <ChamferedHeader level={3}>Cash &amp; Benefits</ChamferedHeader>
          <div className="character-sheet-step__finance-list">
            <FinanceItem label="Cash" value={formatCredits(character.cash)} />
            <FinanceItem label="Pension" value={`${formatCredits(monthlyPension)}/month`} />
            <FinanceItem label="Benefit DM" value={formatDM(character.benefitDMs)} />
          </div>

          <div className="character-sheet-step__benefits">
            {character.benefits.length > 0 ? (
              <ul className="character-sheet-step__bullet-list">
                {character.benefits.map((benefit, index) => (
                  <li key={`${benefit}-${index}`}>{benefit}</li>
                ))}
              </ul>
            ) : (
              <p className="character-sheet-step__empty-state">No mustering-out benefits recorded.</p>
            )}
          </div>
        </section>

        <section className="character-sheet-step__section character-sheet-step__section--characteristics">
          <ChamferedHeader level={3}>Characteristics</ChamferedHeader>
          <div className="character-sheet-step__characteristics-grid">
            {characteristicEntries.map(({ name, value, dm }) => (
              <HexBadge
                key={name}
                value={value}
                label={name}
                dm={dm}
                size="lg"
              />
            ))}
          </div>
        </section>

        <section className="character-sheet-step__section character-sheet-step__section--skills">
          <ChamferedHeader level={3}>Skills &amp; Specialties</ChamferedHeader>
          {skillEntries.length > 0 ? (
            <ul className="character-sheet-step__stat-list">
              {skillEntries.map((entry) => (
                <li key={entry.label} className="character-sheet-step__stat-row">
                  <span className="character-sheet-step__stat-label">{entry.label}</span>
                  <span className="character-sheet-step__stat-value">{entry.level}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="character-sheet-step__empty-state">No skills have been recorded.</p>
          )}
        </section>

        <section className="character-sheet-step__section character-sheet-step__section--careers">
          <ChamferedHeader level={3}>Career History</ChamferedHeader>

          <div className="character-sheet-step__career-summary">
            <SummaryCard label="Terms Served" value={`${termsServed}`} />
            <SummaryCard label="Careers" value={`${careerCount}`} />
            <SummaryCard label="Final Rank" value={finalRank} />
          </div>

          {careerStints.length > 0 ? (
            <div className="character-sheet-step__career-list">
              {careerStints.map((stint, index) => (
                <article key={`${stint.career}-${stint.assignment ?? 'base'}-${index}`} className="character-sheet-step__career-card">
                  <div className="character-sheet-step__career-heading">
                    <span className="character-sheet-step__career-name">{stint.careerDisplayName}</span>
                    {stint.assignmentDisplayName && (
                      <span className="character-sheet-step__career-assignment">{stint.assignmentDisplayName}</span>
                    )}
                  </div>
                  <div className="character-sheet-step__career-meta">
                    <span>{stint.terms === 1 ? `Term ${stint.startTerm}` : `Terms ${stint.startTerm}-${stint.endTerm}`}</span>
                    <span>{stint.terms} {stint.terms === 1 ? 'term' : 'terms'}</span>
                    <span>Rank {stint.rankTitle || stint.rank}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="character-sheet-step__empty-state">No career terms have been completed.</p>
          )}
        </section>

        <section className="character-sheet-step__section character-sheet-step__section--contacts">
          <ChamferedHeader level={3}>Contacts</ChamferedHeader>
          <div className="character-sheet-step__contact-groups">
            {contactGroups.map(({ type, label, entries }) => (
              <div key={type} className="character-sheet-step__contact-group">
                <h4 className="character-sheet-step__contact-heading">{label}</h4>
                {entries.length > 0 ? (
                  <ul className="character-sheet-step__bullet-list">
                    {entries.map((contact) => (
                      <li key={contact.id}>
                        <span className="character-sheet-step__contact-name">{contact.name || 'Unnamed Contact'}</span>
                        {contact.description && <span className="character-sheet-step__contact-description"> — {contact.description}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="character-sheet-step__empty-state">None recorded.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="character-sheet-step__section character-sheet-step__section--narrative">
          <ChamferedHeader level={3}>Background Notes &amp; Narrative</ChamferedHeader>

          {character.backgroundNotes.trim() ? (
            <p className="character-sheet-step__narrative-text">{character.backgroundNotes}</p>
          ) : (
            <p className="character-sheet-step__empty-state">No background notes recorded.</p>
          )}

          {narrativeEntries.length > 0 && (
            <ul className="character-sheet-step__timeline-list">
              {narrativeEntries.map((entry, index) => (
                <li key={`${entry.label}-${index}`} className="character-sheet-step__timeline-item">
                  <span className="character-sheet-step__timeline-label">{entry.label}</span>
                  <span className="character-sheet-step__timeline-text">{entry.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function IdentityField({ label, value }: { label: string; value: string }) {
  return (
    <div className="character-sheet-step__identity-field">
      <span className="character-sheet-step__field-label">{label}</span>
      <span className="character-sheet-step__field-value">{value}</span>
    </div>
  );
}

function FinanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="character-sheet-step__finance-item">
      <span className="character-sheet-step__field-label">{label}</span>
      <span className="character-sheet-step__finance-value">{value}</span>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="character-sheet-step__summary-card">
      <span className="character-sheet-step__field-label">{label}</span>
      <span className="character-sheet-step__summary-value">{value}</span>
    </div>
  );
}

function formatContactLine(contact: Contact): string {
  const description = contact.description ? ` — ${contact.description}` : '';
  return `${contact.name || 'Unnamed Contact'}${description}`;
}
