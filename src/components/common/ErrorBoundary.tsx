import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { saveCrashLogToCloud, auth } from '../../services/firebase';

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isLoggedToCloud: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    isLoggedToCloud: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false, isLoggedToCloud: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CukaiSmart Error Boundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });

    // Log error remotely to Firestore system_crash_logs collection for remote AdminConsole debugging
    try {
      const user = auth.currentUser;
      saveCrashLogToCloud({
        errorMessage: error.message || String(error),
        errorName: error.name || 'ComponentCrashError',
        componentStack: errorInfo.componentStack || '',
        userId: user?.uid || 'guest-session',
        userEmail: user?.email || 'anonymous@cukaismart.local',
        url: typeof window !== 'undefined' ? window.location.href : '',
      })
        .then(() => {
          this.setState({ isLoggedToCloud: true });
        })
        .catch((err) => {
          console.warn('[ErrorBoundary] Crash log async dispatch note:', err);
        });
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to dispatch crash log to cloud', e);
    }
  }


  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-red-500/30 text-slate-100 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-8 shadow-2xl space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-950/50">
            <AlertOctagon className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                System Recovery Guard
              </span>
              {this.state.isLoggedToCloud && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Logged to Remote AdminConsole</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Something went unexpected in this section
            </h2>

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {this.props.fallbackMessage ||
                'CukaiSmart caught a rendering anomaly. Your saved tax data and receipts remain safe in local memory and cloud Firestore.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Component</span>
            </button>

            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Reload Application</span>
            </button>
          </div>

          {/* Technical Details Toggle */}
          {this.state.error && (
            <div className="w-full text-left pt-3 border-t border-slate-800">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
              >
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{this.state.showDetails ? 'Hide Diagnostic Logs' : 'View Diagnostic Logs'}</span>
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-red-300 overflow-x-auto max-h-40 space-y-1">
                  <p className="font-bold text-white">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
