import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
