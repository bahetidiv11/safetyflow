import { cn } from '@/lib/utils';
import { CaseStatus } from '@/types/icsr';
import { FileText, BarChart3, Send, MessageSquare, CheckCircle2 } from 'lucide-react';

interface StatusPillProps {
  status: CaseStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<CaseStatus, { label: string; icon: React.ElementType; classes: string }> = {
  intake: {
    label: 'Intake',
    icon: FileText,
    classes: 'bg-muted text-muted-foreground',
  },
  risk_classified: {
    label: 'Risk Classified',
    icon: BarChart3,
    classes: 'bg-info/10 text-info',
  },
  followup_sent: {
    label: 'Follow-up Sent',
    icon: Send,
    classes: 'bg-warning/10 text-warning',
  },
  response_received: {
    label: 'Response Received',
    icon: MessageSquare,
    classes: 'bg-accent/10 text-accent',
  },
  ready_for_review: {
    label: 'Ready for Review',
    icon: BarChart3,
    classes: 'bg-primary/10 text-primary',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle2,
    classes: 'bg-success/10 text-success',
  },
};

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.classes,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      <Icon className={cn('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      {config.label}
    </span>
  );
}
