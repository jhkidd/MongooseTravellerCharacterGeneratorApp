import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { rollD6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { ChoicePanel } from '../shared/ChoicePanel';
import { EffectResolver } from '../shared/EffectResolver';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';
import type { EffectNode } from '../../models/effect-types';

interface CareerBenefitRollsStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

const FALLBACK_CASH: Record<number, number> = {
  1: 1000,
  2: 2000,
  3: 5000,
  4: 5000,
  5: 10000,
  6: 10000,
  7: 20000,
};

function getRankBenefitBonus(rank: number): { extraRolls: number; dm: number } {
  if (rank >= 5) return { extraRolls: 3, dm: 1 };
  if (rank >= 3) return { extraRolls: 2, dm: 0 };
  if (rank >= 1) return { extraRolls: 1, dm: 0 };
  return { extraRolls: 0, dm: 0 };
}

export function CareerBenefitRollsStep({ context, onAdvance }: CareerBenefitRollsStepProps) {
  const { character, dispatch } = useCharacter();
  const [cashRollCount, setCashRollCount] = useState(0);
  const [totalRollCount, setTotalRollCount] = useState(0);
  const [benefitsComplete, setBenefitsComplete] = useState(false);
  const [pendingBenefitEffect, setPendingBenefitEffect] = useState<EffectNode | null>(null);
  const [lastRollDescription, setLastRollDescription] = useState<string | null>(null);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const cashTable = career?.musteringOut.cash ?? FALLBACK_CASH;
  const benefitsTable = career?.musteringOut.benefits ?? null;

  const rank = context.currentRank;
  const { extraRolls, dm: rankDM } = getRankBenefitBonus(rank);
  const benefitRolls = context.termsInCurrentCareer > 0
    ? context.termsInCurrentCareer + extraRolls
    : 0;

  const hasGambler = (character.skills['Gambler'] ?? -1) >= 0;
  const maxCashRolls = 3;
  const canRollCash = cashRollCount < maxCashRolls;
  const rollsRemaining = benefitRolls - totalRollCount;

  // No benefits to collect (e.g. after pre-career education)
  if (benefitRolls === 0 && !benefitsComplete) {
    return (
      <div>
        <ChamferedHeader>End of Term</ChamferedHeader>
        <p>No career benefits to collect.</p>
        <ChoicePanel
          prompt="What would you like to do next?"
          options={[
            { label: 'Start a new career', description: 'Begin a new term and choose a career' },
            { label: 'Finalise character', description: 'Finish character creation' },
          ]}
          onSelect={(index) => {
            if (index === 0) {
              onAdvance({ type: 'CONTINUE' });
            } else {
              onAdvance({ type: 'MUSTER_OUT' });
            }
          }}
        />
      </div>
    );
  }

  // If we have a pending benefit effect that needs interactive resolution
  if (pendingBenefitEffect) {
    return (
      <div>
        <ChamferedHeader>Benefit Roll Result</ChamferedHeader>
        {lastRollDescription && <p>{lastRollDescription}</p>}
        <EffectResolver
          effect={pendingBenefitEffect}
          onComplete={() => {
            setPendingBenefitEffect(null);
            setLastRollDescription(null);
            if (totalRollCount >= benefitRolls) {
              setBenefitsComplete(true);
            }
          }}
        />
      </div>
    );
  }

  function handleRollCash() {
    const rawRoll = rollD6();
    const gamblerDM = hasGambler ? 1 : 0;
    const adjustedRoll = Math.max(1, Math.min(7, rawRoll + character.benefitDMs + rankDM + gamblerDM));
    const amount = cashTable[adjustedRoll] ?? FALLBACK_CASH[adjustedRoll] ?? 0;

    dispatch({ type: 'ADD_CASH', amount });
    setCashRollCount((c) => c + 1);
    setTotalRollCount((c) => c + 1);
    setLastRollDescription(`Cash roll: ${rawRoll}${gamblerDM || rankDM || character.benefitDMs ? ` (adjusted to ${adjustedRoll})` : ''} = Cr${amount.toLocaleString()}`);

    if (totalRollCount + 1 >= benefitRolls) {
      setBenefitsComplete(true);
    }
  }

  function handleRollBenefit() {
    if (!benefitsTable) {
      // No benefits table - just continue
      setTotalRollCount((c) => c + 1);
      if (totalRollCount + 1 >= benefitRolls) {
        setBenefitsComplete(true);
      }
      return;
    }

    const rawRoll = rollD6();
    const adjustedRoll = Math.max(1, Math.min(7, rawRoll + character.benefitDMs + rankDM));
    const benefit = benefitsTable[adjustedRoll];

    setTotalRollCount((c) => c + 1);

    if (benefit) {
      setLastRollDescription(`Benefit roll: ${rawRoll}${rankDM || character.benefitDMs ? ` (adjusted to ${adjustedRoll})` : ''} = ${benefit.description}`);
      // Check if the benefit needs interactive resolution
      const effectNode = benefit.effects;
      if (effectNode.type === 'pickOne' || effectNode.type === 'choice') {
        setPendingBenefitEffect(effectNode);
      } else {
        // Apply immediately
        setPendingBenefitEffect(effectNode);
      }
    } else {
      if (totalRollCount + 1 >= benefitRolls) {
        setBenefitsComplete(true);
      }
    }
  }

  const careerName = getCareerDisplayName(context.currentCareer);

  if (benefitsComplete && !pendingBenefitEffect) {
    return (
      <div>
        <ChamferedHeader>Benefits Collected</ChamferedHeader>
        <p>
          You have collected your benefits from {careerName}.
          Cash total: Cr{character.cash.toLocaleString()}
        </p>
        {character.benefits.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0' }}>
            {character.benefits.map((b, i) => (
              <li key={i} style={{ color: 'var(--color-text-secondary)', padding: '0.2rem 0' }}>• {b}</li>
            ))}
          </ul>
        )}
        <ChoicePanel
          prompt="What would you like to do next?"
          options={[
            { label: 'Start a new career', description: 'Begin a new term and choose a different career' },
            { label: 'Finalise character', description: 'Finish character creation' },
          ]}
          onSelect={(index) => {
            if (index === 0) {
              onAdvance({ type: 'CONTINUE' });
            } else {
              onAdvance({ type: 'MUSTER_OUT' });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>Mustering Out Benefits</ChamferedHeader>
      <p>
        Collecting benefits from {context.termsInCurrentCareer} term(s) in {careerName}.
        {rank > 0 && ` (Rank ${rank} bonus: +${extraRolls} rolls${rankDM > 0 ? ', DM+1' : ''})`}
      </p>
      <p>Cash so far: Cr{character.cash.toLocaleString()}</p>
      <p>Rolls remaining: {rollsRemaining}</p>
      {lastRollDescription && (
        <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{lastRollDescription}</p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleRollCash}
          disabled={!canRollCash || rollsRemaining <= 0}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          Roll Cash{!canRollCash ? ' (max 3)' : ''}
        </button>
        <button
          type="button"
          onClick={handleRollBenefit}
          disabled={rollsRemaining <= 0 || !benefitsTable}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          Roll Benefits
        </button>
      </div>
    </div>
  );
}
