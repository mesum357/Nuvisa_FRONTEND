import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Toast from "../components/Toast";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "error", duration = 5000) => {
    // Check if a toast with the same message and type already exists
    setToasts(prev => {
      const duplicateExists = prev.some(
        toast => toast.message === message && toast.type === type
      );
      
      // If duplicate exists, don't add another one
      if (duplicateExists) {
        return prev;
      }
      
      // Otherwise, add the new toast
      const id = Date.now() + Math.random();
      const toast = { id, message, type, duration };
      return [...prev, toast];
    });
    
    // Return null since we can't reliably return the id due to async state updates
    // The return value is not used anyway
    return null;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showError = useCallback((message, duration) => {
    return showToast(message, "error", duration);
  }, [showToast]);

  const showSuccess = useCallback((message, duration) => {
    return showToast(message, "success", duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    return showToast(message, "warning", duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    return showToast(message, "info", duration);
  }, [showToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  };

  // Listen to global toast events to allow non-React modules to trigger system toasts
  useEffect(() => {
    const handler = (e) => {
      try {
        const detail = e?.detail || {};
        const msg = detail.message || "";
        const t = String(detail.type || "info");
        const d = detail.duration;
        if (t === "success") showSuccess(msg, d);
        else if (t === "error") showError(msg, d);
        else if (t === "warning") showWarning(msg, d);
        else showInfo(msg, d);
      } catch {
        /* ignore */
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("nuvisa:toast", handler);
      return () => window.removeEventListener("nuvisa:toast", handler);
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;