import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, MenuStatus } from '@/types/database';

interface StatusBadgeProps {
  status: OrderStatus | MenuStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    open: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('capitalize', styles[status], className)}
    >
      {status}
    </Badge>
  );
}
