import React from 'react';

export interface AlertProps {
  title?: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

const typeStyles = {
  info: 'bg-blue-100 text-blue-800 border-blue-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  error: 'bg-red-100 text-red-800 border-red-300',
};

export const Alert: React.FC<AlertProps> = ({ title, description, type = 'info', onClose }) => {
  return (
    <div
      className={`border rounded-md px-4 py-3 mb-2 flex items-start gap-3 ${typeStyles[type]}`}
      role="alert"
    >
      <div className="flex-1">
        {title && <div className="font-semibold mb-1">{title}</div>}
        {description && <div className="text-sm">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-lg font-bold focus:outline-none"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;

