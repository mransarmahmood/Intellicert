import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-[60vh] place-items-center bg-surface px-6 py-10">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-red-900">Something went wrong</h2>
            <p className="mt-1 text-[13.5px] text-red-700">
              An unexpected error stopped this page from loading. Your progress is saved.
            </p>
            {import.meta.env.DEV && this.state.error.message && (
              <pre className="mt-3 overflow-x-auto rounded bg-red-100 p-2 text-left text-[11px] text-red-900">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-700"
              >
                Reload page
              </button>
              <button
                onClick={this.reset}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-[13px] font-semibold text-red-700 hover:bg-red-50"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
