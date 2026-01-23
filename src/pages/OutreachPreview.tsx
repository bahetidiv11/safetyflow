import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Mail, MessageCircle, ArrowRight, ChevronDown, Eye, CheckCircle, Loader2, Smartphone, Monitor
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
              <Button
                variant={previewChannel === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewChannel('email')}
              >
                <Monitor className="h-4 w-4 mr-1" /> Email
              </Button>
              <Button
                variant={previewChannel === 'whatsapp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewChannel('whatsapp')}
              >
                <Smartphone className="h-4 w-4 mr-1" /> WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        {previewChannel === 'whatsapp' ? (
          // WhatsApp Mobile Frame
          <div className="flex justify-center mb-6">
            <div className="relative w-[320px] bg-[#111b21] rounded-[32px] p-2 shadow-2xl">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#111b21] rounded-b-xl z-10" />
              
              {/* Screen */}
              <div className="bg-[#0b141a] rounded-[24px] overflow-hidden">
                {/* WhatsApp header */}
                <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">SafetyFlow</p>
                    <p className="text-[#8696a0] text-xs">online</p>
                  </div>
                  {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-accent ml-auto" />}
                </div>

                {/* Chat area */}
                <div className="p-3 min-h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCBmaWxsPSIjMGIxNDFhIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiLz48cGF0aCBkPSJNMCAwaDQwdjQwSDBWMHptMjAgMjBhMSAxIDAgMSAxIDAgMiAxIDEgMCAwIDEgMC0yeiIgZmlsbD0iIzBkMTcxYiIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L3N2Zz4=')]">
                  {/* Message bubble */}
                  <div className="bg-[#005c4b] rounded-lg rounded-tr-none p-3 max-w-[85%] ml-auto mb-2">
                    <p className="text-white text-sm leading-relaxed">
                      {message.greeting || `Hello ${isHcp ? 'Dr.' : ''},`}
                    </p>
                    <p className="text-white text-sm leading-relaxed mt-2">
                      {message.body || `Thank you for reporting. We need a few details about ${drugName}.`}
                    </p>
                    <div className="mt-3 bg-[#025144] rounded p-2 text-center">
                      <span className="text-[#00a884] font-medium text-sm">{message.cta_text}</span>
                    </div>
                    <p className="text-[#8696a0] text-xs mt-2 text-right">
                      {message.estimated_time || `~${questionCount} min`}
                    </p>
                  </div>
                </div>

                {/* Input bar */}
                <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2">
                    <p className="text-[#8696a0] text-sm">Type a message</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Email Desktop View
          <div className="card-elevated overflow-hidden mb-6">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Email Preview</h2>
              </div>
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <div className="border-b border-border pb-4 mb-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground w-16 inline-block">To:</span>
                    <span className="font-medium">{isHcp ? 'healthcare.provider@hospital.org' : 'patient@email.com'}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground w-16 inline-block">Subject:</span>
                    <span className="font-medium">{message.subject || `Safety Follow-up: Case ${caseNumber}`}</span>
                  </p>
                </div>
                <p>{message.greeting || `Dear ${isHcp ? 'Healthcare Professional' : 'Patient'},`}</p>
                <p>{message.body || `Thank you for reporting regarding ${drugName}. We need additional details.`}</p>
                {message.context_box && (
                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg my-4">
                    <p className="text-sm">{message.context_box}</p>
                  </div>
                )}
                <div className="text-center my-6">
                  <Button variant="hero" className="pointer-events-none">
                    {message.cta_text}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">{message.closing || 'SafetyFlow Team'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          <Button variant="hero" onClick={handleSend} disabled={isSending}>
            {isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Follow-up</>}
          </Button>
        </div>
      </main>
    </div>
  );
}
