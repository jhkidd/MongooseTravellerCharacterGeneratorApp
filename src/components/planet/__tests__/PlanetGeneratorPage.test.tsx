import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanetGeneratorPage } from '../PlanetGeneratorPage';

describe('PlanetGeneratorPage', () => {
  it('renders the header and no results before generating', () => {
    render(<PlanetGeneratorPage />);
    expect(screen.getByRole('heading', { name: /planet generator/i })).toBeInTheDocument();
    expect(screen.getByText(/no world generated yet/i)).toBeInTheDocument();
  });

  it('shows a UWP string and results panel after clicking Generate Planet', async () => {
    const user = userEvent.setup();
    render(<PlanetGeneratorPage />);

    await user.click(screen.getByRole('button', { name: /generate planet/i }));

    expect(screen.getByRole('heading', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /physical/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /society/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /starport & bases/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate another/i })).toBeInTheDocument();
  });

  it('fills in name and location fields when randomizing', async () => {
    const user = userEvent.setup();
    render(<PlanetGeneratorPage />);

    const nameInput = screen.getByLabelText(/^name$/i) as HTMLInputElement;
    const locationInput = screen.getByLabelText(/sector location/i) as HTMLInputElement;
    expect(nameInput.value).toBe('');
    expect(locationInput.value).toBe('');

    await user.click(screen.getByRole('button', { name: /randomize name/i }));

    expect(nameInput.value.length).toBeGreaterThan(0);
    expect(locationInput.value).toMatch(/^\d{4}$/);
  });
});
