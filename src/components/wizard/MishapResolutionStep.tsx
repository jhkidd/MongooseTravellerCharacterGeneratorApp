import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { interpretEffect } from '../../engine/effect-interpreter';
import { rollD6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface MishapResolutionStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function MishapResolutionStep({ context, onAdvance }: MishapResolutionStepProps) {
  const { character, dispatch } = useCharacter();
  const [mishapRoll, setMishapRoll] = useState<number | null>(null);
  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const mishap = career && mishapRoll ? career.mishaps[mishapRoll] : null;

  function applySignals(signals: string[]) {
    signals.forEach((signal) => {
      if (signal === 'autoPromote') {
        onAdvance({ type: 'AUTO_PROMOTE' });
        return;
      }

      if (signal.startsWith('forceCareer:')) {
        onAdvance({ type: 'FORCE_CAREER', careerId: signal.slice('forceCareer:'.length) });
        return;
      }

      if (signal.startsWith('advancementDM:')) {
        const value = Number.parseInt(signal.slice('advancementDM:'.length), 10);
        if (!Number.isNaN(value)) {
          onAdvance({ type: 'ADD_ADVANCEMENT_DM', value });
        }
      }
    });
  }

  function handleContinue() {
    if (mishap) {
      const interpreted = interpretEffect(mishap.effects, character);

      if (interpreted.type === 'immediate') {
        interpreted.actions.forEach(dispatch);
        applySignals(interpreted.signals);
      } else if (interpreted.immediateActions?.length) {
        interpreted.immediateActions.forEach(dispatch);
      }
    }

    onAdvance({ type: 'CONTINUE' });
  }

  return (
    <div>
      <ChamferedHeader>Mishap</ChamferedHeader>
      <p>Your term in {getCareerDisplayName(context.currentCareer)} ended badly.</p>

      {!mishapRoll ? (
        <button type="button" onClick={() => setMishapRoll(rollD6())} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Roll Mishap
        </button>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p>Mishap roll: {mishapRoll}</p>
          {mishap ? (
            <>
              <p>{mishap.description}</p>
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Immediate mishap effects are applied automatically; deeper branches will be expanded later.
              </p>
            </>
          ) : (
            <p>No mishap data is available for this career.</p>
          )}
          <button type="button" onClick={handleContinue} style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
