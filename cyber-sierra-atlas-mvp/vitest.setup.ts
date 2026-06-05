import '@testing-library/jest-dom'

// Polyfill ResizeObserver for Recharts in test environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
