import { useMemo, useState } from 'react';
import { rollD6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { EffectResolver } from '../shared/EffectResolver';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';
import type { EffectResolverResult } from '../shared/EffectResolver';

interface MishapResolutionStepProps {
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function MishapResolutionStep({ context, onAdvance }: MishapResolutionStepProps) {
  const [mishapRoll, setMishapRoll] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const mishap = career && mishapRoll ? career.mishaps[mishapRoll] : null;

  function handleEffectComplete(result: EffectResolverResult) {
    // Check for signals that affect the flow
    for (const signal of result.signals) {
      if (signal === 'autoPromote') {
        onAdvance({ type: 'ROLL_SUCCESS' });
        return;
      }
      if (signal.startsWith('forceCareer:')) {
        onAdvance({ type: 'FORCE_CAREER', careerId: signal.slice('forceCareer:'.length) });
        return;
      }
    }
    // Default: ejected from career (continue to aging check)
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
      ) : !resolving ? (
        <div style={{ marginTop: '1rem' }}>
          <p>Mishap roll: {mishapRoll}</p>
          {mishap ? (
            <p>{mishap.description}</p>
          ) : (
            <p>No mishap data is available for this career.</p>
          )}
          <button
            type="button"
            onClick={() => {
              if (mishap) {
                setResolving(true);
              } else {
                onAdvance({ type: 'CONTINUE' });
              }
            }}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
          >
            {mishap ? 'Resolve' : 'Continue'}
          </button>
        </div>
      ) : mishap ? (
        <div style={{ marginTop: '1rem' }}>
          <p>{mishap.description}</p>
          <div style={{ marginTop: '0.5rem' }}>
            <EffectResolver
              effect={mishap.effects}
              onComplete={handleEffectComplete}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
