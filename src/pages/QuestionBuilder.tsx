import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  GripVertical,
  ArrowRight,
  ChevronDown,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2,
  Brain,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { ProgressTracker } from '../components/shared/ProgressTracker';
import { FollowUpQuestion } from '../types/icsr';
import { cn } from '../lib/utils';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function QuestionBuilder() {
  const navigate = useNavigate();
  const { currentCase, updateCaseQuestions } = useApp();
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reasoning, setReasoning] = useState<string>('');

  // Generate questions via AI based on drug-event pair
  const generateAIQuestions = async () => {
    if (!currentCase?.extractedData) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          drugName: currentCase.extractedData.suspect_drug?.value,
          adverseEvent: currentCase.extractedData.adverse_event?.value,
          meddraCode: currentCase.extractedData.adverse_event?.meddra_pt,
          reporterType: currentCase.extractedData.reporter_type?.value || 'hcp',
          missingFields: currentCase.missingFields.filter(f => !f.available).map(f => f.label),
          riskLevel: currentCase.riskAnalysis?.level || 'medium'
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.questions) {
        setQuestions(data.questions);
        setReasoning(data.reasoning || '');
        toast.success(`Generated ${data.questions.length} context-aware questions`);
      }
    } catch (err) {
      console.error('Question generation failed:', err);
      toast.error('Failed to generate questions. Using fallback method.');
      // Fallback to static questions
      generateFallbackQuestions();
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback static question generation
  const generateFallbackQuestions = () => {
    const reporterType = currentCase?.extractedData?.reporter_type?.value || 'hcp';
    const missing = currentCase?.missingFields?.filter(f => !f.available) || [];
    
    const fallbackQuestions: FollowUpQuestion[] = missing.slice(0, 5).map((field, idx) => ({
      id: `q-${idx + 1}`,
      field: field.field,
      question: getDefaultQuestion(field.field, reporterType as 'hcp' | 'patient'),
      type: field.inputType || 'text',
      options: getDefaultOptions(field.field),
      required: field.priority === 'critical',
      hint: field.description
    }));
    
    setQuestions(fallbackQuestions);
  };

  const getDefaultQuestion = (field: string, reporterType: 'hcp' | 'patient'): string => {
    const questions: Record<string, { hcp: string; patient: string }> = {
      event_onset_date: {
        hcp: 'When did the patient first experience symptoms?',
        patient: 'When did you first notice symptoms?'
      },
      outcome: {
        hcp: "What is the patient's current condition?",
        patient: 'How are you feeling now?'
      },
      lot_number: {
        hcp: 'What is the lot/batch number of the medication?',
        patient: 'What is the lot/batch number on your medication package?'
      },
      dosage: {
        hcp: 'What was the dose and route of administration?',
        patient: 'What dose were you taking and how did you take it?'
      },
      dechallenge: {
        hcp: 'Was the medication stopped, and did symptoms improve?',
        patient: 'Did your symptoms improve after stopping the medication?'
      },
      rechallenge: {
        hcp: 'Was the medication restarted after stopping?',
        patient: 'Did you restart the medication after stopping?'
      },
      concomitant_medications: {
        hcp: 'What other medications was the patient taking?',
        patient: 'What other medications were you taking?'
      },
      medical_history: {
        hcp: 'What is the relevant medical history?',
        patient: 'Do you have any other medical conditions?'
      }
    };
    return questions[field]?.[reporterType] || `Please provide information about: ${field}`;
  };

  const getDefaultOptions = (field: string): string[] | undefined => {
    const optionsMap: Record<string, string[]> = {
      outcome: ['Recovered', 'Recovering', 'Not recovered', 'Recovered with sequelae', 'Fatal', 'Unknown'],
      dechallenge: ['Yes, symptoms improved', 'Yes, symptoms did not improve', 'Medication not stopped', 'Unknown'],
      rechallenge: ['Yes, symptoms recurred', 'Yes, symptoms did not recur', 'Not restarted', 'Unknown']
    };
    return optionsMap[field];
  };

  // Generate on mount
  useEffect(() => {
    if (currentCase?.missingFields && currentCase?.extractedData) {
      generateAIQuestions();
    }
  }, []);

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleProceed = () => {
    updateCaseQuestions(questions);
    navigate('/case/new/outreach');
  };

  const getTypeLabel = (type: FollowUpQuestion['type']) => {
    switch (type) {
      case 'date': return 'Date Picker';
      case 'select': return 'Single Choice';
      case 'multiselect': return 'Multiple Choice';
      case 'drug_search': return 'Drug Search';
      default: return 'Text Input';
    }
  };

  const getTypeColor = (type: FollowUpQuestion['type']) => {
    switch (type) {
      case 'date': return 'bg-info/10 text-info';
      case 'select': return 'bg-accent/10 text-accent';
      case 'multiselect': return 'bg-warning/10 text-warning';
      case 'drug_search': return 'bg-success/10 text-success';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  if (!currentCase?.missingFields) {
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

  const missingCount = currentCase.missingFields.filter(f => !f.available).length;

  // If no missing fields, show a different message
  if (missingCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-4xl">
          <ProgressTracker currentStatus="risk_classified" className="mb-8" />
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Follow-up Required</h2>
            <p className="text-muted-foreground mb-6">
              All required safety data has been extracted from the narrative.
            </p>
            <Button variant="hero" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
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
            <Sparkles className="h-4 w-4" />
            <span>Module 5</span>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
            <span className="text-foreground font-medium">Context-Aware Question Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Agentic Follow-up Form Builder</h1>
          <p className="text-muted-foreground">
            AI-generated clinical questions based on the specific drug-event pair
          </p>
        </div>

        {/* AI Selection Notice */}
        <div className="card-elevated p-4 mb-6 bg-gradient-to-r from-accent/10 to-transparent border-accent/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Gemini-Powered Clinical Probes</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Based on <strong>{currentCase.extractedData?.suspect_drug?.value || 'the drug'}</strong> + 
                <strong> {currentCase.extractedData?.adverse_event?.value || 'the event'}</strong>
                {currentCase.extractedData?.adverse_event?.meddra_pt && (
                  <span className="text-accent"> ({currentCase.extractedData.adverse_event.meddra_pt})</span>
                )}, 
                {isGenerating ? ' generating' : ` ${questions.length} targeted`} questions for the {currentCase.extractedData?.reporter_type?.value === 'hcp' ? 'healthcare professional' : 'patient'}.
              </p>
              {reasoning && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-accent/30 pl-2">
                  {reasoning}
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={generateAIQuestions}
              disabled={isGenerating}
            >
              <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          </div>
        </div>

        {/* Question List */}
        <div className="card-elevated overflow-hidden mb-6">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Follow-up Questions ({questions.length})</h2>
              <Button variant="ghost" size="sm" disabled>
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-muted-foreground">Generating context-aware clinical questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions could be generated for the missing fields.</p>
              <Button variant="outline" className="mt-4" onClick={generateFallbackQuestions}>
                Generate Default Questions
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {questions.map((question, index) => (
                <div 
                  key={question.id}
                  className="p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground mb-2">{question.question}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          getTypeColor(question.type)
                        )}>
                          {getTypeLabel(question.type)}
                        </span>
                        {question.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-risk-high/10 text-risk-high">
                            Required
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {question.field}
                        </span>
                        {question.clinicalRationale && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground cursor-help">
                                <Info className="h-3 w-3 mr-1" />
                                Why?
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{question.clinicalRationale}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {question.options && (
                        <div className="mt-3 pl-3 border-l-2 border-border">
                          <p className="text-xs text-muted-foreground mb-1">Options:</p>
                          <div className="flex flex-wrap gap-1">
                            {question.options.map((opt) => (
                              <span key={opt} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Summary */}
        <div className="card-elevated p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">Form Preview Summary</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-bold text-accent">{questions.length}</p>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-bold text-foreground">~{Math.max(2, questions.length)} min</p>
              <p className="text-sm text-muted-foreground">Est. Completion</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex justify-center mb-1">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Smart Input Types</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button 
            variant="hero" 
            onClick={handleProceed}
            disabled={questions.length === 0 || isGenerating}
          >
            Preview Outreach Message
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
