import { cn } from '@/lib/utils';
import { Code2, X } from 'lucide-react';
import { Button } from '../ui/button';

interface LogicViewOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const HYBRID_LOGIC_PSEUDOCODE = `/**
 * HYBRID QUESTION SELECTION ALGORITHM
 * 
 * This pseudocode describes the decision logic for selecting
 * follow-up questions from either:
 * 1. Enterprise Pre-Approved Database (regulatory-compliant)
 * 2. Gemini AI (context-aware clinical probes)
 */

function selectQuestionSource(
  useEnterpriseMapping: boolean,
  missingFields: Field[],
  enterpriseQuestionMap: Map<string, Question[]>
): Question[] {
  
  if (useEnterpriseMapping) {
    // ENTERPRISE PATH: Pull from pre-approved regulatory database
    const enterpriseQuestions: Question[] = [];
    
    for (const field of missingFields) {
      if (!field.available) {
        // O(1) lookup in enterprise mapping
        const mappedQuestions = enterpriseQuestionMap.get(field.name);
        
        if (mappedQuestions && mappedQuestions.length > 0) {
          enterpriseQuestions.push(...mappedQuestions.map(q => ({
            ...q,
            source: 'ENTERPRISE_DB',
            approvalCode: q.regulatoryApprovalId,
            hint: 'Pre-approved regulatory question from Enterprise DB'
          })));
        }
      }
    }
    
    return enterpriseQuestions;
    
  } else {
    // AI PATH: Generate context-aware clinical probes via Gemini
    const aiRequest = {
      model: 'google/gemini-3-flash-preview',
      drugName: currentCase.extractedData.suspect_drug,
      adverseEvent: currentCase.extractedData.adverse_event,
      meddraCode: currentCase.extractedData.meddra_pt,
      reporterType: currentCase.reporterType,
      missingFields: missingFields.filter(f => !f.available),
      riskLevel: currentCase.riskAnalysis.level
    };
    
    const aiQuestions = await invokeGemini(aiRequest);
    
    return aiQuestions.map(q => ({
      ...q,
      source: 'GEMINI_AI',
      clinicalRationale: q.reasoning
    }));
  }
}

// ENTERPRISE_QUESTION_MAP structure:
const ENTERPRISE_QUESTION_MAP = {
  'dosage': [{
    question: 'Please provide the exact dose, frequency, and route...',
    field: 'dosage',
    type: 'text',
    required: true,
    regulatoryApprovalId: 'REG-2024-001'
  }],
  'dechallenge': [{
    question: 'Was the suspect product discontinued? If so...',
    field: 'dechallenge',
    type: 'select',
    options: ['Yes - symptoms improved', 'Yes - no change', ...],
    required: true,
    regulatoryApprovalId: 'REG-2024-002'
  }],
  // ... additional field mappings
};

/**
 * DECISION TREE:
 * 
 *    [Start]
 *        │
 *        ▼
 *   ┌─────────────────┐
 *   │ Enterprise Mode │
 *   │   Enabled?      │
 *   └────────┬────────┘
 *            │
 *      ┌─────┴─────┐
 *      │           │
 *      ▼ YES       ▼ NO
 * ┌─────────┐  ┌─────────┐
 * │ Query   │  │ Invoke  │
 * │ SQL DB  │  │ Gemini  │
 * │ Mapping │  │ API     │
 * └────┬────┘  └────┬────┘
 *      │            │
 *      ▼            ▼
 * [Pre-Approved] [AI-Generated]
 * [Questions  ]  [Clinical    ]
 *                [Probes      ]
 */`;

export function LogicViewOverlay({ isOpen, onClose, className }: LogicViewOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto",
      className
    )}>
      <div className="container max-w-4xl py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Code2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Algorithm Logic View</h2>
              <p className="text-sm text-muted-foreground">Hybrid Question Selection Engine</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent">
              TypeScript / Pseudocode
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-warning/10 text-warning">
              Decision Logic
            </span>
          </div>
          
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[70vh] font-mono whitespace-pre text-foreground">
            {HYBRID_LOGIC_PSEUDOCODE}
          </pre>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-info/5 border border-info/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> When "Enterprise DB Mapping" is enabled, 
            the system bypasses AI generation and directly queries a pre-approved regulatory question database. 
            This ensures 100% compliance with corporate standards while maintaining rapid response times.
          </p>
        </div>
      </div>
    </div>
  );
}
