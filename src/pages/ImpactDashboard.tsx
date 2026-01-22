import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, Clock, Zap, ArrowRight, TrendingDown, Eye, Code } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { ProgressTracker } from '../components/shared/ProgressTracker';
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

export default function ImpactDashboard() {
  const navigate = useNavigate();
  const { currentCase, cases } = useApp();
  const [showPrompt, setShowPrompt] = useState(false);

  const toSeconds = (iso?: unknown) => {
    const s = typeof iso === 'string' ? iso : '';
    const ms = Date.parse(s);
    return Number.isFinite(ms) ? ms / 1000 : null;
  };

  const baselineTraditionalSeconds = 1209600; // 14 days
  const baselineImmediateTriageSeconds = 7200; // 2 hours

  const completedDurationsSeconds = cases
    .map((c) => {
      const created = toSeconds(c.created_at);
      const done = toSeconds(c.extraction_completed_at);
      if (created == null || done == null) return null;
      return Math.max(0, done - created);
    })
    .filter((v): v is number => typeof v === 'number');

  const avgSafetyFlowSeconds = completedDurationsSeconds.length
    ? completedDurationsSeconds.reduce((a, b) => a + b, 0) / completedDurationsSeconds.length
    : 0;

  const hoursReclaimed = completedDurationsSeconds.length
    ? completedDurationsSeconds.reduce((sum, s) => sum + Math.max(0, (baselineTraditionalSeconds - s) / 3600), 0)
    : 0;

  const efficiencyData = [
    { name: 'Traditional', seconds: baselineTraditionalSeconds, fill: 'hsl(var(--muted-foreground))' },
    { name: 'SafetyFlow', seconds: avgSafetyFlowSeconds, fill: 'hsl(var(--accent))' },
  ];

  const fmtDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0';
    if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`;
    if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
    if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds)}s`;
  };

  const timelineSteps = [
    { id: 'intake', label: 'Intake', status: currentCase?.status ? 'completed' : 'pending' },
    { id: 'triage', label: 'Triage', status: currentCase?.riskAnalysis ? 'completed' : 'pending' },
    { id: 'followup', label: 'Follow-up Sent', status: currentCase?.sentAt ? 'completed' : 'pending' },
    { id: 'response', label: 'Response Ingested', status: currentCase?.respondedAt ? 'completed' : 'pending' },
    { id: 'review', label: 'Ready for Review', status: currentCase?.status === 'ready_for_review' ? 'current' : 'pending' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">SafetyFlow Impact Dashboard</h1>
          <p className="text-muted-foreground">Closed-loop pharmacovigilance demonstration</p>
        </div>

        {/* Timeline Stepper */}
        <div className="card-elevated p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-6">Case Timeline: {currentCase?.caseNumber || 'Demo'}</h3>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {idx > 0 && <div className={cn('flex-1 h-0.5', step.status !== 'pending' ? 'bg-accent' : 'bg-border')} />}
                  <div className={cn('flex items-center justify-center w-10 h-10 rounded-full border-2', step.status === 'completed' ? 'bg-accent border-accent text-white' : step.status === 'current' ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-background text-muted-foreground')}>
                    {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-medium">{idx + 1}</span>}
                  </div>
                  {idx < timelineSteps.length - 1 && <div className={cn('flex-1 h-0.5', timelineSteps[idx + 1]?.status !== 'pending' ? 'bg-accent' : 'bg-border')} />}
                </div>
                <span className="mt-2 text-xs font-medium text-center text-muted-foreground">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Processing Time Comparison</h3>
              <p className="text-sm text-muted-foreground">Traditional vs SafetyFlow workflow</p>
            </div>
            <div className="flex items-center gap-2 text-success">
              <TrendingDown className="h-5 w-5" />
              <span className="font-bold">93% faster</span>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, baselineTraditionalSeconds]} tickFormatter={(v) => fmtDuration(Number(v))} />
                <YAxis type="category" dataKey="name" />
                <Bar dataKey="seconds" radius={[0, 4, 4, 0]}>
                  {efficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center"><p className="text-2xl font-bold text-muted-foreground">14 days</p><p className="text-xs text-muted-foreground">Traditional baseline</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-accent">{fmtDuration(avgSafetyFlowSeconds)}</p><p className="text-xs text-muted-foreground">SafetyFlow avg</p></div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-4 text-center">
            <Zap className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{Math.round(hoursReclaimed)}</p>
            <p className="text-sm text-muted-foreground">Hours reclaimed</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <Clock className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{fmtDuration(avgSafetyFlowSeconds)}</p>
            <p className="text-sm text-muted-foreground">Avg SafetyFlow processing</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <TrendingDown className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{fmtDuration(baselineImmediateTriageSeconds)}</p>
            <p className="text-sm text-muted-foreground">Immediate triage baseline</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Code className="h-4 w-4 mr-1" /> View System Prompt</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Gemini System Prompt (Reproducibility)</DialogTitle></DialogHeader>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">{SYSTEM_PROMPT_PREVIEW}</pre>
            </DialogContent>
          </Dialog>
          <Button variant="hero" onClick={() => navigate('/dashboard')}>Return to Dashboard <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </main>
    </div>
  );
}
