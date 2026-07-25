import {
  Phase,
  getNextPhase,
  createInitialContext,
  canAttemptPreCareer,
  type PhaseContext,
} from '../state-machine';

describe('Phase enum', () => {
  it('has all expected phases', () => {
    expect(Phase.BACKGROUND).toBe('BACKGROUND');
    expect(Phase.CHARACTERISTICS).toBe('CHARACTERISTICS');
    expect(Phase.BACKGROUND_SKILLS).toBe('BACKGROUND_SKILLS');
    expect(Phase.TERM_START).toBe('TERM_START');
    expect(Phase.PRE_CAREER_SELECTION).toBe('PRE_CAREER_SELECTION');
    expect(Phase.EDUCATION_ENTRY_ROLL).toBe('EDUCATION_ENTRY_ROLL');
    expect(Phase.EDUCATION_EVENTS).toBe('EDUCATION_EVENTS');
    expect(Phase.GRADUATION_ROLL).toBe('GRADUATION_ROLL');
    expect(Phase.CAREER_SELECTION).toBe('CAREER_SELECTION');
    expect(Phase.QUALIFICATION_ROLL).toBe('QUALIFICATION_ROLL');
    expect(Phase.DRAFT_OR_DRIFTER).toBe('DRAFT_OR_DRIFTER');
    expect(Phase.CAREER_ACTIVE).toBe('CAREER_ACTIVE');
    expect(Phase.SURVIVAL_ROLL).toBe('SURVIVAL_ROLL');
    expect(Phase.MISHAP_RESOLUTION).toBe('MISHAP_RESOLUTION');
    expect(Phase.EVENT_ROLL).toBe('EVENT_ROLL');
    expect(Phase.EVENT_RESOLUTION).toBe('EVENT_RESOLUTION');
    expect(Phase.SKILL_TRAINING).toBe('SKILL_TRAINING');
    expect(Phase.COMMISSION_OR_ADVANCEMENT).toBe('COMMISSION_OR_ADVANCEMENT');
    expect(Phase.RANK_BONUS).toBe('RANK_BONUS');
    expect(Phase.TERM_NARRATIVE).toBe('TERM_NARRATIVE');
    expect(Phase.AGING_CHECK).toBe('AGING_CHECK');
    expect(Phase.TERM_END_DECISION).toBe('TERM_END_DECISION');
    expect(Phase.MUSTERING_OUT).toBe('MUSTERING_OUT');
    expect(Phase.FINALIZE_CONTACTS).toBe('FINALIZE_CONTACTS');
    expect(Phase.CHARACTER_SHEET).toBe('CHARACTER_SHEET');
  });
});

describe('createInitialContext', () => {
  it('creates context with term 0 and no career', () => {
    const ctx = createInitialContext();
    expect(ctx.currentTerm).toBe(0);
    expect(ctx.currentCareer).toBeNull();
    expect(ctx.currentAssignment).toBeNull();
    expect(ctx.isOfficer).toBe(false);
    expect(ctx.previousCareers).toEqual([]);
    expect(ctx.forcedCareer).toBeNull();
    expect(ctx.autoPromote).toBe(false);
    expect(ctx.pendingAdvancementDM).toBe(0);
    expect(ctx.preCareerCompleted).toBe(false);
    expect(ctx.commissionAttempted).toBe(false);
  });
});

describe('getNextPhase — early flow', () => {
  it('BACKGROUND → CHARACTERISTICS on CONTINUE', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.BACKGROUND, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.CHARACTERISTICS);
  });

  it('CHARACTERISTICS → BACKGROUND_SKILLS on CONTINUE', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.CHARACTERISTICS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.BACKGROUND_SKILLS);
  });

  it('BACKGROUND_SKILLS → TERM_START on CONTINUE (increments term to 1)', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.BACKGROUND_SKILLS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.TERM_START);
    expect(result.context.currentTerm).toBe(1);
  });
});

describe('getNextPhase — term start branching', () => {
  it('TERM_START → PRE_CAREER_SELECTION when choosing pre-career (term 1)', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.TERM_START, { type: 'CHOOSE_PRE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.PRE_CAREER_SELECTION);
  });

  it('TERM_START → CAREER_SELECTION when choosing career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.TERM_START, { type: 'CHOOSE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_SELECTION);
  });

  it('TERM_START → CAREER_ACTIVE when continuing same career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 2, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_START, { type: 'CONTINUE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
  });
});

