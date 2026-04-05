import { createContext, useContext, useState, useCallback, useMemo } from "react";

const ToastContext = createContext(null);

// Helper hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Generate unique ID for each toast
let toastIdCounter = 0;

function generateId() {
  return `toast-${++toastIdCounter}`;
}

// Provider component
export function ToastProvider({ children, position = "top-right" }) {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const showToast = useCallback(
    ({ message, type = "info", duration = 4000 }) => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      return id;
    },
    []
  );

  // Remove a toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message, duration) => showToast({ message, type: "success", duration }),
    [showToast]
  );

  const error = useCallback(
    (message, duration) => showToast({ message, type: "error", duration }),
    [showToast]
  );

  const warning = useCallback(
    (message, duration) => showToast({ message, type: "warning", duration }),
    [showToast]
  );

  const info = useCallback(
    (message, duration) => showToast({ message, type: "info", duration }),
    [showToast]
  );

  // Promise-based toast for async operations
  const promise = useCallback(async (promise, { loading, success: successMsg, error: errorMsg }) => {
    const loadingId = showToast({ message: loading || "Loading...", type: "info", duration: 0 });

    try {
      const result = await promise;
      removeToast(loadingId);
      if (successMsg) {
        success(successMsg, 3000);
      }
      return result;
    } catch (err) {
      removeToast(loadingId);
      const message = errorMsg || err?.message || "Something went wrong";
      error(message, 5000);
      throw err;
    }
  }, [showToast, removeToast, success, error]);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      clearAll,
      success,
      error,
      warning,
      info,
      promise,
      position,
    }),
    [toasts, showToast, removeToast, clearAll, success, error, warning, info, promise, position]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
