import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('GROW SPACE ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string; operationType?: string; path?: string };
        if (parsed.error) {
          friendly = `Database access issue (${parsed.operationType || 'operation'} on ${parsed.path || 'record'}): ${parsed.error}`;
        }
      } catch {
        // non-JSON error
      }

      return (
        <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E4E7DF] rounded-xl p-8 space-y-4">
            <p className="text-xs font-medium text-[#5A685C]">GROW SPACE</p>
            <h1 className="text-2xl font-semibold text-[#1F2A22]">Something paused unexpectedly</h1>
            <p className="text-sm text-[#5A685C] leading-relaxed">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#3E6B4F] text-white text-sm font-medium rounded-lg hover:bg-[#335A42] transition-colors"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
