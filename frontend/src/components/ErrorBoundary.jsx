import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, Button } from './design-system';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-red-150 bg-red-50/20 text-center flex flex-col items-center justify-center min-h-[140px] animate-rise-in shadow-sm">
          <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
          <h4 className="text-xs font-bold text-slate-800 mt-2">Widget Temporarily Unavailable</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] leading-relaxed">
            This module encountered a rendering exception. Helio is tracking this incident.
          </p>
          <Button 
            size="sm" 
            variant="ghost" 
            className="mt-3.5 text-[10px] h-7 px-3.5 border border-slate-200 hover:bg-slate-100 font-bold"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry Component
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
