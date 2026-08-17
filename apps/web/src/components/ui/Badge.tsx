type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-800 text-gray-400 border border-dark-700',
  success: 'bg-neon-900/30 text-neon-400 border border-neon-800/40',
  warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/40',
  danger: 'bg-red-900/30 text-red-400 border border-red-800/40',
  info: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
