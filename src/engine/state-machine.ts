export const Phase = {
  BACKGROUND: 'BACKGROUND',
  CHARACTERISTICS: 'CHARACTERISTICS',
  BACKGROUND_SKILLS: 'BACKGROUND_SKILLS',
  TERM_START: 'TERM_START',
  PRE_CAREER_SELECTION: 'PRE_CAREER_SELECTION',
  EDUCATION_ENTRY_ROLL: 'EDUCATION_ENTRY_ROLL',
  EDUCATION_EVENTS: 'EDUCATION_EVENTS',
  GRADUATION_ROLL: 'GRADUATION_ROLL',
  CAREER_SELECTION: 'CAREER_SELECTION',
  ASSIGNMENT_SELECTION: 'ASSIGNMENT_SELECTION',
  QUALIFICATION_ROLL: 'QUALIFICATION_ROLL',
  DRAFT_OR_DRIFTER: 'DRAFT_OR_DRIFTER',
  ASSIGNMENT_CHANGE_ROLL: 'ASSIGNMENT_CHANGE_ROLL',
  BASIC_TRAINING: 'BASIC_TRAINING',
  SKILL_TRAINING: 'SKILL_TRAINING',
  SURVIVAL_ROLL: 'SURVIVAL_ROLL',
  MISHAP_RESOLUTION: 'MISHAP_RESOLUTION',
  EVENT_ROLL: 'EVENT_ROLL',
  EVENT_RESOLUTION: 'EVENT_RESOLUTION',
  COMMISSION_OR_ADVANCEMENT: 'COMMISSION_OR_ADVANCEMENT',
  RANK_BONUS: 'RANK_BONUS',
  TERM_NARRATIVE: 'TERM_NARRATIVE',
  AGING_CHECK: 'AGING_CHECK',
  TERM_END_DECISION: 'TERM_END_DECISION',
  CAREER_BENEFIT_ROLLS: 'CAREER_BENEFIT_ROLLS',
  MUSTERING_OUT: 'MUSTERING_OUT',
  FINALIZE_CONTACTS: 'FINALIZE_CONTACTS',
  PENSION_AND_DEBT: 'PENSION_AND_DEBT',
  CHARACTER_SHEET: 'CHARACTER_SHEET',
} as const;

export type Phase = typeof Phase[keyof typeof Phase];

/**
 * Careers where changing assignment is treated as staying in the same career.
 * Pass qualification to swap assignment, fail = stay in current assignment, keep rank.
 */
export const FLEXIBLE_ASSIGNMENT_CAREERS = ['army', 'marines', 'navy', 'nobility', 'rogue', 'scholar', 'scout'];

/**
 * Careers where changing assignment is treated as a new career entirely.
 * Must muster out, re-qualify, start at rank 0.
 */
export const RIGID_ASSIGNMENT_CAREERS = ['agent', 'citizen', 'entertainer', 'merchant'];

export interface PhaseContext {
  currentTerm: number;
  currentCareer: string | null;
  currentAssignment: string | null;
  termsInCurrentCareer: number;
  isOfficer: boolean;
  currentRank: number;
  previousCareers: string[];
  forcedCareer: string | null;
  autoPromote: boolean;
  pendingAdvancementDM: number;
  preCareerCompleted: boolean;
  commissionAttempted: boolean;
  /** Set when a player requests an assignment change within a flexible career */
  pendingAssignmentChange: string | null;
  /** Set when ejected from career via mishap - skip TERM_END_DECISION */
  ejectedFromCareer: boolean;
}

export function createInitialContext(): PhaseContext {
  return {
    currentTerm: 0,
    currentCareer: null,
    currentAssignment: null,
    termsInCurrentCareer: 0,
    isOfficer: false,
    currentRank: 0,
    previousCareers: [],
    forcedCareer: null,
    autoPromote: false,
    pendingAdvancementDM: 0,
    preCareerCompleted: false,
    commissionAttempted: false,
    pendingAssignmentChange: null,
    ejectedFromCareer: false,
  };
}

