import { useState, useCallback } from 'react';
import {
  Phase,
  getNextPhase,
  createInitialContext,
  type PhaseContext,
  type PhaseAction,
} from '../engine/state-machine';

interface UseWizardReturn {
  phase: Phase;
  context: PhaseContext;
  advance: (action: PhaseAction) => void;
  history: Phase[];
}

export function useWizard(): UseWizardReturn {
  const [wizardState, setWizardState] = useState<{
    phase: Phase;
    context: PhaseContext;
    history: Phase[];
  }>({
    phase: Phase.BACKGROUND,
    context: createInitialContext(),
    history: [],
  });

  const advance = useCallback((action: PhaseAction) => {
    setWizardState((current) => {
      const result = getNextPhase(current.phase, action, current.context);
      return {
        phase: result.phase,
        context: result.context,
        history: [...current.history, current.phase],
      };
    });
  }, []);

  return {
    phase: wizardState.phase,
    context: wizardState.context,
    advance,
    history: wizardState.history,
  };
}
