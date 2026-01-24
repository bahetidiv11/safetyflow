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
  { status: 'followup_sent', label: 'Follow-up' },
  { status: 'ready_for_review', label: 'Completed' },
];

const statusOrder: CaseStatus[] = ['intake', 'risk_classified', 'followup_sent', 'response_received', 'ready_for_review', 'closed'];

export function ProgressTracker({ currentStatus, className }: ProgressTrackerProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);

  // Map to 4-step display
  const getStepIndex = (status: CaseStatus): number => {
    const idx = statusOrder.indexOf(status);
    if (idx <= 0) return 0;
    if (idx === 1) return 1;
    if (idx === 2) return 2;
    return 3; // response_received, ready_for_review, closed
  };

  const currentStepIndex = getStepIndex(currentStatus);

  return (
    <div className={cn('w-full', className)}>
      {/* Container with fixed height for alignment */}
      <div className="relative flex items-start justify-between">
        {/* Background connecting line - spans full width at circle center */}
        <div 
          className="absolute h-0.5 bg-border" 
          style={{ 
            top: '16px', 
            left: '16px', 
            right: '16px' 
          }} 
        />
        {/* Progress line - turns blue as user advances */}
        <div 
          className="absolute h-0.5 bg-accent transition-all duration-500" 
          style={{ 
            top: '16px', 
            left: '16px',
            width: currentStepIndex === 0 ? '0%' : `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 32px)`
          }} 
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center" style={{ width: '80px' }}>
              {/* Circle - perfectly aligned on the line */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background transition-all duration-300',
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
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {/* Label - below the circle */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center whitespace-nowrap transition-colors',
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
