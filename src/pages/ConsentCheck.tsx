import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Check,
  X,
  ArrowRight,
  ChevronDown,
  Mail,
  MessageSquare,
  Globe,
  User,
  Building
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { ProgressTracker } from '../components/shared/ProgressTracker';
import { cn } from '../lib/utils';
import { ContactChannel, ConsentStatus } from '../types/icsr';
import { useApp } from '../contexts/AppContext';

interface ChannelOption {
  id: ContactChannel;
  label: string;
  icon: React.ElementType;
  available: boolean;
  preferred?: boolean;
}

export default function ConsentCheck() {
  const navigate = useNavigate();
  const { currentCase, updateCaseConsent } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<ContactChannel>('email');

  // Derive reporter type from extracted data
  const extractedReporterType = currentCase?.extractedData?.reporter_type?.value || 'hcp';
  const isHcp = extractedReporterType === 'hcp';

  const channels: ChannelOption[] = [
    { id: 'email', label: 'Email', icon: Mail, available: true, preferred: true },
    { id: 'portal', label: 'Secure Portal', icon: Globe, available: true },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, available: false },
  ];

  // Dynamic consent checks based on extracted data
  const consentChecks = [
    { 
      label: 'Reporter identity verified', 
      status: 'pass' as const,
      detail: isHcp ? 'Healthcare Professional (Treating Physician)' : 'Patient/Consumer'
    },
    { 
      label: 'Re-contact consent obtained', 
      status: 'pass' as const,
      detail: 'Explicit consent recorded in initial report'
    },
    { 
      label: 'Contact information available', 
      status: 'pass' as const,
      detail: 'Email address confirmed valid'
    },
    { 
      label: 'No contact restrictions', 
      status: 'pass' as const,
      detail: 'No GDPR restrictions or opt-outs on file'
    },
  ];

  const handleProceed = () => {
    // Update case with consent status
    const consentStatus: ConsentStatus = {
      recontactAllowed: true,
      allowedChannels: channels.filter(c => c.available).map(c => c.id),
      preferredChannel: selectedChannel,
      reporterDetails: {
        type: extractedReporterType as 'hcp' | 'patient',
        role: isHcp ? 'Treating Physician' : undefined,
        institution: isHcp ? 'Medical Center' : undefined,
        email: 'reporter@example.com'
      }
    };
    
    updateCaseConsent(consentStatus);
    navigate('/case/new/missing');
  };

  if (!currentCase?.extractedData) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl">
        {/* Progress Tracker */}
        <ProgressTracker currentStatus="risk_classified" className="mb-8" />

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Shield className="h-4 w-4" />
            <span>Module 3</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">Consent & Eligibility</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Consent Verification</h1>
          <p className="text-muted-foreground">
            Verify reporter consent and determine permitted follow-up channels
          </p>
        </div>

        {/* Reporter Information - Dynamic from extracted data */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Reporter Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Reporter Type</p>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">
                  {isHcp ? 'Healthcare Professional' : 'Patient/Consumer'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Suspect Drug</p>
              <p className="font-medium text-foreground">
                {currentCase.extractedData.suspect_drug?.value || 'Not specified'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Case Number</p>
              <p className="font-medium text-foreground">{currentCase.caseNumber}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
              <p className="font-medium text-foreground capitalize">
                {currentCase.riskAnalysis?.level || 'Pending'} Risk
              </p>
            </div>
          </div>
        </div>

        {/* Consent Checks */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Consent Status
          </h2>
          <div className="space-y-3">
            {consentChecks.map((check, index) => (
              <div 
                key={index}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg',
                  check.status === 'pass' ? 'bg-success/5 border border-success/20' : 'bg-risk-high/5 border border-risk-high/20'
                )}
              >
                <div className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  check.status === 'pass' ? 'bg-success/10' : 'bg-risk-high/10'
                )}>
                  {check.status === 'pass' ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <X className="h-4 w-4 text-risk-high" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{check.label}</p>
                  <p className="text-sm text-muted-foreground">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permitted Channels */}
        <div className="card-elevated p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-4">Permitted Follow-up Channels</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => channel.available && setSelectedChannel(channel.id)}
                disabled={!channel.available}
                className={cn(
                  'relative p-4 rounded-lg border-2 text-left transition-all',
                  channel.available
                    ? selectedChannel === channel.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50 hover:bg-muted/30'
                    : 'border-border/50 bg-muted/20 opacity-60 cursor-not-allowed'
                )}
              >
                {channel.preferred && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                    Preferred
                  </span>
                )}
                <channel.icon className={cn(
                  'h-6 w-6 mb-2',
                  selectedChannel === channel.id ? 'text-accent' : 'text-muted-foreground'
                )} />
                <p className="font-medium text-foreground">{channel.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {channel.available ? 'Available' : 'Not permitted'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/case/new/risk')}>
            Back
          </Button>
          <Button variant="hero" onClick={handleProceed}>
            Identify Missing Information
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
