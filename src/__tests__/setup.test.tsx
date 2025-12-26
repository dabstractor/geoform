import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Test Setup Verification', () => {
  it('should have Testing Library matchers available', () => {
    const TestComponent = () => <div data-testid="test">Hello</div>;
    render(<TestComponent />);

    expect(screen.getByTestId('test')).toBeInTheDocument();
    expect(screen.getByTestId('test')).toHaveTextContent('Hello');
  });

  it('should run tests with jsdom environment', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });
});