describe('getNextPhase — pre-career education path', () => {
  it('PRE_CAREER_SELECTION → EDUCATION_ENTRY_ROLL', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.PRE_CAREER_SELECTION, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.EDUCATION_ENTRY_ROLL);
  });

  it('EDUCATION_ENTRY_ROLL → EDUCATION_EVENTS on success', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.EDUCATION_ENTRY_ROLL, { type: 'ROLL_SUCCESS' }, ctx);
    expect(result.phase).toBe(Phase.EDUCATION_EVENTS);
  });

  it('EDUCATION_ENTRY_ROLL → CAREER_SELECTION on failure', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.EDUCATION_ENTRY_ROLL, { type: 'ROLL_FAILURE' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_SELECTION);
  });

  it('EDUCATION_EVENTS → GRADUATION_ROLL', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.EDUCATION_EVENTS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.GRADUATION_ROLL);
  });

  it('GRADUATION_ROLL → TERM_END_DECISION on any outcome', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.GRADUATION_ROLL, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.TERM_END_DECISION);
    expect(result.context.preCareerCompleted).toBe(true);
  });
});

describe('getNextPhase — career selection path', () => {
  it('CAREER_SELECTION → QUALIFICATION_ROLL for normal career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.CAREER_SELECTION, { type: 'SELECT_CAREER', careerId: 'army' }, ctx);
    expect(result.phase).toBe(Phase.QUALIFICATION_ROLL);
    expect(result.context.currentCareer).toBe('army');
  });

  it('CAREER_SELECTION → CAREER_ACTIVE for Drifter (no qualification)', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.CAREER_SELECTION, { type: 'SELECT_DRIFTER' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
    expect(result.context.currentCareer).toBe('drifter');
  });

  it('QUALIFICATION_ROLL → CAREER_ACTIVE on success', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.QUALIFICATION_ROLL, { type: 'ROLL_SUCCESS' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
  });

  it('QUALIFICATION_ROLL → DRAFT_OR_DRIFTER on failure', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.QUALIFICATION_ROLL, { type: 'ROLL_FAILURE' }, ctx);
    expect(result.phase).toBe(Phase.DRAFT_OR_DRIFTER);
  });

  it('DRAFT_OR_DRIFTER → CAREER_ACTIVE', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1 };
    const result = getNextPhase(Phase.DRAFT_OR_DRIFTER, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.CAREER_ACTIVE);
  });
});

