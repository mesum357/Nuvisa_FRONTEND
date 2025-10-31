"use client";
import React, { useEffect, useRef } from "react";

const Modal = ({ isOpen, onClose, children, ariaLabel = "Dialog", role = "dialog" }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = ref.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus?.();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role={role} aria-label={ariaLabel}>
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div
          ref={ref}
          className="relative w-full sm:max-w-lg overflow-hidden rounded-xl border border-[#423577] bg-[#23232B] text-left shadow-2xl"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;


