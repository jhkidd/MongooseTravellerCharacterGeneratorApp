import { useWizard } from '../../hooks/useWizard';
import { Phase } from '../../engine/state-machine';
import { BackgroundStep } from './BackgroundStep';
import { CharacteristicsStep } from './CharacteristicsStep';
import { BackgroundSkillsStep } from './BackgroundSkillsStep';
import { TermStartStep } from './TermStartStep';
import { PreCareerSelectionStep } from './PreCareerSelectionStep';
import { EducationEntryRollStep } from './EducationEntryRollStep';
import { EducationEventsStep } from './EducationEventsStep';
import { GraduationRollStep } from './GraduationRollStep';
import { CareerSelectionStep } from './CareerSelectionStep';
import { QualificationRollStep } from './QualificationRollStep';
import { DraftOrDrifterStep } from './DraftOrDrifterStep';
import { CareerTermStep } from './CareerTermStep';
import { MishapResolutionStep } from './MishapResolutionStep';
import { EventResolutionStep } from './EventResolutionStep';
import { SkillTrainingStep } from './SkillTrainingStep';
import { AdvancementStep } from './AdvancementStep';
import { AgingStep } from './AgingStep';
import { TermEndStep } from './TermEndStep';
import { MusteringOutStep } from './MusteringOutStep';
import { FinalizeStep } from './FinalizeStep';
import { CharacterSheetStep } from './CharacterSheetStep';
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
      case Phase.PRE_CAREER_SELECTION:
        return <PreCareerSelectionStep onAdvance={advance} />;
      case Phase.EDUCATION_ENTRY_ROLL:
        return <EducationEntryRollStep onAdvance={advance} />;
      case Phase.EDUCATION_EVENTS:
        return <EducationEventsStep onAdvance={advance} />;
      case Phase.GRADUATION_ROLL:
        return <GraduationRollStep onAdvance={advance} />;
      case Phase.CAREER_SELECTION:
        return <CareerSelectionStep context={context} onAdvance={advance} />;
      case Phase.QUALIFICATION_ROLL:
        return <QualificationRollStep context={context} onAdvance={advance} />;
      case Phase.DRAFT_OR_DRIFTER:
        return <DraftOrDrifterStep context={context} onAdvance={advance} />;
      case Phase.CAREER_ACTIVE:
      case Phase.SURVIVAL_ROLL:
        return <CareerTermStep phase={phase} context={context} onAdvance={advance} />;
      case Phase.MISHAP_RESOLUTION:
        return <MishapResolutionStep context={context} onAdvance={advance} />;
      case Phase.EVENT_ROLL:
      case Phase.EVENT_RESOLUTION:
        return <EventResolutionStep phase={phase} context={context} onAdvance={advance} />;
      case Phase.SKILL_TRAINING:
        return <SkillTrainingStep context={context} onAdvance={advance} />;
      case Phase.COMMISSION_OR_ADVANCEMENT:
        return <AdvancementStep context={context} onAdvance={advance} />;
      case Phase.RANK_BONUS:
      case Phase.TERM_NARRATIVE:
      case Phase.AGING_CHECK:
        return <AgingStep phase={phase} context={context} onAdvance={advance} />;
      case Phase.TERM_END_DECISION:
        return <TermEndStep context={context} onAdvance={advance} />;
      case Phase.MUSTERING_OUT:
        return <MusteringOutStep context={context} onAdvance={advance} />;
      case Phase.FINALIZE_CONTACTS:
        return <FinalizeStep onAdvance={advance} />;
      case Phase.CHARACTER_SHEET:
        return <CharacterSheetStep />;
      default:
        return (
          <div>
            <p>Phase: {phase}</p>
            <p>This phase is not yet implemented.</p>
            <button type="button" onClick={() => advance({ type: 'CONTINUE' })}>Skip</button>
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
