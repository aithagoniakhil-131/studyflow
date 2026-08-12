import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export default class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AI Response Rendering Error caught by Boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 text-rose-200 space-y-3 text-xs leading-relaxed my-2 shadow-md">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>AI response formatting issue</span>
          </div>
          <p className="text-[11px] text-rose-200/90">
            StudyFlow AI couldn't format this response. Try asking again or use a simpler prompt.
          </p>
          <div className="pt-1 flex items-center gap-2">
            <Button
              onClick={this.handleReset}
              className="bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/40 text-rose-200 text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Rendering</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
