import React from 'react';
import Modal from './Modal';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger",
  minimal = true
}) => {
  const confirmBtnColors = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={title}>
      <div className="px-6 py-6">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm text-white/80 whitespace-pre-line">{message}</p>
      </div>
      <div className="bg-[#1E1E27] px-6 py-4 border-t border-[#423577] sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-0 ${confirmBtnColors[type] || confirmBtnColors.danger} sm:ml-3 sm:w-auto`}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-transparent px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-inset ring-white/10 hover:bg-white/5 sm:mt-0 sm:w-auto"
          onClick={onClose}
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;