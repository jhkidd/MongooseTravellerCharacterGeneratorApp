import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackgroundSkillsStep } from '../BackgroundSkillsStep';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider(onContinue = vi.fn()) {
  return {
    ...render(
      <CharacterProvider>
        <BackgroundSkillsStep onContinue={onContinue} />
      </CharacterProvider>,
    ),
    onContinue,
  };
}

describe('BackgroundSkillsStep', () => {
  it('renders the heading', () => {
    renderWithProvider();
    expect(screen.getByText(/background skills/i)).toBeInTheDocument();
  });

  it('shows the skill picker with background skills', () => {
    renderWithProvider();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Streetwise')).toBeInTheDocument();
    expect(screen.getByText('Vacc Suit')).toBeInTheDocument();
  });

  it('Continue is disabled until correct number of skills picked', () => {
    renderWithProvider();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('allows toggling skills on and off', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByText('Admin'));
    expect(screen.getByText('Admin').closest('button')).toHaveClass('skill-picker__skill--selected');
    await user.click(screen.getByText('Admin'));
    expect(screen.getByText('Admin').closest('button')).not.toHaveClass('skill-picker__skill--selected');
  });
});
