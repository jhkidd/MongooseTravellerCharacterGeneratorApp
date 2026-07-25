import { useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { interpretEffect } from '../../engine/effect-interpreter';
import { Phase } from '../../engine/state-machine';
import { roll2D6 } from '../../engine/dice';
import { ChamferedHeader } from '../ui/ChamferedHeader/ChamferedHeader';
import { getCareerDisplayName, tryLoadCareer } from './career-flow-utils';
import type { PhaseAction, PhaseContext } from '../../engine/state-machine';

interface EventResolutionStepProps {
  phase: Phase;
  context: PhaseContext;
  onAdvance: (action: PhaseAction) => void;
}

export function EventResolutionStep({ phase, context, onAdvance }: EventResolutionStepProps) {
  const { character, dispatch } = useCharacter();
  const [eventRoll, setEventRoll] = useState<number | null>(null);
  const career = useMemo(() => tryLoadCareer(context.currentCareer), [context.currentCareer]);
  const event = career && eventRoll ? career.events[eventRoll] : null;

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
    if (event) {
      const interpreted = interpretEffect(event.effects, character);

      if (interpreted.type === 'immediate') {
        interpreted.actions.forEach(dispatch);
        applySignals(interpreted.signals);
      } else if (interpreted.immediateActions?.length) {
        interpreted.immediateActions.forEach(dispatch);
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

  return (
    <div>
      <ChamferedHeader>Event Resolution</ChamferedHeader>
      {event ? (
        <>
          <p>{event.description}</p>
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Interactive event branches are still lightweight in this phase, but immediate effects are applied.
          </p>
        </>
      ) : (
        <>
          <p>An event occurred during your term in {getCareerDisplayName(context.currentCareer)}.</p>
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Event details are not available for this career yet.
          </p>
        </>
      )}
      <button type="button" onClick={handleContinue} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}>
        Continue
      </button>
    </div>
  );
}
