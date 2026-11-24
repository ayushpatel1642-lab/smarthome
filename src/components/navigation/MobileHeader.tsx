import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHome } from '../../context/HomeContext';
import { getInitials } from '../../utils/format';
import { Button } from '../common/Button';

interface MobileHeaderProps {
  mode?: 'main' | 'stack';
  title?: string;
  subtitle?: string;
  backTo?: string;
  rightSlot?: React.ReactNode;
  showDesktopLink?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  mode = 'main',
  title,
  subtitle,
  backTo,
  rightSlot,
  showDesktopLink = false,
}) => {
  const navigate = useNavigate();
  const { state } = useHome();
  const initials = getInitials(state.profile.displayName);

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (mode === 'stack') {
    return (
      <header className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-surface/95 backdrop-blur-md border-b border-outline font-gellix">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="secondary" iconOnly onClick={handleBack} aria-label="Go back">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-text-m font-semibold text-on-surface truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-text-xs text-on-surface-variant truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightSlot ? <div className="flex items-center gap-2 shrink-0">{rightSlot}</div> : null}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 h-14 px-4 lg:px-6 flex items-center justify-between bg-surface/95 backdrop-blur-md border-b border-outline font-gellix">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-left lg:hidden"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface">
            home_iot_device
          </span>
          <span className="text-text-m font-semibold tracking-tight text-on-surface whitespace-nowrap">
            {title || 'Aware Home'}
          </span>
        </button>
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          <span className="text-text-m font-semibold tracking-tight text-on-surface whitespace-nowrap">
            {title || 'Aware Home'}
          </span>
          {subtitle && (
            <span className="text-text-xs text-on-surface-variant border-l border-outline pl-2.5 truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {rightSlot}
        {showDesktopLink && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate('/desktop')}
            className="hidden sm:inline-flex"
            title="Open Desktop Console"
          >
            <span className="material-symbols-outlined text-[15px]">desktop_windows</span>
            <span>Console</span>
          </Button>
        )}
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Open settings"
          className="w-8 h-8 rounded-full bg-surface-container-high border border-outline flex items-center justify-center text-text-xs font-semibold text-on-surface hover:border-accent-text transition-colors"
        >
          {initials}
        </button>
      </div>
    </header>
  );
};
