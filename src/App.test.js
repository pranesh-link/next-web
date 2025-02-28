import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Welcome! Thanks for interviewing with Hinge Health! text', () => {
  render(<App />);
  const element = screen.getByText(
    /Welcome! Thanks for interviewing with Hinge Health!/i,
  );
  expect(element).toBeInTheDocument();
});
