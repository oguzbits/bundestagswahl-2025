import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      // Default Fallback UI
      return (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl max-w-xl mx-auto my-8 text-center shadow-sm">
          <div className="text-red-500 text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-red-800">Ein unerwarteter Fehler ist aufgetreten</h3>
          <p className="text-sm text-red-600 mt-2 leading-relaxed">
            {this.state.error.message || 'Die Anwendung konnte an dieser Stelle nicht geladen werden.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={this.handleReset}
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
      );
    }

    return this.props.children;
  }
}
