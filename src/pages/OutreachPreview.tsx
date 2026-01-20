import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Mail,
  Shield,
  ArrowRight,
  ChevronDown,
  Eye,
  CheckCircle,
  Edit2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { ProgressTracker } from '../components/shared/ProgressTracker';
import { cn } from '../lib/utils';
import { useApp } from '../contexts/AppContext';

export default function OutreachPreview() {
  const navigate = useNavigate();
  const { currentCase, updateCaseStatus } = useApp();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Dynamic template data from currentCase
  const reporterType = currentCase?.extractedData?.reporter_type?.value || 'hcp';
  const isHcp = reporterType === 'hcp';
  const drugName = currentCase?.extractedData?.suspect_drug?.value || 'the medication';
  const caseNumber = currentCase?.caseNumber || 'ICSR-2024-XXXX';
  const questionCount = currentCase?.followUpQuestions?.length || 0;

  const handleSend = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setIsSent(true);
    updateCaseStatus('followup_sent');
  };

  if (!currentCase?.followUpQuestions) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No case data available. Please start from intake.</p>
            <Button variant="hero" onClick={() => navigate('/intake')}>
              Go to Case Intake
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isSent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="animate-slide-up">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-6 mx-auto">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Follow-up Sent Successfully</h1>
              <p className="text-muted-foreground mb-8 max-w-md">
                The personalised follow-up request for case {caseNumber} has been sent to the {isHcp ? 'healthcare professional' : 'patient'} via email. You'll be notified when they respond.
              </p>
              <div className="card-elevated p-6 mb-8 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-foreground mb-3">Case Status Updated</h3>
                <ProgressTracker currentStatus="followup_sent" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </Button>
                <Button variant="hero" onClick={() => navigate('/reporter/inbox')}>
                  View as Reporter
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl">
        {/* Progress Tracker */}
        <ProgressTracker currentStatus="risk_classified" className="mb-8" />

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Send className="h-4 w-4" />
            <span>Module 6</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">Trusted Outreach</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Follow-up Message Preview</h1>
          <p className="text-muted-foreground">
            Review the personalized outreach message before sending to the reporter
          </p>
        </div>

        {/* Channel Selection */}
        <div className="card-elevated p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">
                  {currentCase.consentStatus?.preferredChannel === 'email' ? 'Preferred channel' : 'Selected channel'}
                </p>
              </div>
            </div>
            <div className="flex-1" />
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              <Shield className="h-3 w-3 mr-1" />
              Consent Verified
            </span>
          </div>
        </div>

        {/* Email Preview - Using template literals */}
        <div className="card-elevated overflow-hidden mb-6">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Email Preview</h2>
            <Button variant="ghost" size="sm">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          </div>
          <div className="p-6">
            {/* Email Header */}
            <div className="border-b border-border pb-4 mb-4">
              <div className="grid gap-2 text-sm">
                <div className="flex">
                  <span className="w-20 text-muted-foreground">To:</span>
                  <span className="text-foreground">{isHcp ? 'healthcare.professional@hospital.org' : 'patient@email.com'}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-muted-foreground">Subject:</span>
                  <span className="text-foreground font-medium">Important Safety Follow-up: Case {caseNumber}</span>
                </div>
              </div>
            </div>

            {/* Email Body - Dynamic content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground">
                Dear {isHcp ? 'Healthcare Professional' : 'Patient'},
              </p>
              
              <p className="text-foreground">
                Thank you for reporting a suspected adverse event involving <strong>{drugName}</strong>. Your report is helping us ensure patient safety and advance our understanding of this treatment.
              </p>

              <div className="my-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-sm font-medium text-foreground mb-2">Why we're reaching out:</p>
                <p className="text-sm text-muted-foreground mb-0">
                  To complete our safety assessment, we need a few additional details about {isHcp ? "the patient's condition" : 'your condition'}. This information is critical for regulatory reporting and to help protect other patients.
                </p>
              </div>

              <p className="text-foreground">
                We've prepared a short form (estimated {Math.max(2, questionCount)} minutes) with only {questionCount} essential question{questionCount !== 1 ? 's' : ''}. {isHcp ? 'Your expertise is invaluable in helping us understand this case fully.' : 'Your feedback is important to us.'}
              </p>

              <div className="my-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <Button variant="hero" className="pointer-events-none">
                  Complete Follow-up Form
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Secure link · Expires in 14 days
                </p>
              </div>

              <p className="text-foreground">
                If you have any questions or prefer to provide information by phone, please contact our pharmacovigilance team at +1-800-SAFETY-1.
              </p>

              <p className="text-foreground mb-0">
                Thank you for your commitment to patient safety.
              </p>

              <p className="text-muted-foreground text-sm mt-6">
                Best regards,<br />
                SafetyFlow Pharmacovigilance Team<br />
                <span className="text-xs">This is an automated message. Please do not reply directly to this email.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Shield, label: 'GDPR Compliant', desc: 'Data protected' },
            { icon: Mail, label: 'Verified Sender', desc: 'Authenticated domain' },
            { icon: CheckCircle, label: 'Consent Tracked', desc: 'Audit trail logged' },
          ].map((item) => (
            <div key={item.label} className="card-elevated p-4 text-center">
              <item.icon className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/case/new/questions')}>
            Back
          </Button>
          <Button 
            variant="hero" 
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Follow-up
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
