import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

const LoadingContext = createContext(null);

/**
 * Hook to access loading state and functions
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};

/**
 * Provider for global loading state
 */
export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(null); // null | { message, overlay }

  const showLoading = useCallback((message = "", overlay = false) => {
    setLoading({ message, overlay });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(null);
  }, []);

  /**
   * Execute a promise with automatic loading state
   * @param {Promise} promise - The promise to execute
   * @param {Object} options - Options including message and overlay
   * @returns {Promise} - The result of the promise
   */
  const withLoading = useCallback(
    async (promise, options = {}) => {
      const { message = "加载中...", overlay = false } = options;
      showLoading(message, overlay);
      try {
        const result = await promise;
        hideLoading();
        return result;
      } catch (error) {
        hideLoading();
        throw error;
      }
    },
    [showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider value={{ loading, showLoading, hideLoading, withLoading }}>
      {children}
      {loading?.overlay &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-sage/20 border-t-sage-600" />
              {loading.message && (
                <p className="text-sm font-medium text-clay">{loading.message}</p>
              )}
            </div>
          </div>,
          document.body
        )}
    </LoadingContext.Provider>
  );
}

export default LoadingProvider;
