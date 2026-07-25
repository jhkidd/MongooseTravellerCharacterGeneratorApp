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
  const [phase, setPhase] = useState<Phase>(Phase.BACKGROUND);
  const [context, setContext] = useState<PhaseContext>(createInitialContext);
  const [history, setHistory] = useState<Phase[]>([]);

  const advance = useCallback((action: PhaseAction) => {
    setPhase((currentPhase) => {
      const result = getNextPhase(currentPhase, action, context);
      setContext(result.context);
      setHistory((prev) => [...prev, currentPhase]);
      return result.phase;
    });
  }, [context]);

  return { phase, context, advance, history };
}