export type PhaseAction =
  | { type: 'CONTINUE' }
  | { type: 'CHOOSE_PRE_CAREER' }
  | { type: 'CHOOSE_CAREER' }
  | { type: 'CONTINUE_CAREER' }
  | { type: 'CONTINUE_CAREER_CHANGE_ASSIGNMENT'; assignmentId: string }
  | { type: 'SELECT_CAREER'; careerId: string }
  | { type: 'SELECT_ASSIGNMENT'; assignmentId: string }
  | { type: 'SELECT_DRIFTER' }
  | { type: 'ROLL_SUCCESS' }
  | { type: 'ROLL_FAILURE' }
  | { type: 'COMMISSION_SUCCESS' }
  | { type: 'SWITCH_CAREER' }
  | { type: 'MUSTER_OUT' }
  | { type: 'FORCE_TRANSITION'; targetPhase: Phase }
  | { type: 'FORCE_CAREER'; careerId: string }
  | { type: 'ADD_ADVANCEMENT_DM'; value: number }
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
    ctx.currentCareer = action.careerId;
    ctx.currentAssignment = null;
    return { phase: currentPhase, context: ctx };
  }

  if (action.type === 'AUTO_PROMOTE') {
    ctx.autoPromote = true;
    return { phase: currentPhase, context: ctx };
  }

  if (action.type === 'ADD_ADVANCEMENT_DM') {
    ctx.pendingAdvancementDM += action.value;
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

      // Continuing in the same career
      if (action.type === 'CONTINUE_CAREER') {
        ctx.termsInCurrentCareer += 1;
        return { phase: Phase.SKILL_TRAINING, context: ctx };
      }

      // Continuing in same career but requesting assignment change (flexible)
      if (action.type === 'CONTINUE_CAREER_CHANGE_ASSIGNMENT') {
        ctx.pendingAssignmentChange = action.assignmentId;
        return { phase: Phase.ASSIGNMENT_CHANGE_ROLL, context: ctx };
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
      ctx.currentTerm += 1;
      return { phase: Phase.TERM_START, context: ctx };

    case Phase.CAREER_SELECTION:
      if (action.type === 'SELECT_DRIFTER') {
        ctx.currentCareer = 'drifter';
        ctx.termsInCurrentCareer = 1;
        return { phase: Phase.ASSIGNMENT_SELECTION, context: ctx };
      }

      if (action.type === 'SELECT_CAREER') {
        ctx.currentCareer = action.careerId;
        return { phase: Phase.ASSIGNMENT_SELECTION, context: ctx };
      }

      return { phase: Phase.ASSIGNMENT_SELECTION, context: ctx };

    case Phase.ASSIGNMENT_SELECTION:
      if (action.type === 'SELECT_ASSIGNMENT') {
        ctx.currentAssignment = action.assignmentId;
      }
      // Drifter skips qualification
      if (ctx.currentCareer === 'drifter') {
        return { phase: Phase.BASIC_TRAINING, context: ctx };
      }
      return { phase: Phase.QUALIFICATION_ROLL, context: ctx };

    case Phase.QUALIFICATION_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        ctx.termsInCurrentCareer = 1;
        return { phase: Phase.BASIC_TRAINING, context: ctx };
      }

      return { phase: Phase.DRAFT_OR_DRIFTER, context: ctx };

    case Phase.DRAFT_OR_DRIFTER:
      ctx.termsInCurrentCareer = 1;
      return { phase: Phase.BASIC_TRAINING, context: ctx };

    case Phase.ASSIGNMENT_CHANGE_ROLL:
      if (action.type === 'ROLL_SUCCESS') {
        // Swap to new assignment, keep rank
        ctx.currentAssignment = ctx.pendingAssignmentChange;
        ctx.pendingAssignmentChange = null;
        ctx.termsInCurrentCareer += 1;
        return { phase: Phase.SKILL_TRAINING, context: ctx };
      }
      // Failed — stay in current assignment
      ctx.pendingAssignmentChange = null;
      ctx.termsInCurrentCareer += 1;
      return { phase: Phase.SKILL_TRAINING, context: ctx };

    case Phase.BASIC_TRAINING:
      return { phase: Phase.SURVIVAL_ROLL, context: ctx };

    case Phase.SKILL_TRAINING:
      return { phase: Phase.SURVIVAL_ROLL, context: ctx };

    case Phase.SURVIVAL_ROLL:
      if (action.type === 'ROLL_FAILURE') {
        return { phase: Phase.MISHAP_RESOLUTION, context: ctx };
      }

      return { phase: Phase.EVENT_ROLL, context: ctx };

    case Phase.MISHAP_RESOLUTION:
      // Some mishaps allow staying in the career
      if (action.type === 'ROLL_SUCCESS') {
        return { phase: Phase.EVENT_ROLL, context: ctx };
      }
      // Ejected from career - still age, then collect benefits
      ctx.ejectedFromCareer = true;
      return { phase: Phase.AGING_CHECK, context: ctx };

    case Phase.EVENT_ROLL:
      return { phase: Phase.EVENT_RESOLUTION, context: ctx };

    case Phase.EVENT_RESOLUTION:
      return { phase: Phase.COMMISSION_OR_ADVANCEMENT, context: ctx };

    case Phase.COMMISSION_OR_ADVANCEMENT:
      ctx.pendingAdvancementDM = 0;
      ctx.autoPromote = false;
      if (action.type === 'COMMISSION_SUCCESS') {
        ctx.isOfficer = true;
        ctx.commissionAttempted = true;
        ctx.currentRank = 1; // Officer rank starts at 1
        return { phase: Phase.RANK_BONUS, context: ctx };
      }
      if (action.type === 'ROLL_SUCCESS') {
        ctx.currentRank += 1;
        return { phase: Phase.RANK_BONUS, context: ctx };
      }

      return { phase: Phase.TERM_NARRATIVE, context: ctx };

    case Phase.RANK_BONUS:
      return { phase: Phase.TERM_NARRATIVE, context: ctx };

    case Phase.TERM_NARRATIVE:
      return { phase: Phase.AGING_CHECK, context: ctx };

    case Phase.AGING_CHECK:
      if (ctx.ejectedFromCareer) {
        ctx.ejectedFromCareer = false;
        return { phase: Phase.CAREER_BENEFIT_ROLLS, context: ctx };
      }
      return { phase: Phase.TERM_END_DECISION, context: ctx };

    case Phase.TERM_END_DECISION:
      if (action.type === 'MUSTER_OUT') {
        return { phase: Phase.CAREER_BENEFIT_ROLLS, context: ctx };
      }

      if (action.type === 'SWITCH_CAREER') {
        return { phase: Phase.CAREER_BENEFIT_ROLLS, context: ctx };
      }

      // Continue in same career - skip TERM_START, go straight to skill training
      ctx.currentTerm += 1;
      ctx.termsInCurrentCareer += 1;
      return { phase: Phase.SKILL_TRAINING, context: ctx };

    case Phase.CAREER_BENEFIT_ROLLS:
      if (action.type === 'MUSTER_OUT') {
        // Final muster out - done with careers
        if (ctx.currentCareer) {
          ctx.previousCareers = [...ctx.previousCareers, ctx.currentCareer];
        }
        ctx.currentCareer = null;
        ctx.currentAssignment = null;
        ctx.isOfficer = false;
        ctx.commissionAttempted = false;
        ctx.currentRank = 0;
        ctx.termsInCurrentCareer = 0;
        return { phase: Phase.FINALIZE_CONTACTS, context: ctx };
      }

      // Continue to next term (switching career or after mishap)
      if (ctx.currentCareer) {
        ctx.previousCareers = [...ctx.previousCareers, ctx.currentCareer];
      }
      ctx.currentCareer = null;
      ctx.currentAssignment = null;
      ctx.isOfficer = false;
      ctx.commissionAttempted = false;
      ctx.currentRank = 0;
      ctx.termsInCurrentCareer = 0;
      ctx.currentTerm += 1;
      return { phase: Phase.TERM_START, context: ctx };

    case Phase.MUSTERING_OUT:
      return { phase: Phase.FINALIZE_CONTACTS, context: ctx };

    case Phase.FINALIZE_CONTACTS:
      return { phase: Phase.PENSION_AND_DEBT, context: ctx };

    case Phase.PENSION_AND_DEBT:
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
