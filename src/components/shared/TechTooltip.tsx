import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface TechTooltipProps {
  term: 'meddra_pt' | 'e2b_r3' | 'inference_latency' | 'model_precision' | 'first_touch';
  className?: string;
}

const TECH_DEFINITIONS: Record<TechTooltipProps['term'], { title: string; description: string }> = {
  meddra_pt: {
    title: 'MedDRA PT',
    description: 'Medical Dictionary for Regulatory Activities – Preferred Term. The standardized term used globally to code adverse events for regulatory reporting.',
  },
  e2b_r3: {
    title: 'ICH E2B(R3)',
    description: 'International Council for Harmonisation Electronic Transmission of Individual Case Safety Reports. The global standard format for exchanging pharmacovigilance data between regulatory authorities.',
  },
  inference_latency: {
    title: 'Inference Latency',
    description: 'The time taken by the AI model to process input data and return extracted results. Measured from case creation to extraction completion.',
  },
  model_precision: {
    title: 'Model Precision',
    description: 'The percentage of cases where the AI successfully extracted and coded the adverse event with a valid MedDRA Preferred Term.',
  },
  first_touch: {
    title: 'First-Touch Success',
    description: 'The percentage of cases resolved with complete data on the first extraction attempt, without requiring follow-up outreach to reporters.',
  },
};

export function TechTooltip({ term, className }: TechTooltipProps) {
  const definition = TECH_DEFINITIONS[term];
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className={`inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors ${className || ''}`}
            aria-label={`Info about ${definition.title}`}
          >
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-popover border border-border shadow-lg"
        >
          <p className="font-semibold text-foreground text-sm mb-1">{definition.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{definition.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
