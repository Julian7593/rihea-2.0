import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

const toastIcons = {
  success: <CheckCircle className="h-5 w-5" style={{ color: "#7CB342" }} />,
  error: <AlertCircle className="h-5 w-5" style={{ color: "#E53935" }} />,
  warning: <AlertTriangle className="h-5 w-5" style={{ color: "#FFB300" }} />,
  info: <Info className="h-5 w-5" style={{ color: "#42A5F5" }} />,
};

const toastStyles = {
  success: {
    bg: "rgba(124, 179, 66, 0.1)",
    border: "rgba(124, 179, 66, 0.3)",
    iconBg: "rgba(124, 179, 66, 0.2)",
  },
  error: {
    bg: "rgba(229, 57, 53, 0.1)",
    border: "rgba(229, 57, 53, 0.3)",
    iconBg: "rgba(229, 57, 53, 0.2)",
  },
  warning: {
    bg: "rgba(255, 179, 0, 0.1)",
    border: "rgba(255, 179, 0, 0.3)",
    iconBg: "rgba(255, 179, 0, 0.2)",
  },
  info: {
    bg: "rgba(66, 165, 245, 0.1)",
    border: "rgba(66, 165, 245, 0.3)",
    iconBg: "rgba(66, 165, 245, 0.2)",
  },
};

export function Toast({ message, type = "info", duration = 4000, onClose }) {
  const style = toastStyles[type] || toastStyles.info;
  const icon = toastIcons[type] || toastIcons.info;

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(onClose, duration);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="glass-surface glass-tier-soft mx-4 mb-3 max-w-sm rounded-2xl border p-4 shadow-lg sm:mx-0 sm:max-w-md"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: style.iconBg }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-clay">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex shrink-0 items-center justify-center rounded-lg p-1 text-clay/60 transition hover:bg-clay/10 hover:text-clay"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast, position } = useToast();

  const positionStyles = {
    "top-right": "fixed top-4 right-4 z-[100] flex flex-col",
    "top-left": "fixed top-4 left-4 z-[100] flex flex-col",
    "top-center": "fixed top-4 left-1/2 right-auto z-[100] flex -translate-x-1/2 flex-col",
    "bottom-right": "fixed bottom-4 right-4 z-[100] flex flex-col-reverse",
    "bottom-left": "fixed bottom-4 left-4 z-[100] flex flex-col-reverse",
    "bottom-center": "fixed bottom-4 left-1/2 right-auto z-[100] flex -translate-x-1/2 flex-col-reverse",
  };

  return (
    <div className={positionStyles[position] || positionStyles["top-right"]}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
