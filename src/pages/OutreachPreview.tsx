import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Mail, MessageCircle, Shield, ArrowRight, ChevronDown, Eye, CheckCircle, Edit2, Loader2, Smartphone, Monitor
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { ProgressTracker } from '../components/shared/ProgressTracker';
import { cn } from '../lib/utils';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

type PreviewChannel = 'email' | 'whatsapp';

export default function OutreachPreview() {
  const navigate = useNavigate();
  const { currentCase, updateCaseStatus, updateCaseOutreach } = useApp();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewChannel, setPreviewChannel] = useState<PreviewChannel>('email');
  const [message, setMessage] = useState({
    subject: '',
    greeting: '',
    body: '',
    context_box: '',
    cta_text: 'Complete Follow-up Form',
    closing: '',
    estimated_time: ''
  });

  const reporterType = currentCase?.extractedData?.reporter_type?.value || 'hcp';
  const isHcp = reporterType === 'hcp';
  const drugName = currentCase?.extractedData?.suspect_drug?.value || 'the medication';
  const adverseEvent = currentCase?.extractedData?.adverse_event?.value || 'the reported event';
  const caseNumber = currentCase?.caseNumber || 'ICSR-2024-XXXX';
  const questionCount = currentCase?.followUpQuestions?.length || 0;

  // Generate personalized message via AI
  useEffect(() => {
    const generateMessage = async () => {
      if (!currentCase) return;
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke('adapt-outreach', {
          body: {
            drugName, adverseEvent, reporterType, channel: previewChannel, caseNumber, questionCount,
            meddraCode: currentCase.extractedData?.adverse_event?.meddra_pt
          }
        });
        if (!error && data && !data.error) {
          setMessage(data);
          updateCaseOutreach(data);
        }
      } catch (err) {
        console.error('Message generation failed:', err);
      } finally {
        setIsGenerating(false);
      }
    };
    generateMessage();
  }, [previewChannel, currentCase?.id]);

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
            <p className="text-muted-foreground mb-4">No case data available.</p>
            <Button variant="hero" onClick={() => navigate('/intake')}>Go to Case Intake</Button>
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-slide-up">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Follow-up Sent Successfully</h1>
            <p className="text-muted-foreground mb-8 max-w-md">Case {caseNumber} sent via {previewChannel}.</p>
            <ProgressTracker currentStatus="followup_sent" className="max-w-md mb-8" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
              <Button variant="hero" onClick={() => navigate('/reporter/inbox')}>
                View as Reporter <Eye className="h-4 w-4" />
              </Button>
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
        <ProgressTracker currentStatus="risk_classified" className="mb-8" />
        
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Send className="h-4 w-4" /><span>Module 6</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">Multi-Channel Outreach</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Persona-Adapted Message Preview</h1>
          <p className="text-muted-foreground">AI-personalized for {isHcp ? 'healthcare professional' : 'patient'} communication</p>
        </div>

        {/* Channel Toggle */}
        <div className="card-elevated p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Preview Channel</p>
            <div className="flex gap-2">
              <Button variant={previewChannel === 'email' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewChannel('email')}>
                <Monitor className="h-4 w-4 mr-1" /> Email
              </Button>
              <Button variant={previewChannel === 'whatsapp' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewChannel('whatsapp')}>
                <Smartphone className="h-4 w-4 mr-1" /> WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className={cn("card-elevated overflow-hidden mb-6", previewChannel === 'whatsapp' && "max-w-sm mx-auto")}>
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{previewChannel === 'email' ? 'Email' : 'WhatsApp'} Preview</h2>
            {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
          </div>
          <div className={cn("p-6", previewChannel === 'whatsapp' && "bg-[#e5ddd5] rounded-b-lg")}>
            {previewChannel === 'whatsapp' ? (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-foreground whitespace-pre-line">{message.greeting || `Hello ${isHcp ? 'Dr.' : ''},`}</p>
                <p className="text-sm text-foreground mt-2">{message.body || `Thank you for reporting. We need a few details about ${drugName}.`}</p>
                <div className="mt-3 p-2 bg-accent/10 rounded text-center">
                  <span className="text-accent font-medium text-sm">{message.cta_text}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{message.estimated_time || `~${questionCount} min`}</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="border-b border-border pb-4 mb-4">
                  <p className="text-sm"><span className="text-muted-foreground w-20 inline-block">Subject:</span><span className="font-medium">{message.subject || `Safety Follow-up: Case ${caseNumber}`}</span></p>
                </div>
                <p>{message.greeting || `Dear ${isHcp ? 'Healthcare Professional' : 'Patient'},`}</p>
                <p>{message.body || `Thank you for reporting regarding ${drugName}. We need additional details.`}</p>
                {message.context_box && <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg my-4"><p className="text-sm">{message.context_box}</p></div>}
                <div className="text-center my-4">
                  <Button variant="hero" className="pointer-events-none">{message.cta_text}<ArrowRight className="h-4 w-4" /></Button>
                </div>
                <p className="text-muted-foreground text-sm">{message.closing || 'SafetyFlow Team'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/case/new/questions')}>Back</Button>
          <Button variant="hero" onClick={handleSend} disabled={isSending}>
            {isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Follow-up</>}
          </Button>
        </div>
      </main>
    </div>
  );
}
