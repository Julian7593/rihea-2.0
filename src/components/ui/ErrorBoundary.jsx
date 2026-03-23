import { Component } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { txt } from "../../utils/txt";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Save error state
    this.setState({
      error,
      errorInfo,
    });

    // Optionally send error to error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, lang = "zh" } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback({ error, errorInfo, reload: this.handleReload, goHome: this.handleGoHome });
    }

    // Default fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fdfaf4] to-[#f7f2e8] p-4">
        <div className="glass-surface glass-tier-mid max-w-lg w-full rounded-3xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6aac4]/20">
              <AlertCircle className="h-8 w-8 text-[#e6aac4]" />
            </div>
          </div>

          <h1 className="font-heading text-2xl font-bold text-clay mb-3">
            {txt(lang, "Something went wrong", "出了一点小问题")}
          </h1>

          <p className="text-clay/75 mb-6 text-sm leading-relaxed">
            {txt(
              lang,
              "We're sorry, but something unexpected happened. This error has been logged, and our team is looking into it.",
              "抱歉，发生了意外错误。这个问题已被记录，我们的团队正在处理。"
            )}
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-xs font-semibold text-clay/60 mb-2">
                {txt(lang, "Error details (dev only)", "错误详情（仅开发环境）")}
              </summary>
              <pre className="overflow-auto rounded-xl bg-[#f2efe7] p-3 text-xs text-clay/80">
                <code>{error?.toString()}</code>
                {errorInfo?.componentStack && (
                  <code className="mt-2 block">{errorInfo.componentStack}</code>
                )}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={this.handleReload}
              className="glass-control inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-clay transition"
              style={{ backgroundColor: "#e6aac4", color: "#4e3b45" }}
            >
              <RefreshCw className="h-4 w-4" />
              {txt(lang, "Reload Page", "刷新页面")}
            </button>
            <button
              onClick={this.handleGoHome}
              className="glass-control inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-clay transition"
            >
              <Home className="h-4 w-4" />
              {txt(lang, "Go Back", "返回首页")}
            </button>
          </div>

          <p className="mt-6 text-xs text-clay/55">
            {txt(lang, "Error ID:", "错误 ID:")} {Date.now().toString(36)}
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
