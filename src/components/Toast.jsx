import React, { useEffect, useState } from "react";

const Toast = ({ message, type = "error", duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const base = "flex items-center p-4 mb-2 rounded-lg shadow-lg border ring-1";
  const byType = {
    success: "bg-[#1E1E27] border-green-600/40 ring-green-500/20 text-green-200",
    warning: "bg-[#1E1E27] border-yellow-600/40 ring-yellow-500/20 text-yellow-200",
    info: "bg-[#1E1E27] border-blue-600/40 ring-blue-500/20 text-blue-200",
    error: "bg-[#1E1E27] border-red-600/40 ring-red-500/20 text-red-200",
  };

  return (
    <div className={`${base} ${byType[type] || byType.error}`} role="status" aria-live="polite">
      <div className="w-1 h-6 rounded bg-[#7350FF] mr-3" />
      <div className="flex-1">
        {typeof message === 'string' ? (
          <p className="text-sm font-medium">{message}</p>
        ) : (
          message
        )}
      </div>
      <button
        onClick={() => { setIsVisible(false); onClose?.(); }}
        className="ml-4 p-1 rounded hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#7350FF]/50"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;