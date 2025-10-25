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
      className="fixed inset-0 bg-secondary bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-overlay"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-secondary rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brandRed/10 mb-4">
            <WarningIcon className="h-6 w-6 text-brandRed" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-secondary dark:text-primary mb-2">{title}</h3>
          <div className="text-sm text-secondary/70 dark:text-primary/70 mb-6">
            {children}
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-secondary dark:text-primary bg-secondary/10 dark:bg-primary/10 hover:bg-secondary/20 dark:hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-offset-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-white bg-brandRed hover:bg-brandRed/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandRed dark:focus:ring-offset-secondary transition-colors"
          >
            Oui, supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;