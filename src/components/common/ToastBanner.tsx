import React from 'react';
import { useHome } from '../../context/HomeContext';

export const ToastBanner: React.FC = () => {
  const { toast, dismissToast } = useHome();

  if (!toast) return null;

  const toneStyles =
    toast.tone === 'error'
      ? 'bg-error-container border-error/50 text-on-error-container'
      : 'bg-surface-container border-outline text-on-surface';

  const iconName = {
    success: 'check_circle',
    info: 'info',
    warning: 'warning',
    error: 'error',
  }[toast.tone];

  const iconColor = toast.tone === 'error' ? 'text-error' : 'text-accent-text';

  return (
    <div
      className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-none font-gellix"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl ${toneStyles}`}
      >
        <span className={`material-symbols-outlined text-[20px] shrink-0 ${iconColor}`}>
          {iconName}
        </span>
        <span className="text-text-s font-medium flex-1 leading-snug">{toast.text}</span>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Dismiss notification"
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};
