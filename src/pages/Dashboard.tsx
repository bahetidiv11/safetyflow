import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ArrowUpRight,
  FileText,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { RiskBadge } from '../components/shared/RiskBadge';
import { StatusPill } from '../components/shared/StatusPill';
import { useApp } from '../contexts/AppContext';
import { ICSRCase, RiskLevel, CaseStatus } from '../types/icsr';

// Mock cases with the new structure for display
interface DisplayCase {
  id: string;
  caseNumber: string;
  suspectDrug: string;
  adverseEvent: string;
  reporterType: 'hcp' | 'patient';
  riskLevel: RiskLevel;
  riskScore: number;
  status: CaseStatus;
}

const mockDisplayCases: DisplayCase[] = [
  {
    id: '1',
    caseNumber: 'ICSR-2024-0847',
    suspectDrug: 'Pembrolizumab',
    adverseEvent: 'Severe hepatotoxicity',
    reporterType: 'hcp',
    riskLevel: 'high',
    riskScore: 87,
    status: 'risk_classified',
  },
  {
    id: '2',
    caseNumber: 'ICSR-2024-0846',
    suspectDrug: 'Adalimumab',
    adverseEvent: 'Injection site reaction',
    reporterType: 'patient',
    riskLevel: 'low',
    riskScore: 24,
    status: 'followup_sent',
  },
  {
    id: '3',
    caseNumber: 'ICSR-2024-0845',
    suspectDrug: 'Nivolumab',
    adverseEvent: 'Pneumonitis',
    reporterType: 'hcp',
    riskLevel: 'medium',
    riskScore: 62,
    status: 'response_received',
  },
  {
    id: '4',
    caseNumber: 'ICSR-2024-0844',
    suspectDrug: 'Trastuzumab',
    adverseEvent: 'Cardiotoxicity',
    reporterType: 'hcp',
    riskLevel: 'high',
    riskScore: 91,
    status: 'intake',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { metrics } = useApp();

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
                {mockDisplayCases.map((caseItem) => (
                  <tr 
                    key={caseItem.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/case/${caseItem.id}/risk`)}
                  >
                    <td className="px-4 py-4">
                      <span className="font-medium text-foreground">{caseItem.caseNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{caseItem.suspectDrug}</p>
                        <p className="text-sm text-muted-foreground">{caseItem.adverseEvent}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted-foreground capitalize">
                        {caseItem.reporterType === 'hcp' ? 'Healthcare Professional' : 'Patient'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <RiskBadge level={caseItem.riskLevel} size="sm" />
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={caseItem.status} size="sm" />
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
      </main>
    </div>
  );
}
