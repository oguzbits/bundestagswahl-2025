import { type ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

export function ErrorBoundary({ children, fallback }: Props) {
  const handleReset = () => {
    // Standard trigger to force re-render components inside
    window.location.reload();
  };

  if (fallback) {
    if (typeof fallback === 'function') {
      return (
        <ReactErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <>{fallback(error as Error, resetErrorBoundary)}</>
          )}
          onReset={handleReset}
        >
          {children}
        </ReactErrorBoundary>
      );
    }

    return (
      <ReactErrorBoundary fallback={<>{fallback}</>} onReset={handleReset}>
        {children}
      </ReactErrorBoundary>
    );
  }

  // Default Fallback UI
  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl max-w-xl mx-auto my-8 text-center shadow-sm">
          <div className="text-red-500 text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-red-800">
            Ein unerwarteter Fehler ist aufgetreten
          </h3>
          <p className="text-sm text-red-600 mt-2 leading-relaxed">
            {error instanceof Error
              ? error.message
              : 'Die Anwendung konnte an dieser Stelle nicht geladen werden.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all border border-red-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Erneut versuchen
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-red-800 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      )}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
}
