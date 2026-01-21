import { cn } from '@/lib/utils';
import { CaseStatus } from '@/types/icsr';
import { Check } from 'lucide-react';

interface ProgressTrackerProps {
  currentStatus: CaseStatus;
  className?: string;
}

const steps: { status: CaseStatus; label: string }[] = [
  { status: 'intake', label: 'Intake' },
  { status: 'risk_classified', label: 'Triage' },
  { status: 'followup_sent', label: 'Follow-up Sent' },
  { status: 'response_received', label: 'Response Ingested' },
  { status: 'ready_for_review', label: 'Ready for Review' },
  { status: 'closed', label: 'Closed' },
];

const statusOrder: CaseStatus[] = ['intake', 'risk_classified', 'followup_sent', 'response_received', 'ready_for_review', 'closed'];

export function ProgressTracker({ currentStatus, className }: ProgressTrackerProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.status} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 transition-colors duration-300',
                      isCompleted ? 'bg-accent' : 'bg-border'
                    )}
                  />
                )}
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-accent border-accent text-accent-foreground'
                      : isCurrent
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 transition-colors duration-300',
                      isCompleted ? 'bg-accent' : 'bg-border'
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center transition-colors',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
