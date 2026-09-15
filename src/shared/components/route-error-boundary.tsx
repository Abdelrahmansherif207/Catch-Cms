import { Component, type ReactNode } from 'react';
import { TriangleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';

// Route-level error boundary: a render throw inside shows a retry UI
// instead of unmounting the whole app into a blank white page.
interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[route] Render failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12">
          <TriangleAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Something went wrong while rendering this page.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="me-2 h-4 w-4" />
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
