import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoicePanel } from '../ChoicePanel';

describe('ChoicePanel', () => {
  it('renders prompt and options', () => {
    render(
      <ChoicePanel
        prompt="Choose wisely"
        options={[
          { label: 'Option A', description: 'First option' },
          { label: 'Option B' },
        ]}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText('Choose wisely')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /option a/i })).toBeInTheDocument();
    expect(screen.getByText('First option')).toBeInTheDocument();
  });

  it('calls onSelect with the chosen index', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ChoicePanel
        prompt="Choose wisely"
        options={[
          { label: 'Option A' },
          { label: 'Option B' },
        ]}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /option b/i }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
