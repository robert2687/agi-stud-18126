import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, ShieldAlert, Copy, Check, AlertOctagon } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

const STORAGE_KEY = 'agentic_studio_pro_v1';

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Agentic Studio Critical Error Boundary Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Capture unhandled promise rejections (async errors)
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.setState({
      hasError: true,
      error: reason,
      errorInfo: { componentStack: 'Unhandled Promise Rejection (Async Operation)' }
    });
  };

  handleGlobalError = (event: ErrorEvent) => {
    // Capture global errors that bubble up to the window
    this.setState({
      hasError: true,
      error: event.error || new Error(event.message),
      errorInfo: { componentStack: `Global Error at ${event.filename}:${event.lineno}` }
    });
  };

  handleRestartWorkflow = () => {
    // Clear the project state which might be causing the crash to ensure a clean slate
    localStorage.removeItem(STORAGE_KEY);
    // Force reload the application
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = async () => {
    const text = `Error: ${this.state.error?.toString()}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6 text-slate-200 font-sans">
          {/* Background Ambient Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
          </div>

          <div className="relative w-full max-w-2xl bg-[#0f172a]/90 backdrop-blur-2xl border border-red-900/50 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Bar */}
            <div className="bg-red-950/30 px-6 py-4 border-b border-red-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <ShieldAlert className="text-red-500" size={20} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-red-100 tracking-wide uppercase">Application Error</h1>
                  <p className="text-[10px] text-red-400 font-mono">UNCAUGHT_EXCEPTION</p>
                </div>
              </div>
              <div className="hidden sm:block text-[10px] font-mono text-red-500/50 border border-red-500/10 px-2 py-1 rounded bg-red-950/50">
                MONITORING_ACTIVE
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 flex flex-col gap-6">
              <div className="flex items-start gap-5">
                <div className="shrink-0 pt-1">
                  <AlertOctagon className="text-red-500" size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    An unexpected error occurred in the Agentic Neural Engine. We've paused execution to prevent data corruption.
                    You can try reloading the page, or restart the workflow if the issue persists.
                  </p>
                </div>
              </div>

              {/* Technical Details (Collapsible-ish feel) */}
              <div className="bg-[#020617]/50 rounded-lg border border-slate-800/60 p-4 font-mono text-xs overflow-hidden relative group transition-colors hover:border-slate-700">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Terminal size={12} />
                    <span className="font-bold tracking-wider">DIAGNOSTIC TRACE</span>
                  </div>
                  <button 
                    onClick={this.handleCopyError}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-all text-[10px] border border-slate-700 active:scale-95"
                  >
                    {this.state.copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                    {this.state.copied ? 'COPIED' : 'COPY ERROR'}
                  </button>
                </div>
                
                <div className="overflow-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-2">
                  <p className="text-red-400 mb-2 font-bold break-words">
                    {this.state.error?.toString() || "Unknown Error"}
                  </p>
                  <pre className="text-slate-500 leading-tight opacity-70 whitespace-pre-wrap break-all text-[10px]">
                    {this.state.errorInfo?.componentStack || "Stack trace unavailable."}
                  </pre>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button 
                  onClick={this.handleReload}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                >
                  Reload Page
                </button>
                <button 
                  onClick={this.handleRestartWorkflow}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95 border border-red-500/50"
                >
                  <RefreshCw size={16} />
                  Restart Workflow
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center space-y-2">
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              Agentic Studio Pro v1.0.4
            </p>
            <p className="text-[10px] text-slate-700">
              Session ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}