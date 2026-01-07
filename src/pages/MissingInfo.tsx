import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Check,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { MissingField } from '@/types/icsr';
import { cn } from '@/lib/utils';

const mockFields: MissingField[] = [
  { 
    field: 'suspect_drug', 
    label: 'Suspect Drug', 
    priority: 'critical', 
    description: 'Drug name, dose, route',
    available: true 
  },
  { 
    field: 'adverse_event', 
    label: 'Adverse Event', 
    priority: 'critical', 
    description: 'Event term and description',
    available: true 
  },
  { 
    field: 'event_onset', 
    label: 'Event Onset Date', 
    priority: 'critical', 
    description: 'Date when event started',
    available: false 
  },
  { 
    field: 'outcome', 
    label: 'Event Outcome', 
    priority: 'critical', 
    description: 'Current status of patient',
    available: false 
  },
  { 
    field: 'rechallenge', 
    label: 'Rechallenge Information', 
    priority: 'important', 
    description: 'Was drug restarted?',
    available: false 
  },
  { 
    field: 'dechallenge', 
    label: 'Dechallenge Information', 
    priority: 'important', 
    description: 'Event outcome after stopping drug',
    available: true 
  },
  { 
    field: 'medical_history', 
    label: 'Relevant Medical History', 
    priority: 'important', 
    description: 'Pre-existing conditions',
    available: true 
  },
  { 
    field: 'concomitant_meds', 
    label: 'Concomitant Medications', 
    priority: 'optional', 
    description: 'Other medications taken',
    available: false 
  },
];

const priorityConfig = {
  critical: {
    label: 'Critical',
    classes: 'bg-risk-high/10 text-risk-high border-risk-high/30',
  },
  important: {
    label: 'Important',
    classes: 'bg-warning/10 text-warning border-warning/30',
  },
  optional: {
    label: 'Optional',
    classes: 'bg-muted text-muted-foreground border-border',
  },
};

export default function MissingInfo() {
  const navigate = useNavigate();

  const availableFields = mockFields.filter(f => f.available);
  const missingFields = mockFields.filter(f => !f.available);
  const criticalMissing = missingFields.filter(f => f.priority === 'critical');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl">
        {/* Progress Tracker */}
        <ProgressTracker currentStatus="risk_classified" className="mb-8" />

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ClipboardList className="h-4 w-4" />
            <span>Module 4</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">Missing Information Diagnosis</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Data Gap Analysis</h1>
          <p className="text-muted-foreground">
            Identify critical missing information to build targeted follow-up questions
          </p>
        </div>

        {/* Summary Card */}
        <div className="card-elevated p-6 mb-6 bg-gradient-to-r from-accent/5 to-transparent border-accent/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
              <ClipboardList className="h-7 w-7 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {missingFields.length} of {mockFields.length} fields require follow-up
              </h3>
              <p className="text-sm text-muted-foreground">
                {criticalMissing.length} critical fields missing — these will be prioritized in the follow-up form
              </p>
            </div>
          </div>
        </div>

        {/* Available Information */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            Information Already Available
          </h2>
          <div className="grid gap-2">
            {availableFields.map((field) => (
              <div 
                key={field.field}
                className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20"
              >
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-success" />
                  <div>
                    <p className="font-medium text-foreground">{field.label}</p>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border',
                  priorityConfig[field.priority].classes
                )}>
                  {priorityConfig[field.priority].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Information */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Missing Information
          </h2>
          <div className="grid gap-2">
            {missingFields.map((field) => (
              <div 
                key={field.field}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  field.priority === 'critical' 
                    ? 'bg-risk-high/5 border-risk-high/20' 
                    : 'bg-muted/30 border-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full',
                    field.priority === 'critical' ? 'bg-risk-high/10' : 'bg-muted'
                  )}>
                    <AlertCircle className={cn(
                      'h-4 w-4',
                      field.priority === 'critical' ? 'text-risk-high' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{field.label}</p>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border',
                  priorityConfig[field.priority].classes
                )}>
                  {priorityConfig[field.priority].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20 mb-8">
          <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Smart follow-up approach
            </p>
            <p className="text-sm text-muted-foreground">
              Instead of requesting all missing data, the next step will build a targeted form with only 3-5 questions focused on critical gaps. This increases response rates by 45% compared to comprehensive forms.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/case/new/consent')}>
            Back
          </Button>
          <Button variant="hero" onClick={() => navigate('/case/new/questions')}>
            Build Follow-up Questions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
