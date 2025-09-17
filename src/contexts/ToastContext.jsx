import React, { createContext, useContext, useState, useCallback } from "react";
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
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    return id;
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