import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TradePage } from '../TradePage';

const SOURCE_UWP = 'Regina 1910 C875A97-A Ri Pa Ph';
const DEST_UWP = 'Efate 1705 B564977-9 Ni Pa';

async function enterWorlds(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/source world uwp/i), SOURCE_UWP);
  await user.type(screen.getByLabelText(/destination world uwp/i), DEST_UWP);
}

describe('TradePage', () => {
  it('renders the header and tabs', () => {
    render(<TradePage />);
    expect(screen.getByRole('heading', { name: /^trade$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /passengers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /freight & mail/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /speculative trade/i })).toBeInTheDocument();
  });

  it('prompts for both worlds before showing calculators', () => {
    render(<TradePage />);
    expect(screen.getByText(/enter and parse both a source and destination world uwp/i)).toBeInTheDocument();
  });

  it('parses a pasted UWP and shows a manual roll flow on the Passengers tab', async () => {
    const user = userEvent.setup();
    render(<TradePage />);

    await enterWorlds(user);

    expect(screen.getAllByText(/parsed: starport/i).length).toBe(2);
    expect(screen.getByRole('heading', { name: /passenger traffic/i })).toBeInTheDocument();

    const rollButtons = screen.getAllByRole('button', { name: /roll traffic/i });
    await user.click(rollButtons[0]);

    expect(screen.getByText(/total fares/i)).toBeInTheDocument();
  });

  it('supports a manual-override flow on the Freight & Mail tab', async () => {
    const user = userEvent.setup();
    render(<TradePage />);

    await enterWorlds(user);
    await user.click(screen.getByRole('button', { name: /freight & mail/i }));

    expect(screen.getByRole('heading', { name: /freight traffic/i })).toBeInTheDocument();

    const tonnageInputs = screen.getAllByPlaceholderText('0');
    await user.type(tonnageInputs[1], '15');
    expect((tonnageInputs[1] as HTMLInputElement).value).toBe('15');
  });

  it('rolls available goods on the Speculative Trade tab', async () => {
    const user = userEvent.setup();
    render(<TradePage />);

    await enterWorlds(user);
    await user.click(screen.getByRole('button', { name: /speculative trade/i }));

    await user.click(screen.getByRole('button', { name: /roll available goods/i }));

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
