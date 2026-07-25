import { render, screen } from '@testing-library/react';
import { CharacterSummary } from '../CharacterSummary';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider() {
  return render(
    <CharacterProvider>
      <CharacterSummary />
    </CharacterProvider>,
  );
}

describe('CharacterSummary', () => {
  it('renders the sidebar heading', () => {
    renderWithProvider();
    expect(screen.getByRole('heading', { name: /^traveller$/i })).toBeInTheDocument();
  });

  it('displays age', () => {
    renderWithProvider();
    expect(screen.getByText(/age\s*18/i)).toBeInTheDocument();
  });

  it('displays all six characteristics', () => {
    renderWithProvider();
    ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('shows term 0 initially', () => {
    renderWithProvider();
    expect(screen.getByText(/term 0/i)).toBeInTheDocument();
  });
});
