import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the home screen with a tile grid by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /traveller toolkit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /character creation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /planet generator/i })).toBeInTheDocument();
  });

  it('renders the app shell with sidebar and wizard when navigating to #character', () => {
    window.location.hash = '#character';
    render(<App />);
    expect(screen.getByRole('heading', { name: /^traveller$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /choose your species/i })).toBeInTheDocument();
  });
});
