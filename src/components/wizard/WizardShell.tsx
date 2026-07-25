import { useWizard } from '../../hooks/useWizard';
import { Phase } from '../../engine/state-machine';
import { BackgroundStep } from './BackgroundStep';
import { CharacteristicsStep } from './CharacteristicsStep';
import { BackgroundSkillsStep } from './BackgroundSkillsStep';
import { TermStartStep } from './TermStartStep';
import './WizardShell.css';

export function WizardShell() {
  const { phase, context, advance } = useWizard();

  function renderPhase() {
    switch (phase) {
      case Phase.BACKGROUND:
        return <BackgroundStep onContinue={() => advance({ type: 'CONTINUE' })} />;
      case Phase.CHARACTERISTICS:
        return <CharacteristicsStep onContinue={() => advance({ type: 'CONTINUE' })} />;
      case Phase.BACKGROUND_SKILLS:
        return <BackgroundSkillsStep onContinue={() => advance({ type: 'CONTINUE' })} />;
      case Phase.TERM_START:
        return <TermStartStep context={context} onAdvance={advance} />;
      default:
        return (
          <div>
            <p>Phase: {phase}</p>
            <p>This phase is not yet implemented.</p>
          </div>
        );
    }
  }

  return (
    <div className="wizard-shell">
      <div className="wizard-shell__phase-indicator">
        Phase: {phase.replace(/_/g, ' ')}
      </div>
      {renderPhase()}
    </div>
  );
}
