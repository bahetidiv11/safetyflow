import { Check, Clock, FileText, Sparkles, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AuditEvent {
  label: string;
  timestamp: Date | string | null;
  icon: typeof Check;
  status: 'completed' | 'pending' | 'in_progress';
}

interface AuditTrailProps {
  createdAt?: Date | string | null;
  extractionCompletedAt?: Date | string | null;
  meddraValidatedAt?: Date | string | null;
  className?: string;
}

export function AuditTrail({ 
  createdAt, 
  extractionCompletedAt, 
  meddraValidatedAt,
  className 
}: AuditTrailProps) {
  const formatTimestamp = (ts: Date | string | null | undefined): string => {
    if (!ts) return '—';
    const date = typeof ts === 'string' ? new Date(ts) : ts;
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const events: AuditEvent[] = [
    {
      label: 'Case Created',
      timestamp: createdAt || null,
      icon: FileText,
      status: createdAt ? 'completed' : 'pending',
    },
    {
      label: 'AI Extraction Completed',
      timestamp: extractionCompletedAt || null,
      icon: Sparkles,
      status: extractionCompletedAt ? 'completed' : createdAt ? 'in_progress' : 'pending',
    },
    {
      label: 'MedDRA Terms Validated',
      timestamp: meddraValidatedAt || extractionCompletedAt || null,
      icon: Shield,
      status: (meddraValidatedAt || extractionCompletedAt) ? 'completed' : 'pending',
    },
  ];

  return (
    <div className={cn('card-elevated p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Audit Trail</h3>
        <span className="text-xs text-muted-foreground ml-auto">Data Integrity Log</span>
      </div>
      
      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={event.label} className="relative flex gap-4">
            {/* Connector Line */}
            {index < events.length - 1 && (
              <div 
                className={cn(
                  'absolute left-[15px] top-8 w-0.5 h-8',
                  event.status === 'completed' ? 'bg-success/50' : 'bg-muted'
                )}
              />
            )}
            
            {/* Icon */}
            <div 
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full z-10',
                event.status === 'completed' 
                  ? 'bg-success/10 text-success' 
                  : event.status === 'in_progress'
                  ? 'bg-warning/10 text-warning animate-pulse'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {event.status === 'completed' ? (
                <Check className="h-4 w-4" />
              ) : (
                <event.icon className="h-4 w-4" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between">
                <p className={cn(
                  'text-sm font-medium',
                  event.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {event.label}
                </p>
                <span className={cn(
                  'text-xs font-mono',
                  event.status === 'completed' ? 'text-muted-foreground' : 'text-muted-foreground/50'
                )}>
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              {event.status === 'in_progress' && (
                <p className="text-xs text-warning mt-0.5">Processing...</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" />
          All timestamps are server-validated and immutable for regulatory compliance
        </p>
      </div>
    </div>
  );
}
