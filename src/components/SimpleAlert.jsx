"use client";
import React from "react";
import Modal from "./Modal";

const SimpleAlert = ({
  isOpen,
  onClose,
  title = "Alert",
  message = "",
  okText = "OK",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={title}>
      <div className="px-6 py-6">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm text-white/80 whitespace-pre-line">{message}</p>
      </div>
      <div className="bg-[#1E1E27] px-6 py-4 border-t border-[#423577] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-semibold text-white bg-[#7350FF] hover:bg-[#6350E5] focus:outline-none focus:ring-2 focus:ring-[#7350FF]/50"
        >
          {okText}
        </button>
      </div>
    </Modal>
  );
};

export default SimpleAlert;


