import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const WarningIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-overlay"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {children}
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 transition-colors"
          >
            Oui, supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;