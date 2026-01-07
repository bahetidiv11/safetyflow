import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle,
  ArrowRight,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
import { ExtractedData, ICSRCase } from '@/types/icsr';
import { cn } from '@/lib/utils';

const sampleNarrative = `A 67-year-old male patient with metastatic melanoma was treated with pembrolizumab 200mg IV every 3 weeks. After the 4th infusion, the patient developed progressive fatigue, jaundice, and abdominal discomfort. Laboratory tests revealed ALT 890 U/L (normal <40), AST 720 U/L (normal <35), and total bilirubin 8.2 mg/dL.

The patient was hospitalised and pembrolizumab was permanently discontinued. IV methylprednisolone was initiated. The treating oncologist considers this event to be drug-related immune-mediated hepatitis.

Patient is currently recovering but remains hospitalised. The reporter (treating physician Dr. Smith) has consented to follow-up contact via email.`;

export default function CaseIntake() {
  const navigate = useNavigate();
  const { setCurrentCase } = useApp();
  const [narrative, setNarrative] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleExtract = async () => {
    setIsExtracting(true);
    
    // Simulate AI extraction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockExtraction: ExtractedData = {
      suspectDrug: { value: 'Pembrolizumab 200mg IV', confidence: 0.96 },
      adverseEvent: { value: 'Immune-mediated hepatitis (hepatotoxicity)', confidence: 0.94 },
      seriousness: { 
        indicators: ['Life-threatening (severe liver injury)', 'Hospitalization required'], 
        confidence: 0.98 
      },
      reporterType: { value: 'hcp', confidence: 0.95 },
      patientAge: { value: '67 years, male', confidence: 0.99 },
      eventDate: { value: 'After 4th infusion (~12 weeks)', confidence: 0.85 },
    };
    
    setExtractedData(mockExtraction);
    setIsExtracting(false);
  };

  const handleProceed = () => {
    const newCase: ICSRCase = {
      id: 'new-case-' + Date.now(),
      caseNumber: `ICSR-2024-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      narrativeText: narrative,
      suspectDrug: extractedData?.suspectDrug.value || '',
      adverseEvent: extractedData?.adverseEvent.value || '',
      seriousnessIndicators: extractedData?.seriousness.indicators || [],
      reporterType: extractedData?.reporterType.value || 'hcp',
      riskLevel: 'high',
      riskScore: 87,
      status: 'intake',
      createdAt: new Date(),
      updatedAt: new Date(),
      extractedData,
    };
    
    setCurrentCase(newCase);
    navigate('/case/new/risk');
  };

  const loadSample = () => {
    setNarrative(sampleNarrative);
    setExtractedData(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success bg-success/10';
    if (confidence >= 0.7) return 'text-warning bg-warning/10';
    return 'text-risk-high bg-risk-high/10';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="h-4 w-4" />
            <span>Module 1</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">ICSR Narrative Intake</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Unstructured Case Understanding</h1>
          <p className="text-muted-foreground">
            Paste or upload a free-text ICSR narrative. AI will extract key safety data points automatically.
          </p>
        </div>

        {/* Narrative Input */}
        <div className="card-elevated p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="font-medium text-foreground">Case Narrative</label>
            <Button variant="ghost" size="sm" onClick={loadSample}>
              Load sample narrative
            </Button>
          </div>
          <Textarea
            placeholder="Paste the ICSR narrative text here..."
            className="min-h-[200px] text-sm"
            value={narrative}
            onChange={(e) => {
              setNarrative(e.target.value);
              setExtractedData(null);
            }}
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {narrative.length} characters
            </p>
            <Button
              variant="hero"
              onClick={handleExtract}
              disabled={!narrative.trim() || isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Extracted Data */}
        {extractedData && (
          <div className="animate-slide-up">
            <div className="card-elevated p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <h2 className="font-semibold text-foreground">Extracted Information</h2>
              </div>

              <div className="grid gap-4">
                {/* Suspect Drug */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Suspect Drug</p>
                    <p className="font-medium text-foreground">{extractedData.suspectDrug.value}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getConfidenceColor(extractedData.suspectDrug.confidence)
                  )}>
                    {Math.round(extractedData.suspectDrug.confidence * 100)}% confident
                  </span>
                </div>

                {/* Adverse Event */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Adverse Event</p>
                    <p className="font-medium text-foreground">{extractedData.adverseEvent.value}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getConfidenceColor(extractedData.adverseEvent.confidence)
                  )}>
                    {Math.round(extractedData.adverseEvent.confidence * 100)}% confident
                  </span>
                </div>

                {/* Seriousness */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-risk-high/5 border border-risk-high/20">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Seriousness Indicators</p>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.seriousness.indicators.map((indicator) => (
                        <span 
                          key={indicator}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium risk-badge-high"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getConfidenceColor(extractedData.seriousness.confidence)
                  )}>
                    {Math.round(extractedData.seriousness.confidence * 100)}% confident
                  </span>
                </div>

                {/* Reporter Type & Patient Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Reporter Type</p>
                      <p className="font-medium text-foreground">
                        {extractedData.reporterType.value === 'hcp' ? 'Healthcare Professional' : 'Patient'}
                      </p>
                    </div>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getConfidenceColor(extractedData.reporterType.confidence)
                    )}>
                      {Math.round(extractedData.reporterType.confidence * 100)}%
                    </span>
                  </div>

                  {extractedData.patientAge && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Patient Demographics</p>
                        <p className="font-medium text-foreground">{extractedData.patientAge.value}</p>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getConfidenceColor(extractedData.patientAge.confidence)
                      )}>
                        {Math.round(extractedData.patientAge.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="flex justify-end">
              <Button variant="hero" size="lg" onClick={handleProceed}>
                Proceed to Risk Stratification
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
