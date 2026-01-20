export type RiskLevel = 'high' | 'medium' | 'low';
export type ReporterType = 'patient' | 'hcp';
export type CaseStatus = 'intake' | 'risk_classified' | 'followup_sent' | 'response_received' | 'closed';
export type ContactChannel = 'email' | 'whatsapp' | 'portal';

export interface ExtractedField {
  value: string | null;
  confidence: number;
  found: boolean;
}

export interface AIExtractedData {
  suspect_drug: ExtractedField;
  adverse_event: ExtractedField;
  severity: ExtractedField;
  seriousness_indicators: string[];
  reporter_type: ExtractedField;
  patient_demographics: ExtractedField;
  event_onset_date: ExtractedField;
  lot_number: ExtractedField;
  dosage: ExtractedField;
  dechallenge: ExtractedField;
  rechallenge: ExtractedField;
  outcome: ExtractedField;
  concomitant_medications: ExtractedField;
  medical_history: ExtractedField;
}

export interface MissingField {
  field: string;
  label: string;
  priority: 'critical' | 'important' | 'optional';
  description: string;
  available: boolean;
}

export interface FollowUpQuestion {
  id: string;
  field: string;
  question: string;
  type: 'text' | 'select' | 'date' | 'multiselect';
  options?: string[];
  required: boolean;
  hint?: string;
}

export interface RiskAnalysis {
  level: RiskLevel;
  score: number;
  seriousnessScore: number;
  noveltyScore: number;
  drugProfileScore: number;
  dataCompletenessScore: number;
  factors: string[];
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

export interface ICSRCase {
  id: string;
  caseNumber: string;
  narrativeText: string;
  extractedData: AIExtractedData | null;
  missingFields: MissingField[];
  riskAnalysis: RiskAnalysis | null;
  consentStatus: ConsentStatus | null;
  followUpQuestions: FollowUpQuestion[];
  status: CaseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetrics {
  totalCases: number;
  highRiskCases: number;
  pendingFollowups: number;
  firstTouchSuccess: number;
  averageResponseTime: string;
  reducedFU2Cases: number;
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
