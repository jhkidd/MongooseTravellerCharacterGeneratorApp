import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackgroundStep } from '../BackgroundStep';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider(onContinue = vi.fn()) {
  return {
    ...render(
      <CharacterProvider>
        <BackgroundStep onContinue={onContinue} />
      </CharacterProvider>,
    ),
    onContinue,
  };
}

describe('BackgroundStep', () => {
  it('renders the species selection heading', () => {
    renderWithProvider();
    expect(screen.getByText(/choose your species/i)).toBeInTheDocument();
  });

  it('renders species cards for each option', () => {
    renderWithProvider();
    expect(screen.getByText('Human')).toBeInTheDocument();
    expect(screen.getByText('Aslan')).toBeInTheDocument();
    expect(screen.getByText('Vargr')).toBeInTheDocument();
  });

  it('shows characteristic modifiers on species cards', () => {
    renderWithProvider();
    expect(screen.getByText('STR +2')).toBeInTheDocument();
    expect(screen.getByText('DEX -2')).toBeInTheDocument();
  });

  it('human is selected by default', () => {
    renderWithProvider();
    const humanBtn = screen.getByRole('button', { pressed: true });
    expect(humanBtn).toHaveTextContent('Human');
  });

  it('allows selecting a different species', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    const cards = screen.getAllByRole('button', { name: /aslan/i });
    const aslanBtn = cards[0];
    await user.click(aslanBtn);
    expect(aslanBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onContinue when continue is clicked', async () => {
    const user = userEvent.setup();
    const { onContinue } = renderWithProvider();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalled();
  });
});
