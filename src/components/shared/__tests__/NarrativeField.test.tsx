import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NarrativeField } from '../NarrativeField';

describe('NarrativeField', () => {
  it('renders the prompt text', () => {
    render(<NarrativeField prompt="Describe your homeworld" value="" onChange={() => {}} />);
    expect(screen.getByText('Describe your homeworld')).toBeInTheDocument();
  });

  it('renders a text area', () => {
    render(<NarrativeField prompt="Notes" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(<NarrativeField prompt="Notes" value="A dusty frontier world" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('A dusty frontier world');
  });

  it('calls onChange when text is entered', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NarrativeField prompt="Notes" value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'Hello');
    expect(onChange).toHaveBeenCalled();
  });
});
