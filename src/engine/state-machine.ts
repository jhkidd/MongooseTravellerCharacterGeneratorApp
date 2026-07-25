export enum Phase {
  BACKGROUND = 'BACKGROUND',
  CHARACTERISTICS = 'CHARACTERISTICS',
  BACKGROUND_SKILLS = 'BACKGROUND_SKILLS',
  TERM_START = 'TERM_START',
  PRE_CAREER_SELECTION = 'PRE_CAREER_SELECTION',
  EDUCATION_ENTRY_ROLL = 'EDUCATION_ENTRY_ROLL',
  EDUCATION_EVENTS = 'EDUCATION_EVENTS',
  GRADUATION_ROLL = 'GRADUATION_ROLL',
  CAREER_SELECTION = 'CAREER_SELECTION',
  QUALIFICATION_ROLL = 'QUALIFICATION_ROLL',
  DRAFT_OR_DRIFTER = 'DRAFT_OR_DRIFTER',
  CAREER_ACTIVE = 'CAREER_ACTIVE',
  SURVIVAL_ROLL = 'SURVIVAL_ROLL',
  MISHAP_RESOLUTION = 'MISHAP_RESOLUTION',
  EVENT_ROLL = 'EVENT_ROLL',
  EVENT_RESOLUTION = 'EVENT_RESOLUTION',
  SKILL_TRAINING = 'SKILL_TRAINING',
  COMMISSION_OR_ADVANCEMENT = 'COMMISSION_OR_ADVANCEMENT',
  RANK_BONUS = 'RANK_BONUS',
  TERM_NARRATIVE = 'TERM_NARRATIVE',
  AGING_CHECK = 'AGING_CHECK',
  TERM_END_DECISION = 'TERM_END_DECISION',
  MUSTERING_OUT = 'MUSTERING_OUT',
  FINALIZE_CONTACTS = 'FINALIZE_CONTACTS',
  CHARACTER_SHEET = 'CHARACTER_SHEET',
}

export interface PhaseContext {
  currentTerm: number;
  currentCareer: string | null;
  currentAssignment: string | null;
  isOfficer: boolean;
  previousCareers: string[];
  forcedCareer: string | null;
  autoPromote: boolean;
  pendingAdvancementDM: number;
  preCareerCompleted: boolean;
  commissionAttempted: boolean;
}

export function createInitialContext(): PhaseContext {
  return {
    currentTerm: 0,
    currentCareer: null,
    currentAssignment: null,
    isOfficer: false,
    previousCareers: [],
    forcedCareer: null,
    autoPromote: false,
    pendingAdvancementDM: 0,
    preCareerCompleted: false,
    commissionAttempted: false,
  };
}

export type PhaseAction =
  | { type: 'CONTINUE' }
  | { type: 'CHOOSE_PRE_CAREER' }
  | { type: 'CHOOSE_CAREER' }
  | { type: 'CONTINUE_CAREER' }
  | { type: 'SELECT_CAREER'; careerId: string }
  | { type: 'SELECT_DRIFTER' }
  | { type: 'ROLL_SUCCESS' }
  | { type: 'ROLL_FAILURE' }
  | { type: 'SWITCH_CAREER' }
  | { type: 'MUSTER_OUT' }
  | { type: 'FORCE_TRANSITION'; targetPhase: Phase }
  | { type: 'FORCE_CAREER'; careerId: string }
  | { type: 'AUTO_PROMOTE' };

