import { render, screen } from '@testing-library/react';
import { ChamferedHeader } from '../ChamferedHeader';

describe('ChamferedHeader', () => {
  it('renders children text', () => {
    render(<ChamferedHeader>Characteristics</ChamferedHeader>);
    expect(screen.getByText('Characteristics')).toBeInTheDocument();
  });

  it('renders as h2 by default', () => {
    render(<ChamferedHeader>Title</ChamferedHeader>);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Title');
  });

  it('renders as h1 when level=1', () => {
    render(<ChamferedHeader level={1}>Big Title</ChamferedHeader>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders as h3 when level=3', () => {
    render(<ChamferedHeader level={3}>Small Title</ChamferedHeader>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('applies the chamfered-header class', () => {
    render(<ChamferedHeader>Test</ChamferedHeader>);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('chamfered-header');
  });

  it('applies additional className', () => {
    render(<ChamferedHeader className="extra">Test</ChamferedHeader>);
    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('extra');
  });
});
