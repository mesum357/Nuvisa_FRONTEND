"use client";
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

const Drawer = ({ isOpen, onClose, children, title = "Options", bottomOffset = 0, centerClose = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const onKeyDown = (e) => { 
      if (e.key === "Escape") onClose?.(); 
    };
    
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose} 
        style={{ bottom: bottomOffset }}
      />
      
      {/* Drawer */}
      <div 
        ref={ref}
        className={`fixed left-0 right-0 bg-[#1e1e27] rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ bottom: bottomOffset }}
      >
        {/* Header */}
        {centerClose ? (
          <div className="sticky top-0 bg-[#1e1e27] px-6 py-3">
            <button
              onClick={onClose}
              className="w-full text-center text-white/80 hover:text-white font-medium py-1"
              aria-label="Close drawer"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="sticky top-0 bg-[#1e1e27] px-6 py-4 flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
