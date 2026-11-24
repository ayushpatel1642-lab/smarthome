import React from 'react';
import { Button } from './Button';

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
      message: error?.message || 'An unexpected interface error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Aware Home ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface text-on-surface font-gellix flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl bg-surface-container border border-outline p-6 space-y-4">
            <div className="text-eyebrow-s text-error">Application recovery</div>
            <h1 className="text-title-xs font-semibold text-on-surface">
              Something went wrong
            </h1>
            <p className="text-text-s font-normal text-on-surface-variant leading-relaxed">
              {this.state.message}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/';
                }}
              >
                Reload dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
