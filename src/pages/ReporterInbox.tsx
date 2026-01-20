import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Shield,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { useApp } from '../contexts/AppContext';

export default function ReporterInbox() {
  const navigate = useNavigate();
  const { currentCase } = useApp();

  // Dynamic request from currentCase or fallback mock
  const requests = currentCase ? [{
    id: currentCase.id,
    subject: `Important Safety Follow-up: Case ${currentCase.caseNumber}`,
    drug: currentCase.extractedData?.suspect_drug?.value || 'Unknown Drug',
    receivedAt: 'Just now',
    urgency: currentCase.riskAnalysis?.level === 'high' ? 'high' : 'low',
    questionsCount: currentCase.followUpQuestions?.length || 0,
    estimatedTime: `${Math.max(2, currentCase.followUpQuestions?.length || 0)} min`,
  }] : [{
    id: '1',
    subject: 'Important Safety Follow-up: Case ICSR-2024-0847',
    drug: 'Pembrolizumab',
    receivedAt: '2 hours ago',
    urgency: 'high' as const,
    questionsCount: 4,
    estimatedTime: '3 min',
  }];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Follow-up Requests</h1>
          <p className="text-muted-foreground">
            Thank you for helping improve patient safety. Complete these short forms to provide additional information.
          </p>
        </div>

        <div className="card-elevated p-4 mb-6 bg-gradient-to-r from-accent/5 to-transparent border-accent/20">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium text-foreground text-sm">Your data is protected</p>
              <p className="text-xs text-muted-foreground">
                All information is encrypted and used only for safety assessment purposes
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {requests.map((request) => (
            <div 
              key={request.id}
              className="card-elevated p-5 hover:shadow-elevated transition-shadow cursor-pointer"
              onClick={() => navigate('/reporter/form/current')}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  request.urgency === 'high' ? 'bg-risk-high/10' : 'bg-muted'
                }`}>
                  <Mail className={`h-5 w-5 ${
                    request.urgency === 'high' ? 'text-risk-high' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">{request.subject}</h3>
                    {request.urgency === 'high' && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium risk-badge-high">
                        <AlertCircle className="h-3 w-3" />
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Regarding: {request.drug}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {request.receivedAt}
                    </span>
                    <span>•</span>
                    <span>{request.questionsCount} questions</span>
                    <span>•</span>
                    <span>~{request.estimatedTime}</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{' '}
            <a href="mailto:safety@example.com" className="text-accent hover:underline">
              safety@example.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
