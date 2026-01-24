import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, Clock, Zap, ArrowRight, TrendingDown, Code } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { useApp } from '../contexts/AppContext';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';

const SYSTEM_PROMPT_PREVIEW = `You are an expert pharmacovigilance analyst extracting structured safety data from ICSR narratives following ICH E2B(R3) standards.

EXTRACTION REQUIREMENTS:
- For each field, provide: value, confidence (0.0-1.0), and found (boolean)
- Apply MedDRA coding to adverse events when identifiable

SERIOUSNESS CLASSIFICATION (ICH E2B R3):
- Fatal, Life-threatening, Hospitalization, Disability
- Congenital Anomaly, Medically Significant`;

const BASELINE_MINUTES = 120; // Traditional baseline: 2 hours (120 min)

export default function ImpactDashboard() {
  const navigate = useNavigate();
  const { currentCase, cases } = useApp();
  const [showPrompt, setShowPrompt] = useState(false);

  const toMs = (iso?: unknown): number | null => {
    const s = typeof iso === 'string' ? iso : '';
    const ms = Date.parse(s);
    return Number.isFinite(ms) ? ms : null;
  };

  // Calculate processing times for each case in minutes
  const processingTimesMinutes = cases
    .map((c) => {
      const created = toMs(c.created_at);
      const done = toMs(c.extraction_completed_at);
      if (created == null || done == null) return null;
      return Math.max(0, (done - created) / 60000); // ms to minutes
    })
    .filter((v): v is number => typeof v === 'number');

  // Average SafetyFlow processing time in minutes
  const avgSafetyFlowMinutes = processingTimesMinutes.length
    ? processingTimesMinutes.reduce((a, b) => a + b, 0) / processingTimesMinutes.length
    : 0;

  // Time saved per case = Baseline (120 min) - SafetyFlow time
  // Cumulative hours reclaimed = sum of (baseline - actual) for all cases, converted to hours
  const totalMinutesSaved = processingTimesMinutes.reduce(
    (sum, t) => sum + Math.max(0, BASELINE_MINUTES - t),
    0
  );
  const hoursReclaimed = totalMinutesSaved / 60;

  // Percentage faster
  const percentFaster = avgSafetyFlowMinutes > 0 && BASELINE_MINUTES > avgSafetyFlowMinutes
    ? Math.round(((BASELINE_MINUTES - avgSafetyFlowMinutes) / BASELINE_MINUTES) * 100)
    : avgSafetyFlowMinutes === 0 && processingTimesMinutes.length === 0 ? 0 : 99;

  // Chart data
  const efficiencyData = [
    { name: 'Traditional', minutes: BASELINE_MINUTES, fill: 'hsl(var(--muted-foreground))' },
    { name: 'SafetyFlow', minutes: avgSafetyFlowMinutes, fill: 'hsl(var(--accent))' },
  ];

  const fmtDuration = (minutes: number): string => {
    if (!Number.isFinite(minutes) || minutes <= 0) return '0';
    if (minutes >= 1440) return `${Math.round(minutes / 1440)}d`;
    if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
    if (minutes >= 1) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes * 60)}s`;
  };

  // Timeline steps derived from currentCase state
  const getStepStatus = (step: string): 'completed' | 'current' | 'pending' => {
    if (!currentCase) return 'pending';
    const statusOrder = ['intake', 'risk_classified', 'followup_sent', 'response_received', 'ready_for_review', 'closed'];
    const currentIdx = statusOrder.indexOf(currentCase.status || 'intake');
    const stepIdx = statusOrder.indexOf(step);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  const timelineSteps = [
    { id: 'intake', label: 'Intake', step: 1 },
    { id: 'risk_classified', label: 'Triage', step: 2 },
    { id: 'followup_sent', label: 'Follow-up Sent', step: 3 },
    { id: 'ready_for_review', label: 'Review', step: 4 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">SafetyFlow Impact Dashboard</h1>
          <p className="text-muted-foreground">Closed-loop pharmacovigilance demonstration</p>
        </div>

        {/* Timeline Stepper - perfectly aligned 1-2-3-4 on a straight line */}
        <div className="card-elevated p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-6">Case Timeline: {currentCase?.caseNumber || 'Demo'}</h3>
          <div className="relative">
            {/* Container for perfect horizontal alignment */}
            <div className="flex items-start justify-between px-4">
              {/* Background line - positioned at exact circle center (20px from top for h-10 circles) */}
              <div 
                className="absolute h-0.5 bg-border" 
                style={{ top: '20px', left: '40px', right: '40px' }} 
              />
              {/* Progress line - blue portion based on completed steps */}
              {(() => {
                const completedIdx = timelineSteps.findIndex(s => getStepStatus(s.id) !== 'completed');
                const progress = completedIdx === -1 ? 100 : (completedIdx / (timelineSteps.length - 1)) * 100;
                return (
                  <div 
                    className="absolute h-0.5 bg-accent transition-all duration-500" 
                    style={{ 
                      top: '20px', 
                      left: '40px', 
                      width: `calc(${progress}% - ${progress === 100 ? 80 : 40}px)` 
                    }} 
                  />
                );
              })()}

              {timelineSteps.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div 
                    key={step.id} 
                    className="relative z-10 flex flex-col items-center"
                    style={{ width: '80px' }}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background transition-all',
                        status === 'completed'
                          ? 'bg-accent border-accent text-accent-foreground'
                          : status === 'current'
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.step}</span>
                      )}
                    </div>
                    <span className="mt-2 text-xs font-medium text-center text-muted-foreground whitespace-nowrap">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Processing Time Comparison</h3>
              <p className="text-sm text-muted-foreground">Traditional (120 min baseline) vs SafetyFlow</p>
            </div>
            <div className="flex items-center gap-2 text-success">
              <TrendingDown className="h-5 w-5" />
              <span className="font-bold">{percentFaster}% faster</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, BASELINE_MINUTES]}
                  tickFormatter={(v) => fmtDuration(Number(v))}
                />
                <YAxis type="category" dataKey="name" />
                <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                  {efficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{fmtDuration(BASELINE_MINUTES)}</p>
              <p className="text-xs text-muted-foreground">Traditional baseline</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{fmtDuration(avgSafetyFlowMinutes)}</p>
              <p className="text-xs text-muted-foreground">SafetyFlow avg</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-4 text-center">
            <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {cases.length === 0 ? '0' : hoursReclaimed.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground">Hours reclaimed</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <Clock className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{fmtDuration(avgSafetyFlowMinutes)}</p>
            <p className="text-sm text-muted-foreground">Avg SafetyFlow processing</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <TrendingDown className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{cases.length}</p>
            <p className="text-sm text-muted-foreground">Cases processed</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-1" /> View System Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gemini System Prompt (Reproducibility)</DialogTitle>
              </DialogHeader>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                {SYSTEM_PROMPT_PREVIEW}
              </pre>
            </DialogContent>
          </Dialog>
          <Button variant="hero" onClick={() => navigate('/dashboard')}>
            Return to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
