import { render, screen } from '@testing-library/react';
import App from './App';

test('renders pub crawl header', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /pub crawl route map/i })).toBeInTheDocument();
});
