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
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Header } from '../components/layout/Header';
import { useApp, calculateRisk } from '../contexts/AppContext';
import { AIExtractedData, MissingField } from '../types/icsr';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { externalSupabase } from '../lib/externalSupabase';
import { toast } from 'sonner';

const sampleNarrative = `A 67-year-old male patient with metastatic melanoma was treated with pembrolizumab 200mg IV every 3 weeks. After the 4th infusion, the patient developed progressive fatigue, jaundice, and abdominal discomfort. Laboratory tests revealed ALT 890 U/L (normal <40), AST 720 U/L (normal <35), and total bilirubin 8.2 mg/dL.

The patient was hospitalised and pembrolizumab was permanently discontinued. IV methylprednisolone was initiated. The treating oncologist considers this event to be drug-related immune-mediated hepatitis.

Patient is currently recovering but remains hospitalised. The reporter (treating physician Dr. Smith) has consented to follow-up contact via email.`;

export default function CaseIntake() {
  const navigate = useNavigate();
  const {
    initializeNewCase,
    updateCaseExtraction,
    updateCaseRiskAnalysis,
    currentCase,
    setCurrentCase,
    setCases,
  } = useApp();
  const [narrative, setNarrative] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<AIExtractedData | null>(null);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [caseCreatedAt, setCaseCreatedAt] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!narrative.trim()) return;
    
    setIsExtracting(true);
    // Keep this for UI/diagnostics if needed, but the DB timestamps are set at extraction completion per spec.
    const startedAtIso = new Date().toISOString();
    setCaseCreatedAt(startedAtIso);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-icsr', {
        body: { narrative }
      });

      if (error) {
        console.error('Extraction error:', error);
        toast.error('Failed to extract data. Please try again.');
        setIsExtracting(false);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setIsExtracting(false);
        return;
      }

      setExtractedData(data.extractedData);
      setMissingFields(data.missingFieldsDetailed);
      
      // Initialize the case with narrative
      initializeNewCase(narrative);

       // Immediately persist to external live DB (closed-loop ingestion)
       try {
         const finishedAtIso = new Date().toISOString();
         const risk = calculateRisk(data.extractedData, data.missingFieldsDetailed);
         const riskScoreLabel = risk.level === 'high' ? 'High' : risk.level === 'medium' ? 'Medium' : 'Low';

         const payload = {
           // Exact keys required by the live cases table schema
           status: 'intake',
           risk_score: riskScoreLabel,
           suspect_drug: data.extractedData?.suspect_drug?.value ?? null,
           adverse_event: data.extractedData?.adverse_event?.value ?? null,
           meddra_pt: data.extractedData?.adverse_event?.meddra_pt ?? null,
           reporter_type: data.extractedData?.reporter_type?.value ?? null,
           narrative: narrative || null,
           created_at: finishedAtIso,
           extraction_completed_at: finishedAtIso,
           // Default to finishedAtIso to satisfy NOT NULL constraints; set to null later if your schema allows it.
           completed_at: finishedAtIso,
         };

         const { error: insertError } = await externalSupabase.from('cases').insert([payload]);
         if (insertError) {
           console.error('Full Supabase Error:', insertError);
           alert('Save failed: ' + insertError.message);
         } else {
           // Force immediate UI refresh (in addition to realtime), so the dashboard count updates without waiting.
           const { data: refreshed, error: refreshError } = await externalSupabase
             .from('cases')
             .select('*')
             .order('created_at', { ascending: false });
           if (!refreshError && Array.isArray(refreshed)) setCases(refreshed as any);
         }
       } catch (e) {
         // DB write is best-effort; keep the UI flow unblocked.
         console.warn('External DB insert failed:', e);
       }
      
      toast.success('Data extracted successfully!');
    } catch (err) {
      console.error('Extraction failed:', err);
      toast.error('Extraction failed. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProceed = () => {
    if (!extractedData || !currentCase) return;
    
    // Update case with extracted data and missing fields
    updateCaseExtraction(extractedData, missingFields);
    
    // Calculate and set risk analysis
    const riskAnalysis = calculateRisk(extractedData, missingFields);
    updateCaseRiskAnalysis(riskAnalysis);
    
    navigate('/case/new/risk');
  };

  const loadSample = () => {
    setNarrative(sampleNarrative);
    setExtractedData(null);
    setMissingFields([]);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-success bg-success/10';
    if (confidence >= 0.7) return 'text-warning bg-warning/10';
    return 'text-risk-high bg-risk-high/10';
  };

  const renderExtractedField = (label: string, field: { value: string | null; confidence: number; found: boolean } | undefined) => {
    if (!field) return null;
    
    return (
      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="font-medium text-foreground">
            {field.found && field.value ? field.value : <span className="text-muted-foreground italic">Not found in narrative</span>}
          </p>
        </div>
        {field.found && (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            getConfidenceColor(field.confidence)
          )}>
            {Math.round(field.confidence * 100)}% confident
          </span>
        )}
        {!field.found && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
            Missing
          </span>
        )}
      </div>
    );
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
              setMissingFields([]);
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
                {renderExtractedField('Suspect Drug', extractedData.suspect_drug)}
                {renderExtractedField('Adverse Event', extractedData.adverse_event)}
                
                {/* Seriousness */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-risk-high/5 border border-risk-high/20">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Severity & Seriousness Indicators</p>
                    <p className="font-medium text-foreground mb-2">
                      {extractedData.severity?.value || 'Not determined'}
                    </p>
                    {extractedData.seriousness_indicators && extractedData.seriousness_indicators.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {extractedData.seriousness_indicators.map((indicator, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium risk-badge-high"
                          >
                            <AlertCircle className="h-3 w-3" />
                            {indicator}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {extractedData.severity?.found && (
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getConfidenceColor(extractedData.severity.confidence)
                    )}>
                      {Math.round(extractedData.severity.confidence * 100)}% confident
                    </span>
                  )}
                </div>

                {/* Reporter & Patient */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Reporter Type</p>
                      <p className="font-medium text-foreground">
                        {extractedData.reporter_type?.found && extractedData.reporter_type?.value === 'hcp' 
                          ? 'Healthcare Professional' 
                          : extractedData.reporter_type?.value === 'patient'
                          ? 'Patient'
                          : 'Not specified'}
                      </p>
                    </div>
                    {extractedData.reporter_type?.found && (
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getConfidenceColor(extractedData.reporter_type.confidence)
                      )}>
                        {Math.round(extractedData.reporter_type.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {extractedData.patient_demographics && (
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Patient Demographics</p>
                        <p className="font-medium text-foreground">
                          {extractedData.patient_demographics.found && extractedData.patient_demographics.value 
                            ? extractedData.patient_demographics.value 
                            : 'Not specified'}
                        </p>
                      </div>
                      {extractedData.patient_demographics.found && (
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getConfidenceColor(extractedData.patient_demographics.confidence)
                        )}>
                          {Math.round(extractedData.patient_demographics.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Missing Fields Summary */}
                {missingFields.filter(f => !f.available).length > 0 && (
                  <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="text-sm font-medium text-foreground mb-2">
                      {missingFields.filter(f => !f.available).length} fields not found in narrative
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {missingFields.filter(f => !f.available).map((field) => (
                        <span 
                          key={field.field}
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            field.priority === 'critical' ? 'bg-risk-high/10 text-risk-high' :
                            field.priority === 'important' ? 'bg-warning/10 text-warning' :
                            'bg-muted text-muted-foreground'
                          )}
                        >
                          {field.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
