import { render, screen } from '@testing-library/react';
import { CharacteristicsStep } from '../CharacteristicsStep';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider(onContinue = vi.fn()) {
  return {
    ...render(
      <CharacterProvider>
        <CharacteristicsStep onContinue={onContinue} />
      </CharacterProvider>,
    ),
    onContinue,
  };
}

describe('CharacteristicsStep', () => {
  it('renders the Characteristics heading', () => {
    renderWithProvider();
    expect(screen.getByText(/characteristics/i)).toBeInTheDocument();
  });

  it('shows a Roll button initially', () => {
    renderWithProvider();
    expect(screen.getByRole('button', { name: /roll/i })).toBeInTheDocument();
  });

  it('renders 6 drop target slots', () => {
    const { container } = renderWithProvider();
    const slots = container.querySelectorAll('.char-slot');
    expect(slots).toHaveLength(6);
  });

  it('labels all six characteristics', () => {
    renderWithProvider();
    ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('Continue button is disabled until all slots are filled', () => {
    renderWithProvider();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});
