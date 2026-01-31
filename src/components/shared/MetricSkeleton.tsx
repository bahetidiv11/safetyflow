import { Skeleton } from '../ui/skeleton';

interface MetricSkeletonProps {
  highlight?: boolean;
}

export function MetricSkeleton({ highlight }: MetricSkeletonProps) {
  return (
    <div className={`card-elevated p-5 ${highlight ? 'border-l-4 border-l-muted' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </td>
      <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
      <td className="px-4 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
      <td className="px-4 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
    </tr>
  );
}
