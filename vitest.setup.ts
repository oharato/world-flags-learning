import { beforeEach, afterEach } from 'vitest';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const shouldSuppressMessage = (args: any[]): boolean => {
  const message = args.join(' ');
  return message.includes('AbortError') || 
         message.includes('The operation was aborted') ||
         message.includes('DOMException');
};

beforeEach(() => {
  console.error = (...args: any[]) => {
    if (!shouldSuppressMessage(args)) {
      originalConsoleError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    if (!shouldSuppressMessage(args)) {
      originalConsoleWarn.apply(console, args);
    }
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
