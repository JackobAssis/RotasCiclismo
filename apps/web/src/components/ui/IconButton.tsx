import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  label: string;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-neon-500 text-black hover:bg-neon-400 shadow-neon-sm hover:shadow-neon',
  secondary:
    'bg-dark-800 text-neon-400 border border-neon-900/40 hover:bg-dark-850 hover:border-neon-700/50',
  ghost: 'text-gray-400 hover:text-neon-400 hover:bg-dark-800',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const sizeStyles: Record<Size, string> = {
  sm: 'w-8 h-8 text-sm rounded-lg',
  md: 'w-10 h-10 text-base rounded-xl',
  lg: 'w-12 h-12 text-lg rounded-xl',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'secondary', size = 'md', label, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-500/30 active:scale-[0.95] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
