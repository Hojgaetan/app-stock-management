import React from 'react';

interface StatusBannerProps {
  type: 'success' | 'warning';
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const WarningIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

const StatusBanner: React.FC<StatusBannerProps> = ({ type, title, children, onClose }) => {
  const isSuccess = type === 'success';
  const base = isSuccess
    ? 'bg-brandGreen/40 border-brandGreen'
    : 'bg-brandYellow/40 border-brandYellow';
  const iconColor = isSuccess ? 'text-brandGreen' : 'text-brandYellow';

  return (
    <div className={`border ${base} px-4 py-3 rounded-lg flex items-start gap-3 text-secondary dark:text-primary`}>
      <div className={`mt-0.5 ${iconColor}`}>
        {isSuccess ? <CheckIcon className="w-5 h-5" /> : <WarningIcon className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {children && <div className="text-sm">{children}</div>}
      </div>
      {onClose && (
        <button
          aria-label="Fermer"
          onClick={onClose}
          className="ml-2 text-secondary/60 hover:text-secondary dark:text-primary/70 dark:hover:text-primary focus:outline-none"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default StatusBanner;