describe('getNextPhase — career term flow (corrected order)', () => {
  const baseCtx: PhaseContext = {
    ...createInitialContext(),
    currentTerm: 1,
    currentCareer: 'army',
    currentAssignment: 'infantry',
    commissionAttempted: false,
  };

  it('CAREER_ACTIVE → SURVIVAL_ROLL', () => {
    const result = getNextPhase(Phase.CAREER_ACTIVE, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.SURVIVAL_ROLL);
  });

  it('SURVIVAL_ROLL → MISHAP_RESOLUTION on failure', () => {
    const result = getNextPhase(Phase.SURVIVAL_ROLL, { type: 'ROLL_FAILURE' }, baseCtx);
    expect(result.phase).toBe(Phase.MISHAP_RESOLUTION);
  });

  it('SURVIVAL_ROLL → EVENT_ROLL on success', () => {
    const result = getNextPhase(Phase.SURVIVAL_ROLL, { type: 'ROLL_SUCCESS' }, baseCtx);
    expect(result.phase).toBe(Phase.EVENT_ROLL);
  });

  it('MISHAP_RESOLUTION → TERM_END_DECISION (ejected from career)', () => {
    const result = getNextPhase(Phase.MISHAP_RESOLUTION, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_END_DECISION);
    expect(result.context.currentCareer).toBeNull();
  });

  it('EVENT_ROLL → EVENT_RESOLUTION', () => {
    const result = getNextPhase(Phase.EVENT_ROLL, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.EVENT_RESOLUTION);
  });

  it('EVENT_RESOLUTION → SKILL_TRAINING', () => {
    const result = getNextPhase(Phase.EVENT_RESOLUTION, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.SKILL_TRAINING);
  });

  it('SKILL_TRAINING → COMMISSION_OR_ADVANCEMENT', () => {
    const result = getNextPhase(Phase.SKILL_TRAINING, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.COMMISSION_OR_ADVANCEMENT);
  });

  it('COMMISSION_OR_ADVANCEMENT → RANK_BONUS on success (promoted)', () => {
    const result = getNextPhase(Phase.COMMISSION_OR_ADVANCEMENT, { type: 'ROLL_SUCCESS' }, baseCtx);
    expect(result.phase).toBe(Phase.RANK_BONUS);
  });

  it('COMMISSION_OR_ADVANCEMENT → TERM_NARRATIVE on failure', () => {
    const result = getNextPhase(Phase.COMMISSION_OR_ADVANCEMENT, { type: 'ROLL_FAILURE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_NARRATIVE);
  });

  it('RANK_BONUS → TERM_NARRATIVE', () => {
    const result = getNextPhase(Phase.RANK_BONUS, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_NARRATIVE);
  });

  it('TERM_NARRATIVE → AGING_CHECK', () => {
    const result = getNextPhase(Phase.TERM_NARRATIVE, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.AGING_CHECK);
  });

  it('AGING_CHECK → TERM_END_DECISION', () => {
    const result = getNextPhase(Phase.AGING_CHECK, { type: 'CONTINUE' }, baseCtx);
    expect(result.phase).toBe(Phase.TERM_END_DECISION);
  });
});

describe('getNextPhase — term end decisions', () => {
  it('TERM_END_DECISION → TERM_START when continuing (increments term)', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_END_DECISION, { type: 'CONTINUE_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.TERM_START);
    expect(result.context.currentTerm).toBe(2);
  });

  it('TERM_END_DECISION → TERM_START when switching career', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_END_DECISION, { type: 'SWITCH_CAREER' }, ctx);
    expect(result.phase).toBe(Phase.TERM_START);
    expect(result.context.currentTerm).toBe(2);
    expect(result.context.currentCareer).toBeNull();
    expect(result.context.previousCareers).toContain('army');
  });

  it('TERM_END_DECISION → MUSTERING_OUT when choosing to muster out', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.TERM_END_DECISION, { type: 'MUSTER_OUT' }, ctx);
    expect(result.phase).toBe(Phase.MUSTERING_OUT);
  });
});

describe('getNextPhase — mustering out and end', () => {
  it('MUSTERING_OUT → FINALIZE_CONTACTS', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.MUSTERING_OUT, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.FINALIZE_CONTACTS);
  });

  it('FINALIZE_CONTACTS → CHARACTER_SHEET', () => {
    const ctx = createInitialContext();
    const result = getNextPhase(Phase.FINALIZE_CONTACTS, { type: 'CONTINUE' }, ctx);
    expect(result.phase).toBe(Phase.CHARACTER_SHEET);
  });
});

describe('getNextPhase — forced transitions', () => {
  it('FORCE_TRANSITION overrides from any phase', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.EVENT_RESOLUTION, { type: 'FORCE_TRANSITION', targetPhase: Phase.MUSTERING_OUT }, ctx);
    expect(result.phase).toBe(Phase.MUSTERING_OUT);
  });

  it('forced career sets forcedCareer in context', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(
      Phase.EVENT_RESOLUTION,
      { type: 'FORCE_CAREER', careerId: 'prisoner' },
      ctx,
    );
    expect(result.context.forcedCareer).toBe('prisoner');
  });

  it('auto-promote sets autoPromote flag', () => {
    const ctx = { ...createInitialContext(), currentTerm: 1, currentCareer: 'army' };
    const result = getNextPhase(Phase.EVENT_RESOLUTION, { type: 'AUTO_PROMOTE' }, ctx);
    expect(result.context.autoPromote).toBe(true);
  });
});

describe('canAttemptPreCareer', () => {
  it('returns true for terms 1-3 when not already completed', () => {
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 1 })).toBe(true);
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 2 })).toBe(true);
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 3 })).toBe(true);
  });

  it('returns false for term 4+', () => {
    expect(canAttemptPreCareer({ ...createInitialContext(), currentTerm: 4 })).toBe(false);
  });

  it('returns false if pre-career already completed', () => {
    expect(canAttemptPreCareer({
      ...createInitialContext(),
      currentTerm: 2,
      preCareerCompleted: true,
    })).toBe(false);
  });
});
