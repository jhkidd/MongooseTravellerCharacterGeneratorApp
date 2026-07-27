import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { rollD6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { ChoicePanel } from '../shared/ChoicePanel';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

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
  const [rolls, setRolls] = useState<number[]>([]);
  const [benefitsComplete, setBenefitsComplete] = useState(false);

  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const cashTable = career?.musteringOut.cash ?? FALLBACK_CASH;

  const rank = context.currentRank;
  const { extraRolls, dm: rankDM } = getRankBenefitBonus(rank);
  const benefitRolls = context.termsInCurrentCareer > 0
    ? context.termsInCurrentCareer + extraRolls
    : 0;

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

  function handleRollBenefit() {
    const rawRoll = rollD6();
    const adjustedRoll = Math.max(1, Math.min(7, rawRoll + character.benefitDMs + rankDM));
    const amount = cashTable[adjustedRoll] ?? FALLBACK_CASH[adjustedRoll] ?? 0;

    setRolls((current) => [...current, adjustedRoll]);
    dispatch({ type: 'ADD_CASH', amount });

    if (rolls.length + 1 >= benefitRolls) {
      setBenefitsComplete(true);
    }
  }

  const careerName = getCareerDisplayName(context.currentCareer);

  if (benefitsComplete) {
    return (
      <div>
        <ChamferedHeader>Benefits Collected</ChamferedHeader>
        <p>
          You have collected your benefits from {careerName}.
          Cash total: Cr{character.cash.toLocaleString()}
        </p>
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
      </p>
      <p>Cash so far: Cr{character.cash.toLocaleString()}</p>
      <p>Benefit rolls remaining: {Math.max(0, benefitRolls - rolls.length)}</p>

      <button
        type="button"
        onClick={handleRollBenefit}
        disabled={rolls.length >= benefitRolls}
        style={{ margin: '0.5rem 0', padding: '0.5rem 1.5rem' }}
      >
        Roll Cash Benefit
      </button>

      {rolls.length > 0 && (
        <p>Cash rolls: {rolls.join(', ')}</p>
      )}
    </div>
  );
}
