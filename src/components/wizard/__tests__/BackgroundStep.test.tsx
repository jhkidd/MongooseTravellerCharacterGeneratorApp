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
  it('renders the Background heading', () => {
    renderWithProvider();
    expect(screen.getByText(/background/i)).toBeInTheDocument();
  });

  it('has a name input field', () => {
    renderWithProvider();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('has a species selector', () => {
    renderWithProvider();
    expect(screen.getByLabelText(/species/i)).toBeInTheDocument();
  });

  it('has a homeworld input', () => {
    renderWithProvider();
    expect(screen.getByLabelText(/homeworld/i)).toBeInTheDocument();
  });

  it('Continue button is disabled until name is provided', async () => {
    const user = userEvent.setup();
    renderWithProvider();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    await user.type(screen.getByLabelText(/name/i), 'Marcus');
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('calls onContinue when form is submitted', async () => {
    const user = userEvent.setup();
    const { onContinue } = renderWithProvider();
    await user.type(screen.getByLabelText(/name/i), 'Marcus');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalled();
  });
});
