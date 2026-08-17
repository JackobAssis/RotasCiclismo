import { Card } from './Card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card variant="flat" padding="lg" className="text-center">
      <div className="flex flex-col items-center gap-3 py-8">
        {icon && (
          <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-neon-400">
            {icon}
          </div>
        )}
        <div>
          <p className="text-base font-medium text-white">{title}</p>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </Card>
  );
}
