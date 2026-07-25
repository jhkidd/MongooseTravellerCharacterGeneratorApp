import { render, screen } from '@testing-library/react';
import { SuccessChance } from '../SuccessChance';

describe('SuccessChance', () => {
  it('displays the percentage chance for a basic check', () => {
    render(<SuccessChance baseTarget={8} dm={0} />);

    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('applies DM to adjust the effective target', () => {
    render(<SuccessChance baseTarget={8} dm={1} />);

    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  it('applies negative DM correctly', () => {
    render(<SuccessChance baseTarget={6} dm={-1} />);

    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  it('shows 100% for very easy checks', () => {
    render(<SuccessChance baseTarget={3} dm={2} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows 0% for impossible checks', () => {
    render(<SuccessChance baseTarget={12} dm={-2} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders a label when provided', () => {
    render(<SuccessChance baseTarget={8} dm={0} label="Qualification" />);

    expect(screen.getByText('Qualification')).toBeInTheDocument();
  });

  it('renders tiered outcomes', () => {
    render(
      <SuccessChance
        baseTarget={7}
        dm={0}
        label="Graduation"
        tiers={[{ label: 'With Honors', baseTarget: 11 }]}
      />,
    );

    expect(screen.getByText('58%')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();
    expect(screen.getByText('Graduation')).toBeInTheDocument();
    expect(screen.getByText('With Honors')).toBeInTheDocument();
  });

  it('applies success color class when chance is high', () => {
    const { container } = render(<SuccessChance baseTarget={4} dm={0} />);

    expect(
      container.querySelector('.success-chance--high'),
    ).toBeInTheDocument();
  });

  it('applies failure color class when chance is low', () => {
    const { container } = render(<SuccessChance baseTarget={11} dm={0} />);

    expect(
      container.querySelector('.success-chance--low'),
    ).toBeInTheDocument();
  });

  it('applies medium color class for moderate chances', () => {
    const { container } = render(<SuccessChance baseTarget={8} dm={0} />);

    expect(
      container.querySelector('.success-chance--medium'),
    ).toBeInTheDocument();
  });
});
