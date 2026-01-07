import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Info,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { useApp } from '@/contexts/AppContext';
import { RiskBreakdown } from '@/types/icsr';
import { cn } from '@/lib/utils';

const mockRiskBreakdown: RiskBreakdown = {
  seriousnessScore: 95,
  noveltyScore: 72,
  drugProfileScore: 85,
  dataCompletenessScore: 68,
  totalScore: 87,
  factors: [
    'Life-threatening adverse event (severe hepatotoxicity)',
    'Hospitalization required and ongoing',
    'Known drug class risk (checkpoint inhibitor)',
    'Immune-mediated reaction pattern',
    'High-value safety signal for regulatory reporting',
  ],
};

const riskCategories = [
  { name: 'Seriousness', score: mockRiskBreakdown.seriousnessScore, max: 100 },
  { name: 'Signal Novelty', score: mockRiskBreakdown.noveltyScore, max: 100 },
  { name: 'Drug Risk Profile', score: mockRiskBreakdown.drugProfileScore, max: 100 },
  { name: 'Data Completeness', score: mockRiskBreakdown.dataCompletenessScore, max: 100 },
];

export default function RiskStratification() {
  const navigate = useNavigate();
  const { currentCase } = useApp();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-risk-high';
    if (score >= 50) return 'bg-warning';
    return 'bg-success';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-risk-high';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl">
        {/* Progress Tracker */}
        <ProgressTracker currentStatus="risk_classified" className="mb-8" />

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span>Module 2</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">Risk Stratification</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Early Risk Classification</h1>
          <p className="text-muted-foreground">
            AI-powered analysis to prioritize cases based on safety significance
          </p>
        </div>

        {/* Risk Score Card */}
        <div className="card-elevated p-6 mb-6 border-l-4 border-l-risk-high">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${mockRiskBreakdown.totalScore * 2.2} 220`}
                    className="text-risk-high transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{mockRiskBreakdown.totalScore}</span>
                </div>
              </div>
              <div>
                <RiskBadge level="high" size="lg" />
                <p className="text-sm text-muted-foreground mt-2">
                  Case {currentCase?.caseNumber || 'ICSR-2024-0847'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-risk-high/10 text-risk-high">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Priority processing recommended</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            {riskCategories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  <span className={cn('text-sm font-bold', getScoreTextColor(category.score))}>
                    {category.score}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000', getScoreColor(category.score))}
                    style={{ width: `${category.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="card-elevated p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="font-semibold text-foreground">Why This Case is High Risk</h2>
          </div>
          <ul className="space-y-3">
            {mockRiskBreakdown.factors.map((factor, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-risk-high/10 text-risk-high text-xs font-medium">
                  {index + 1}
                </div>
                <span className="text-sm text-foreground">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/5 border border-info/20 mb-8">
          <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Early stratification impact
            </p>
            <p className="text-sm text-muted-foreground">
              High-risk cases identified early have 40% higher first-touch success rates compared to traditional workflows. This case will be prioritized for targeted follow-up.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
          <Button variant="hero" onClick={() => navigate('/case/new/consent')}>
            Check Consent & Eligibility
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
