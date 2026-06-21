import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Here we could also log to our error-logger
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            We encountered an unexpected error while loading this section.
            Please try refreshing or return to the dashboard.
          </p>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = "/"}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
          
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-4 bg-background/50 rounded text-left w-full overflow-auto text-xs text-muted-foreground border">
              <code>{this.state.error.message}</code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function RouteErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in zoom-in duration-300">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Failed to load this module</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error?.message || "An unexpected error occurred while loading this section."}
      </p>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Page
        </Button>
      </div>
    </div>
  );
}
