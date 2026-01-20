import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield,
  ArrowRight,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Header } from '../components/layout/Header';
import { cn } from '../lib/utils';
import { useApp } from '../contexts/AppContext';
import { FollowUpQuestion } from '../types/icsr';

export default function ReporterForm() {
  const navigate = useNavigate();
  const { currentCase, updateCaseStatus } = useApp();
  
  // Use dynamic questions from case state
  const formQuestions = currentCase?.followUpQuestions || [];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = formQuestions[currentStep];
  const progress = formQuestions.length > 0 ? ((currentStep + 1) / formQuestions.length) * 100 : 0;

  const handleAnswer = (value: string | string[]) => {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const handleNext = () => {
    if (currentStep < formQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    updateCaseStatus('response_received');
  };

  const isAnswered = currentQuestion && answers[currentQuestion.id] !== undefined && 
    (Array.isArray(answers[currentQuestion.id]) 
      ? (answers[currentQuestion.id] as string[]).length > 0 
      : answers[currentQuestion.id] !== '');

  // If no questions, show completion message
  if (formQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-lg">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <CheckCircle className="h-16 w-16 text-success mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Questions Required</h2>
            <p className="text-muted-foreground mb-6">
              There are no follow-up questions for this case.
            </p>
            <Button variant="outline" onClick={() => navigate('/reporter/inbox')}>
              Return to Inbox
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8 max-w-lg">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-slide-up">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thank You!</h1>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your response has been submitted successfully. This information will help ensure patient safety.
            </p>
            <div className="card-elevated p-4 mb-8 w-full text-left">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground text-sm">Data Received Securely</p>
                  <p className="text-xs text-muted-foreground">
                    Case: {currentCase?.caseNumber || 'Unknown'} · Confirmation: FU-{Date.now().toString(36).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/reporter/inbox')}>
              Return to Inbox
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-lg">
        {/* Case Reference */}
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            Case Reference: <span className="font-medium text-foreground">{currentCase?.caseNumber || 'Unknown'}</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {formQuestions.length}
            </span>
            <span className="text-sm font-medium text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-accent" />
          <span>Your response is encrypted and secure</span>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="card-elevated p-6 mb-6 animate-fade-in" key={currentQuestion.id}>
            <div className="flex items-start justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {currentQuestion.question}
              </h2>
              {currentQuestion.required && (
                <span className="shrink-0 text-xs text-risk-high">Required</span>
              )}
            </div>

            {currentQuestion.hint && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 mb-4">
                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{currentQuestion.hint}</span>
              </div>
            )}

            {/* Answer Input */}
            {currentQuestion.type === 'date' && (
              <Input
                type="date"
                value={answers[currentQuestion.id] as string || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full"
              />
            )}

            {currentQuestion.type === 'text' && (
              <Input
                type="text"
                placeholder="Enter your response..."
                value={answers[currentQuestion.id] as string || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full"
              />
            )}

            {currentQuestion.type === 'select' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      'w-full p-4 text-left rounded-lg border-2 transition-all',
                      answers[currentQuestion.id] === option
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    )}
                  >
                    <span className="font-medium text-foreground">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiselect' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option) => {
                  const selected = (answers[currentQuestion.id] as string[] || []).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        const current = (answers[currentQuestion.id] as string[]) || [];
                        if (selected) {
                          handleAnswer(current.filter(o => o !== option));
                        } else {
                          handleAnswer([...current, option]);
                        }
                      }}
                      className={cn(
                        'w-full p-4 text-left rounded-lg border-2 transition-all flex items-center gap-3',
                        selected
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      )}
                    >
                      <div className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border-2',
                        selected ? 'border-accent bg-accent' : 'border-muted-foreground'
                      )}>
                        {selected && <CheckCircle className="h-3 w-3 text-accent-foreground" />}
                      </div>
                      <span className="font-medium text-foreground">{option}</span>
                    </button>
                  );
                })}
                <p className="text-xs text-muted-foreground mt-2">Select all that apply</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          <Button 
            variant="hero" 
            onClick={handleNext}
            disabled={currentQuestion?.required && !isAnswered}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                Submitting...
              </>
            ) : currentStep === formQuestions.length - 1 ? (
              <>
                Submit Response
                <CheckCircle className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
