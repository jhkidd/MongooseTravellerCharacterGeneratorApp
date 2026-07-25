import { act, render, screen } from '@testing-library/react';
import { CharacterProvider, useCharacter } from '../CharacterContext';

function TestConsumer() {
  const { character, dispatch } = useCharacter();

  return (
    <div>
      <span data-testid="name">{character.name || '(unnamed)'}</span>
      <span data-testid="age">{character.age}</span>
      <button onClick={() => dispatch({ type: 'SET_NAME', name: 'Aria' })}>
        Set Name
      </button>
    </div>
  );
}

describe('CharacterContext', () => {
  it('provides a blank character by default', () => {
    render(
      <CharacterProvider>
        <TestConsumer />
      </CharacterProvider>,
    );

    expect(screen.getByTestId('name')).toHaveTextContent('(unnamed)');
    expect(screen.getByTestId('age')).toHaveTextContent('18');
  });

  it('dispatches actions to update character state', async () => {
    render(
      <CharacterProvider>
        <TestConsumer />
      </CharacterProvider>,
    );

    await act(async () => {
      screen.getByText('Set Name').click();
    });

    expect(screen.getByTestId('name')).toHaveTextContent('Aria');
  });

  it('throws if useCharacter is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useCharacter must be used within a CharacterProvider',
    );

    spy.mockRestore();
  });
});
