import type { ReactNode } from 'react';

type SelectChangeHandler = (value: string) => void;

interface TestGlobal {
  __TEST_SELECT_HANDLER__?: SelectChangeHandler;
}

interface SelectProps {
  value?: string;
  onValueChange?: SelectChangeHandler;
  children?: ReactNode;
}

/**
 * Minimal SSR-friendly stand-in for the shared Base UI Select primitives.
 * It renders items immediately (so options appear in static markup) and
 * exposes the real onValueChange handler for the test to invoke.
 */
export function Select({ value, onValueChange, children }: SelectProps) {
  // eslint-disable-next-line react-hooks/immutability -- test-only capture of the real handler
  (globalThis as unknown as TestGlobal).__TEST_SELECT_HANDLER__ = onValueChange;
  return (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  );
}

export function SelectTrigger({ children }: { children?: ReactNode }) {
  return <div data-testid="select-trigger">{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span data-testid="select-value">{placeholder}</span>;
}

export function SelectContent({ children }: { children?: ReactNode }) {
  return <div data-testid="select-content">{children}</div>;
}

export function SelectItem({ value, children }: { value: string; children?: ReactNode }) {
  return (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  );
}
