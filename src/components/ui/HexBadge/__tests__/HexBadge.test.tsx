import { render, screen } from '@testing-library/react';
import { HexBadge } from '../HexBadge';

describe('HexBadge', () => {
  it('renders the value', () => {
    render(<HexBadge value={8} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders a label when provided', () => {
    render(<HexBadge value={7} label="STR" />);
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders DM when provided', () => {
    render(<HexBadge value={9} dm={1} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders negative DM with minus sign', () => {
    render(<HexBadge value={4} dm={-1} />);
    expect(screen.getByText('−1')).toBeInTheDocument();
  });

  it('renders +0 DM when modifier is zero', () => {
    const { container } = render(<HexBadge value={7} dm={0} />);
    const dmEl = container.querySelector('.hex-badge__dm');
    expect(dmEl).toBeInTheDocument();
    expect(dmEl).toHaveTextContent('+0');
  });

  it('applies the correct size class', () => {
    const { container } = render(<HexBadge value={5} size="lg" />);
    expect(container.firstChild).toHaveClass('hex-badge--lg');
  });

  it('applies the empty variant class', () => {
    const { container } = render(<HexBadge value="?" variant="empty" />);
    expect(container.firstChild).toHaveClass('hex-badge--empty');
  });

  it('applies additional className', () => {
    const { container } = render(<HexBadge value={8} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
