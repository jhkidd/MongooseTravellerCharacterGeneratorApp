import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app shell with sidebar and wizard', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /^traveller$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /choose your species/i })).toBeInTheDocument();
  });
});
