import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'neon';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  return (
    <Card variant={variant} padding="md" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-500">
          {label}
        </span>
        {icon && <span className="w-4 h-4 text-neon-400">{icon}</span>}
      </div>
      <span className="text-2xl font-bold neon-text-dim">{value}</span>
      {trend && (
        <span
          className={`text-xs flex items-center gap-1 ${
            trend.positive ? 'text-neon-500' : 'text-red-400'
          }`}
        >
          <span>{trend.positive ? '↑' : '↓'}</span>
          {trend.value}%
        </span>
      )}
    </Card>
  );
}
