import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiceGroup } from '../DiceGroup';

vi.mock('../../../../engine/dice', () => {
  let callCount = 0;
  const values = [3, 4, 2, 5, 6, 1, 4, 3, 5, 2, 1, 6];

  return {
    rollD6: () => {
      const val = values[callCount % values.length];
      callCount++;
      return val;
    },
  };
});

describe('DiceGroup', () => {
  it('renders a Roll button', () => {
    render(<DiceGroup count={1} onResult={() => {}} />);
    expect(screen.getByRole('button', { name: /roll/i })).toBeInTheDocument();
  });

  it('renders the correct label', () => {
    render(<DiceGroup count={2} onResult={() => {}} label="Roll Characteristics" />);
    expect(screen.getByText('Roll Characteristics')).toBeInTheDocument();
  });

  it('renders dice pairs after clicking Roll', async () => {
    const user = userEvent.setup();
    const { container } = render(<DiceGroup count={2} onResult={() => {}} />);

    await user.click(screen.getByRole('button', { name: /roll/i }));

    const scenes = container.querySelectorAll('.dice3d-scene');
    expect(scenes.length).toBe(4);
  });

  it('disables the Roll button while rolling', async () => {
    const user = userEvent.setup();
    render(<DiceGroup count={1} onResult={() => {}} />);

    await user.click(screen.getByRole('button', { name: /roll/i }));

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows result totals after dice are rendered', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    const { container } = render(<DiceGroup count={2} onResult={onResult} />);

    await user.click(screen.getByRole('button', { name: /roll/i }));

    const resultElements = container.querySelectorAll('.dice-group__result-value');
    expect(resultElements.length).toBe(2);
    expect(resultElements[0].textContent).toBe('7');
    expect(resultElements[1].textContent).toBe('7');
  });
});
