import { Component, type ReactNode } from 'react';

// Per-section error boundary: a failing section renders a graceful
// fallback and the rest of the page keeps rendering (Task 1).
interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[static-pages] Section failed to render:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}