export function getNextPhase(
  currentPhase: Phase,
  action: PhaseAction,
  context: PhaseContext,
): { phase: Phase; context: PhaseContext } {
  const ctx = { ...context };

  if (action.type === 'FORCE_TRANSITION') {
    return { phase: action.targetPhase, context: ctx };
  }

  if (action.type === 'FORCE_CAREER') {
    ctx.forcedCareer = action.careerId;
    return { phase: currentPhase, context: ctx };
  }

  if (action.type === 'AUTO_PROMOTE') {
    ctx.autoPromote = true;
    return { phase: currentPhase, context: ctx };
  }

  switch (currentPhase) {
    case Phase.BACKGROUND:
      return { phase: Phase.CHARACTERISTICS, context: ctx };

    case Phase.CHARACTERISTICS:
      return { phase: Phase.BACKGROUND_SKILLS, context: ctx };

    case Phase.BACKGROUND_SKILLS:
      ctx.currentTerm = 1;
      return { phase: Phase.TERM_START, context: ctx };

    case Phase.TERM_START:
      if (action.type === 'CHOOSE_PRE_CAREER') {
        return { phase: Phase.PRE_CAREER_SELECTION, context: ctx };
      }

      if (action.type === 'CONTINUE_CAREER') {
        return { phase: Phase.CAREER_ACTIVE, context: ctx };
      }

      return { phase: Phase.CAREER_SELECTION, context: ctx };

    case Phase.PRE_CAREER_SELECTION:
      return { phase: Phase.EDUCATION_ENTRY_ROLL, context: ctx };

    case Phase.EDUCATION_ENTRY_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.EDUCATION_EVENTS, context: ctx };
      }

      return { phase: Phase.CAREER_SELECTION, context: ctx };

    case Phase.EDUCATION_EVENTS:
      return { phase: Phase.GRADUATION_ROLL, context: ctx };

    case Phase.GRADUATION_ROLL:
      ctx.preCareerCompleted = true;
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    case Phase.CAREER_SELECTION:
      if (action.type === 'SELECT_DRIFTER') {
        ctx.currentCareer = 'drifter';
        return { phase: Phase.CAREER_ACTIVE, context: ctx };
      }

      if (action.type === 'SELECT_CAREER') {
        ctx.currentCareer = action.careerId;
        return { phase: Phase.QUALIFICATION_ROLL, context: ctx };
      }

      return { phase: Phase.QUALIFICATION_ROLL, context: ctx };

    case Phase.QUALIFICATION_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.CAREER_ACTIVE, context: ctx };
      }

      return { phase: Phase.DRAFT_OR_DRIFTER, context: ctx };

    case Phase.DRAFT_OR_DRIFTER:
      return { phase: Phase.CAREER_ACTIVE, context: ctx };

    case Phase.CAREER_ACTIVE:
      return { phase: Phase.SURVIVAL_ROLL, context: ctx };

    case Phase.SURVIVAL_ROLL:
      if (action.type === 'ROLL_FAILURE') {
        return { phase: Phase.MISHAP_RESOLUTION, context: ctx };
      }

      return { phase: Phase.EVENT_ROLL, context: ctx };

    case Phase.MISHAP_RESOLUTION:
      ctx.currentCareer = null;
      ctx.currentAssignment = null;
      ctx.isOfficer = false;
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    case Phase.EVENT_ROLL:
      return { phase: Phase.EVENT_RESOLUTION, context: ctx };

    case Phase.EVENT_RESOLUTION:
      return { phase: Phase.SKILL_TRAINING, context: ctx };

    case Phase.SKILL_TRAINING:
      return { phase: Phase.COMMISSION_OR_ADVANCEMENT, context: ctx };

    case Phase.COMMISSION_OR_ADVANCEMENT:
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.RANK_BONUS, context: ctx };
      }

      return { phase: Phase.TERM_NARRATIVE, context: ctx };

    case Phase.RANK_BONUS:
      return { phase: Phase.TERM_NARRATIVE, context: ctx };

    case Phase.TERM_NARRATIVE:
      return { phase: Phase.AGING_CHECK, context: ctx };

    case Phase.AGING_CHECK:
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    case Phase.TERM_END_DECISION:
      if (action.type === 'MUSTER_OUT') {
        return { phase: Phase.MUSTERING_OUT, context: ctx };
      }

      if (action.type === 'SWITCH_CAREER') {
        if (ctx.currentCareer) {
          ctx.previousCareers = [...ctx.previousCareers, ctx.currentCareer];
        }

        ctx.currentCareer = null;
        ctx.currentAssignment = null;
        ctx.isOfficer = false;
        ctx.commissionAttempted = false;
        ctx.currentTerm += 1;
        return { phase: Phase.TERM_START, context: ctx };
      }

      ctx.currentTerm += 1;
      return { phase: Phase.TERM_START, context: ctx };

    case Phase.MUSTERING_OUT:
      return { phase: Phase.FINALIZE_CONTACTS, context: ctx };

    case Phase.FINALIZE_CONTACTS:
      return { phase: Phase.CHARACTER_SHEET, context: ctx };

    default:
      return { phase: currentPhase, context: ctx };
  }
}

export function canAttemptPreCareer(context: PhaseContext): boolean {
  return context.currentTerm >= 1
    && context.currentTerm <= 3
    && !context.preCareerCompleted;
}
