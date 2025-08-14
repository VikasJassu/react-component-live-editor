import { Component, type ErrorInfo, type ReactNode } from "react";
import type { CompilationError } from "../types";

interface Props {
  children: ReactNode;
  onError?: (error: CompilationError) => void;
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      const compilationError: CompilationError = {
        message: error.message,
        type: "runtime",
      };
      this.props.onError(compilationError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
