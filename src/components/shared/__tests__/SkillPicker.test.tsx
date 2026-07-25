import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillPicker } from '../SkillPicker';

describe('SkillPicker', () => {
  const skills = ['Admin', 'Animals', 'Athletics', 'Medic', 'Streetwise'];

  it('renders all skill options', () => {
    render(<SkillPicker skills={skills} maxPicks={3} selected={[]} onToggle={() => {}} />);
    skills.forEach((s) => {
      expect(screen.getByText(s)).toBeInTheDocument();
    });
  });

  it('shows selected skills as active', () => {
    const { container } = render(
      <SkillPicker skills={skills} maxPicks={3} selected={['Admin', 'Medic']} onToggle={() => {}} />,
    );
    const activeButtons = container.querySelectorAll('.skill-picker__skill--selected');
    expect(activeButtons).toHaveLength(2);
  });

  it('calls onToggle when a skill is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<SkillPicker skills={skills} maxPicks={3} selected={[]} onToggle={onToggle} />);
    await user.click(screen.getByText('Admin'));
    expect(onToggle).toHaveBeenCalledWith('Admin');
  });

  it('disables unselected skills when max picks reached', () => {
    const { container } = render(
      <SkillPicker skills={skills} maxPicks={2} selected={['Admin', 'Medic']} onToggle={() => {}} />,
    );
    const disabledButtons = container.querySelectorAll('.skill-picker__skill:disabled');
    expect(disabledButtons).toHaveLength(3);
  });

  it('displays remaining picks count', () => {
    render(<SkillPicker skills={skills} maxPicks={3} selected={['Admin']} onToggle={() => {}} />);
    expect(screen.getByText(/2 remaining/i)).toBeInTheDocument();
  });
});
