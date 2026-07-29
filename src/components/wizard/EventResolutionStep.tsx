import { useMemo, useState } from 'react';
import { Phase } from '../../engine/state-machine';
import { roll2D6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { EffectResolver } from '../shared/EffectResolver';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';
import type { EffectResolverResult } from '../shared/EffectResolver';

interface EventResolutionStepProps {
  phase: Phase;
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function EventResolutionStep({ phase, context, onAdvance }: EventResolutionStepProps) {
  const [eventRoll, setEventRoll] = useState<number | null>(null);
  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const event = career && eventRoll ? career.events[eventRoll] : null;

  function handleEffectComplete(result: EffectResolverResult) {
    // Process signals from the effect resolver
    for (const signal of result.signals) {
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
          // Apply the DM first (stays on same phase), then advance
          onAdvance({ type: 'ADD_ADVANCEMENT_DM', value });
        }
      }
    }
    onAdvance({ type: 'CONTINUE' });
  }

  if (phase === Phase.EVENT_ROLL) {
    return (
      <div>
        <ChamferedHeader>Career Event</ChamferedHeader>
        <p>Roll to see what happens during your term in {getCareerDisplayName(context.currentCareer)}.</p>

        {!eventRoll ? (
          <button type="button" onClick={() => setEventRoll(roll2D6())} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
            Roll Event
          </button>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            <p>Event roll: {eventRoll}</p>
            <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ padding: '0.5rem 1.5rem' }}>
              Resolve Event
            </button>
          </div>
        )}
      </div>
    );
  }

  // EVENT_RESOLUTION phase
  if (!event) {
    return (
      <div>
        <ChamferedHeader>Event Resolution</ChamferedHeader>
        <p>An event occurred during your term in {getCareerDisplayName(context.currentCareer)}.</p>
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Event details are not available for this career yet.
        </p>
        <button type="button" onClick={() => onAdvance({ type: 'CONTINUE' })} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <ChamferedHeader>Event Resolution</ChamferedHeader>
      <p>{event.description}</p>
      <div style={{ marginTop: '1rem' }}>
        <EffectResolver
          effect={event.effects}
          onComplete={handleEffectComplete}
          careerId={context.currentCareer ?? undefined}
        />
      </div>
    </div>
  );
}
