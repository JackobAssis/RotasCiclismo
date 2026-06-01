import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-neon-500 text-black hover:bg-neon-400 active:bg-neon-600 shadow-neon-sm hover:shadow-neon disabled:opacity-40 disabled:hover:shadow-none',
  secondary:
    'bg-dark-800 text-neon-400 border border-neon-900/40 hover:bg-dark-850 hover:border-neon-700/50 active:bg-dark-900 disabled:opacity-40',
  ghost:
    'text-gray-400 hover:text-neon-400 hover:bg-dark-800 active:bg-dark-850 disabled:opacity-40',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 disabled:opacity-40',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-500/30 active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : leftIcon ? (
          <span className="w-4 h-4">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && <span className="w-4 h-4">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
