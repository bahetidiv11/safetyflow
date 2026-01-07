import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  GripVertical,
  ArrowRight,
  ChevronDown,
  Trash2,
  Plus,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { ProgressTracker } from '@/components/shared/ProgressTracker';
import { FollowUpQuestion } from '@/types/icsr';
import { cn } from '@/lib/utils';

const aiGeneratedQuestions: FollowUpQuestion[] = [
  {
    id: '1',
    question: 'When did the patient first notice symptoms of liver problems (fatigue, jaundice, abdominal pain)?',
    type: 'date',
    required: true,
    forReporterType: ['hcp', 'patient'],
    forRiskLevel: ['high', 'medium'],
  },
  {
    id: '2',
    question: 'What is the current status of the patient\'s liver function?',
    type: 'select',
    options: ['Recovering', 'Stable', 'Worsening', 'Resolved completely', 'Unknown'],
    required: true,
    forReporterType: ['hcp'],
    forRiskLevel: ['high'],
  },
  {
    id: '3',
    question: 'Has pembrolizumab been permanently discontinued?',
    type: 'select',
    options: ['Yes, permanently discontinued', 'Temporarily held', 'Restarted at lower dose', 'Treatment ongoing'],
    required: true,
    forReporterType: ['hcp'],
    forRiskLevel: ['high', 'medium'],
  },
  {
    id: '4',
    question: 'What treatment was given for the hepatotoxicity? (Select all that apply)',
    type: 'multiselect',
    options: ['IV Corticosteroids', 'Oral Corticosteroids', 'Mycophenolate', 'Supportive care only', 'Other immunosuppression'],
    required: false,
    forReporterType: ['hcp'],
    forRiskLevel: ['high'],
  },
];

export default function QuestionBuilder() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<FollowUpQuestion[]>(aiGeneratedQuestions);

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const getTypeLabel = (type: FollowUpQuestion['type']) => {
    switch (type) {
      case 'date': return 'Date';
      case 'select': return 'Single Choice';
      case 'multiselect': return 'Multiple Choice';
      default: return 'Text';
    }
  };

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
              <h3 className="font-semibold text-foreground mb-1">AI-Selected Questions</h3>
              <p className="text-sm text-muted-foreground">
                Based on this high-risk case with a healthcare professional reporter, {questions.length} targeted questions have been selected from the approved question library. You can reorder or remove questions as needed.
              </p>
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="card-elevated overflow-hidden mb-6">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Follow-up Questions ({questions.length})</h2>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
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
                        For HCP
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
              <p className="text-3xl font-bold text-foreground">~3 min</p>
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
          <Button variant="hero" onClick={() => navigate('/case/new/outreach')}>
            Preview Outreach Message
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
