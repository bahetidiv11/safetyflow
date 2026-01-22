export type RiskLevel = 'high' | 'medium' | 'low';
export type ReporterType = 'patient' | 'hcp';
export type CaseStatus = 'intake' | 'risk_classified' | 'followup_sent' | 'response_received' | 'ready_for_review' | 'closed';
export type ContactChannel = 'email' | 'whatsapp' | 'portal';
export type QuestionInputType = 'text' | 'select' | 'date' | 'multiselect' | 'drug_search';

// DB row shape for the external "cases" table (kept flexible to match different schemas)
export interface CaseRow {
  id: string | number;
  created_at?: string;
  extraction_completed_at?: string | null;
  completed_at?: string | null;

  // Core PV fields (expected)
  narrative?: string | null;
  suspect_drug?: string | null;
  adverse_event?: string | null;
  meddra_pt?: string | null;
  reporter_type?: string | null;
  status?: string | null;
  risk_score?: string | null; // 'High' | 'Medium' | 'Low' (string per user spec)

  // Optional: store raw AI output or other columns without breaking the app
  [key: string]: unknown;
}

export interface ExtractedField {
  value: string | null;
  confidence: number;
  found: boolean;
  meddra_pt?: string;
  meddra_soc?: string;
}

export interface AIExtractedData {
  suspect_drug: ExtractedField & { dose?: string; route?: string };
  adverse_event: ExtractedField & { meddra_pt?: string; meddra_soc?: string };
  severity: ExtractedField;
  seriousness_criteria?: string[];
  seriousness_indicators: string[];
  reporter_type: ExtractedField & { qualification?: string };
  patient_demographics: ExtractedField & { age?: string; sex?: string; weight?: string };
  event_onset_date: ExtractedField;
  lot_number: ExtractedField;
  dosage: ExtractedField & { dose?: string; frequency?: string; route?: string };
  dechallenge: ExtractedField;
  rechallenge: ExtractedField;
  outcome: ExtractedField;
  concomitant_medications: ExtractedField;
  medical_history: ExtractedField;
  causality_assessment?: ExtractedField;
  action_taken?: ExtractedField;
}

export interface MissingField {
  field: string;
  label: string;
  priority: 'critical' | 'important' | 'optional';
  description: string;
  available: boolean;
  inputType?: QuestionInputType;
  meddraCode?: string;
}

export interface FollowUpQuestion {
  id: string;
  field: string;
  question: string;
  type: QuestionInputType;
  options?: string[];
  required: boolean;
  hint?: string;
  clinicalRationale?: string;
}

export interface RiskAnalysis {
  level: RiskLevel;
  score: number;
  seriousnessScore: number;
  noveltyScore: number;
  drugProfileScore: number;
  dataCompletenessScore: number;
  factors: string[];
  seriousnessCriteria?: string[];
  isE2BR3Compliant?: boolean;
}

export interface ConsentStatus {
  recontactAllowed: boolean;
  allowedChannels: ContactChannel[];
  preferredChannel?: ContactChannel;
  reporterDetails?: {
    type: ReporterType;
    role?: string;
    institution?: string;
    email?: string;
  };
}

export interface ReporterResponse {
  questionId: string;
  field: string;
  answer: string | string[];
  answeredAt: Date;
}

export interface OutreachMessage {
  subject: string;
  greeting: string;
  body: string;
  context_box?: string;
  cta_text: string;
  closing: string;
  estimated_time?: string;
}

export interface ICSRCase {
  id: string;
  caseNumber: string;
  narrativeText: string;
  extractedData: AIExtractedData | null;
  missingFields: MissingField[];
  riskAnalysis: RiskAnalysis | null;
  consentStatus: ConsentStatus | null;
  followUpQuestions: FollowUpQuestion[];
  reporterResponses?: ReporterResponse[];
  outreachMessage?: OutreachMessage;
  status: CaseStatus;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  respondedAt?: Date;
}

export interface DashboardMetrics {
  totalCases: number;
  highRiskCases: number;
  pendingFollowups: number;
  firstTouchSuccess: number;
  averageResponseTime: string;
  reducedFU2Cases: number;
}

// Timeline step for impact visualization
export interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: Date;
}

// Legacy type for backwards compatibility - will be removed
export interface ExtractedData {
  suspectDrug: { value: string; confidence: number };
  adverseEvent: { value: string; confidence: number };
  seriousness: { indicators: string[]; confidence: number };
  reporterType: { value: ReporterType; confidence: number };
  patientAge?: { value: string; confidence: number };
  eventDate?: { value: string; confidence: number };
}

export interface RiskBreakdown {
  seriousnessScore: number;
  noveltyScore: number;
  drugProfileScore: number;
  dataCompletenessScore: number;
  totalScore: number;
  factors: string[];
}
