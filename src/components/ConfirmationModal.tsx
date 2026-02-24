import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-bg-main/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className="bg-bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border-default m-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirmation-modal-title" className="text-xl font-bold text-white">{title}</h2>
        <p className="text-text-secondary mt-2 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-border-default text-white font-semibold rounded-md hover:bg-border-default/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;