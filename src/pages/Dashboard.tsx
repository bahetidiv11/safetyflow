import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ArrowUpRight,
  FileText as FileTextIcon,
  Zap,
  FileText,
  BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { RiskBadge } from '../components/shared/RiskBadge';
import { StatusPill } from '../components/shared/StatusPill';
import { useApp } from '../contexts/AppContext';
import type { RiskLevel } from '../types/icsr';

export default function Dashboard() {
  const navigate = useNavigate();
  const { metrics, cases } = useApp();

  const recentCases = cases.slice(0, 8);

  const toRiskLevel = (riskScore: unknown): RiskLevel => {
    const v = String(riskScore || '').toLowerCase();
    if (v === 'high') return 'high';
    if (v === 'medium') return 'medium';
    return 'low';
  };

  const metricCards = [
    {
      label: 'Total Active Cases',
      value: metrics.totalCases,
      icon: FileText,
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'High Risk Cases',
      value: metrics.highRiskCases,
      icon: AlertTriangle,
      trend: '-3',
      trendUp: false,
      highlight: true,
    },
    {
      label: 'First-Touch Success',
      value: `${metrics.firstTouchSuccess}%`,
      icon: Zap,
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Avg Response Time',
      value: metrics.averageResponseTime,
      icon: Clock,
      trend: '-0.5d',
      trendUp: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Case Dashboard</h1>
            <p className="text-muted-foreground">Manage and monitor ICSR cases in real-time</p>
          </div>
          <Button variant="hero" onClick={() => navigate('/intake')}>
            <Plus className="h-4 w-4" />
            New Case Intake
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((metric) => (
            <div
              key={metric.label}
              className={`card-elevated p-5 ${metric.highlight ? 'border-l-4 border-l-risk-high' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <metric.icon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.trendUp ? 'text-success' : 'text-risk-high'
                }`}>
                  <TrendingUp className={`h-3 w-3 ${!metric.trendUp && 'rotate-180'}`} />
                  {metric.trend}
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Performance Highlight */}
        <div className="card-elevated p-6 mb-8 bg-gradient-to-r from-accent/5 to-success/5 border-accent/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                34% fewer FU2/TFUC cases this month
              </h3>
              <p className="text-sm text-muted-foreground">
                Early risk stratification and personalised follow-ups are reducing repeat outreach attempts
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              View Analytics
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cases Table */}
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Cases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Case ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Drug / Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {recentCases.map((caseItem) => (
                  <tr 
                     key={String(caseItem.id)} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                     onClick={() => navigate(`/case/${caseItem.id}/risk`)}
                  >
                    <td className="px-4 py-4">
                       <span className="font-medium text-foreground">{String(caseItem.id)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                         <p className="font-medium text-foreground">{String(caseItem.suspect_drug || '—')}</p>
                         <p className="text-sm text-muted-foreground">{String(caseItem.adverse_event || '—')}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted-foreground capitalize">
                         {String(caseItem.reporter_type || '').toLowerCase() === 'hcp'
                           ? 'Healthcare Professional'
                           : String(caseItem.reporter_type || '').toLowerCase() === 'patient'
                           ? 'Patient'
                           : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                       <RiskBadge level={toRiskLevel(caseItem.risk_score)} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                       <StatusPill status={(String(caseItem.status || 'intake') as any)} size="sm" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Review
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {cases.length === 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Ready for first case.
            </div>
          )}

        {/* Footer with Project Report Link */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Competition Submission</h3>
              <p className="text-sm text-muted-foreground">View the complete project documentation and methodology</p>
            </div>
            <Button 
              variant="hero" 
              onClick={() => navigate('/project-report')}
            >
              <BookOpen className="h-4 w-4" />
              View Full Project Report
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
