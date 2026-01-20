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
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/layout/Header';
import { ProgressTracker } from '../components/shared/ProgressTracker';
import { FollowUpQuestion } from '../types/icsr';
import { cn } from '../lib/utils';
import { useApp, generateFollowUpQuestions } from '../contexts/AppContext';

export default function QuestionBuilder() {
  const navigate = useNavigate();
  const { currentCase, updateCaseQuestions } = useApp();
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);

  // Generate questions dynamically based on missing fields
  useEffect(() => {
    if (currentCase?.missingFields && currentCase?.riskAnalysis) {
      const reporterType = currentCase.extractedData?.reporter_type?.value || 'hcp';
      const generatedQuestions = generateFollowUpQuestions(
        currentCase.missingFields,
        currentCase.riskAnalysis.level,
        reporterType as 'hcp' | 'patient'
      );
      setQuestions(generatedQuestions);
    }
  }, [currentCase]);

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleProceed = () => {
    updateCaseQuestions(questions);
    navigate('/case/new/outreach');
  };

  const getTypeLabel = (type: FollowUpQuestion['type']) => {
    switch (type) {
      case 'date': return 'Date';
      case 'select': return 'Single Choice';
      case 'multiselect': return 'Multiple Choice';
      default: return 'Text';
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
            <span className="text-foreground font-medium">Question Mapping</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">AI-Assisted Follow-up Form</h1>
          <p className="text-muted-foreground">
            Personalised questions selected based on risk level, reporter type, and missing data
          </p>
        </div>

        {/* AI Selection Notice */}
        <div className="card-elevated p-4 mb-6 bg-gradient-to-r from-accent/10 to-transparent border-accent/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Dynamically Generated Questions</h3>
              <p className="text-sm text-muted-foreground">
                Based on this {currentCase.riskAnalysis?.level || 'high'}-risk case with a {currentCase.extractedData?.reporter_type?.value === 'hcp' ? 'healthcare professional' : 'patient'} reporter, {questions.length} targeted questions have been generated from the {missingCount} missing data fields. You can reorder or remove questions as needed.
              </p>
            </div>
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
          {questions.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions could be generated for the missing fields.</p>
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                          {getTypeLabel(question.type)}
                        </span>
                        {question.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-risk-high/10 text-risk-high">
                            Required
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">
                          {question.field}
                        </span>
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
              <p className="text-sm text-muted-foreground">Mobile Optimized</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/case/new/missing')}>
            Back
          </Button>
          <Button 
            variant="hero" 
            onClick={handleProceed}
            disabled={questions.length === 0}
          >
            Preview Outreach Message
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
