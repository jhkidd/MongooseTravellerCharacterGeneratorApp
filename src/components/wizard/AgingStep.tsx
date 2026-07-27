import { useEffect, useMemo, useRef } from 'react';
import { Phase } from '../../engine/state-machine';
import { useCharacter } from '../../context/CharacterContext';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface AgingStepProps {
  phase: Phase;
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

function getRankTitle(context: PhaseContext, career: ReturnType<typeof tryLoadCareer>): string | null {
  if (!career) return null;
  const ranks = career.ranks;
  if (ranks.type === 'split') {
    const track = context.isOfficer ? ranks.tracks['officer'] : ranks.tracks['enlisted'];
    return track?.[context.currentRank]?.title ?? null;
  }
  if (ranks.type === 'assignment') {
    const track = ranks.tracks[context.currentAssignment ?? ''];
    return track?.[context.currentRank]?.title ?? null;
  }
  const defaultTrack = Object.values(ranks.tracks)[0];
  return defaultTrack?.[context.currentRank]?.title ?? null;
}

function getRankBonus(context: PhaseContext, career: ReturnType<typeof tryLoadCareer>) {
  if (!career) return null;
  const ranks = career.ranks;
  let track;
  if (ranks.type === 'split') {
    track = context.isOfficer ? ranks.tracks['officer'] : ranks.tracks['enlisted'];
  } else if (ranks.type === 'assignment') {
    track = ranks.tracks[context.currentAssignment ?? ''];
  } else {
    track = Object.values(ranks.tracks)[0];
  }
  return track?.[context.currentRank]?.bonus ?? null;
}

export function AgingStep({ phase, context, onAdvance }: AgingStepProps) {
  const { character, dispatch } = useCharacter();
  const ageApplied = useRef(false);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);

  // Must be called unconditionally (rules of hooks)
  useEffect(() => {
    if (phase !== Phase.AGING_CHECK) return;
    if (ageApplied.current) return;
    ageApplied.current = true;
    dispatch({ type: 'INCREMENT_AGE', years: 4 });
  }, [phase, dispatch]);

  if (phase === Phase.RANK_BONUS) {
    const rankTitle = getRankTitle(context, career);
    const bonus = getRankBonus(context, career);

    function handleRankContinue() {
      if (bonus) {
        if (bonus.type === 'gainSkill') {
          dispatch({ type: 'GAIN_SKILL', skill: bonus.skill, level: bonus.level ?? 1 });
        } else if (bonus.type === 'gainSpecialty') {
          dispatch({ type: 'GAIN_SPECIALTY', skill: bonus.skill, specialty: bonus.specialty, level: bonus.level ?? 1 });
        } else if (bonus.type === 'modCharacteristic') {
          dispatch({ type: 'MOD_CHARACTERISTIC', characteristic: bonus.characteristic, value: bonus.value });
        } else if (bonus.type === 'ensureCharacteristic') {
          dispatch({ type: 'ENSURE_CHARACTERISTIC', characteristic: bonus.characteristic, minimum: bonus.minimum, fallbackMod: bonus.fallback.value });
        }
      }
      onAdvance({ type: 'CONTINUE' });
    }

    return (
      <div>
        <ChamferedHeader>
          {context.isOfficer && context.currentRank === 1 ? 'Commissioned!' : 'Promoted!'}
        </ChamferedHeader>
        {rankTitle && (
          <p>You are now a <strong>{rankTitle}</strong> (Rank {context.currentRank}).</p>
        )}
        {!rankTitle && (
          <p>You advanced to Rank {context.currentRank}.</p>
        )}
        {bonus && bonus.type === 'gainSkill' && (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Rank bonus: {bonus.skill} {bonus.level ?? 1}
          </p>
        )}
        {bonus && bonus.type === 'gainSpecialty' && (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Rank bonus: {bonus.skill} ({bonus.specialty}) {bonus.level ?? 1}
          </p>
        )}
        {bonus && bonus.type === 'modCharacteristic' && (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Rank bonus: {bonus.characteristic} {bonus.value > 0 ? '+' : ''}{bonus.value}
          </p>
        )}
        {bonus && bonus.type === 'ensureCharacteristic' && (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Rank bonus: {bonus.characteristic} raised to {bonus.minimum} (or +{bonus.fallback.value})
          </p>
        )}
        <button type="button" onClick={handleRankContinue} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  if (phase === Phase.TERM_NARRATIVE) {
    const rankTitle = getRankTitle(context, career);
    return (
      <div>
        <ChamferedHeader>Term Summary</ChamferedHeader>
        <p>
          Term {context.currentTerm} in {context.currentCareer ?? 'your current path'} is complete.
        </p>
        {rankTitle && (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Current rank: {rankTitle} (Rank {context.currentRank})
          </p>
        )}
        <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  const newAge = character.age;
  const needsAgingRoll = newAge >= 34;

  return (
    <div>
      <ChamferedHeader>Aging</ChamferedHeader>
      <p>Your Traveller ages to {newAge}.</p>
      {needsAgingRoll && (
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Aging effects begin at 34 and will be expanded in a future update.
        </p>
      )}
      <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
        Continue
      </button>
    </div>
  );
}
