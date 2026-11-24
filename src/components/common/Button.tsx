import React from 'react';

export type AmplitudeButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'tertiary-alt';
export type AmplitudeButtonSize = 'medium' | 'small';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AmplitudeButtonVariant;
  size?: AmplitudeButtonSize;
  isDanger?: boolean;
  isLoading?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

/**
 * Amplitude Core UI Button Primitive
 * Four variants (primary, secondary, tertiary, tertiary-alt), two sizes (medium 32px, small 24px),
 * always rounded-lg (8px radius), leading with Amplitude Blue (#0052F2), Black, and White.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isDanger = false,
  isLoading = false,
  iconOnly = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  const sizeClasses =
    size === 'small'
      ? iconOnly
        ? 'h-6 w-6 p-0 text-text-xs'
        : 'h-6 px-2.5 text-text-xs gap-1'
      : iconOnly
        ? 'h-8 w-8 p-0 text-text-s'
        : 'h-8 px-3.5 text-text-s gap-1.5';

  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = isDanger
      ? 'bg-error text-white border border-error hover:opacity-90'
      : 'bg-amplitude-blue text-white border border-amplitude-blue hover:opacity-90';
  } else if (variant === 'secondary') {
    variantClasses = isDanger
      ? 'bg-surface-container text-error border border-error/60 hover:bg-error-container'
      : 'bg-surface-container text-btn-secondary-text border border-btn-secondary-border hover:bg-surface-container-high';
  } else if (variant === 'tertiary') {
    variantClasses = isDanger
      ? 'bg-transparent text-error border border-transparent hover:bg-error-container'
      : 'bg-transparent text-accent-text border border-transparent hover:bg-surface-container-high';
  } else {
    // tertiary-alt
    variantClasses = isDanger
      ? 'bg-transparent text-error border border-transparent hover:bg-error-container'
      : 'bg-transparent text-btn-secondary-text border border-transparent hover:bg-surface-container-high';
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`font-gellix inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
        />
      )}
      {children}
    </button>
  );
};
