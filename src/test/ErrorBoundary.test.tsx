/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Helper component that throws an error on demand
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test rendering error');
  }
  return <div>Component rendered successfully</div>;
}

describe('ErrorBoundary Component', () => {
  let consoleErrorMock: any;

  beforeEach(() => {
    // Suppress console.error in tests to keep output clean when errors are caught by boundaries
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
  });

  it('renders default fallback UI when a child component throws an error', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ein unerwarteter Fehler ist aufgetreten')).toBeInTheDocument();
    expect(screen.getByText('Test rendering error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seite neu laden' })).toBeInTheDocument();
  });

  it('renders custom fallback UI when provided as a node', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Fallback UI</div>}>
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Ein unerwarteter Fehler ist aufgetreten')).not.toBeInTheDocument();
  });

  it('renders custom fallback UI function result and supports reset trigger', () => {
    let resetCalled = false;

    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <span>Custom Function Fallback: {error.message}</span>
            <button onClick={() => { resetCalled = true; reset(); }}>Reset Error</button>
          </div>
        )}
      >
        <BuggyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Function Fallback: Test rendering error')).toBeInTheDocument();
    
    const resetBtn = screen.getByRole('button', { name: 'Reset Error' });
    fireEvent.click(resetBtn);

    expect(resetCalled).toBe(true);
  });
});
