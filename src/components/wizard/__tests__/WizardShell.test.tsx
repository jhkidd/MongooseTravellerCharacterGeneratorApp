import { render, screen } from '@testing-library/react';
import { WizardShell } from '../WizardShell';
import { CharacterProvider } from '../../../context/CharacterContext';

function renderWithProvider() {
  return render(
    <CharacterProvider>
      <WizardShell />
    </CharacterProvider>,
  );
}

describe('WizardShell', () => {
  it('renders the initial BACKGROUND phase', () => {
    renderWithProvider();
    expect(screen.getByRole('heading', { name: /^background$/i })).toBeInTheDocument();
  });

  it('renders within the wizard container', () => {
    const { container } = renderWithProvider();
    expect(container.querySelector('.wizard-shell')).toBeInTheDocument();
  });
});
