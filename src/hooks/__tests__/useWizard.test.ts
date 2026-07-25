import { renderHook, act } from '@testing-library/react';
import { useWizard } from '../useWizard';
import { Phase } from '../../engine/state-machine';

describe('useWizard', () => {
  it('starts at BACKGROUND phase', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.phase).toBe(Phase.BACKGROUND);
  });

  it('advances through early phases', () => {
    const { result } = renderHook(() => useWizard());

    act(() => result.current.advance({ type: 'CONTINUE' }));
    expect(result.current.phase).toBe(Phase.CHARACTERISTICS);

    act(() => result.current.advance({ type: 'CONTINUE' }));
    expect(result.current.phase).toBe(Phase.BACKGROUND_SKILLS);

    act(() => result.current.advance({ type: 'CONTINUE' }));
    expect(result.current.phase).toBe(Phase.TERM_START);
    expect(result.current.context.currentTerm).toBe(1);
  });

  it('tracks phase history', () => {
    const { result } = renderHook(() => useWizard());
    act(() => result.current.advance({ type: 'CONTINUE' }));
    act(() => result.current.advance({ type: 'CONTINUE' }));
    expect(result.current.history).toHaveLength(2);
  });
});
