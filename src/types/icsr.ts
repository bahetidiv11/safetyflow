export type RiskLevel = 'high' | 'medium' | 'low';
export type ReporterType = 'patient' | 'hcp';
export type CaseStatus = 'intake' | 'risk_classified' | 'followup_sent' | 'response_received' | 'closed';
export type ContactChannel = 'email' | 'whatsapp' | 'portal';

export interface ICSRCase {
  id: string;
  caseNumber: string;
  narrativeText: string;
  suspectDrug: string;
  adverseEvent: string;
  seriousnessIndicators: string[];
  reporterType: ReporterType;
  riskLevel: RiskLevel;
  riskScore: number;
  status: CaseStatus;
  createdAt: Date;
  updatedAt: Date;
  extractedData?: ExtractedData;
  consentStatus?: ConsentStatus;
  missingFields?: MissingField[];
  followUpQuestions?: FollowUpQuestion[];
}

export interface ExtractedData {
  suspectDrug: {
    value: string;
    confidence: number;
  };
  adverseEvent: {
    value: string;
    confidence: number;
  };
  seriousness: {
    indicators: string[];
    confidence: number;
  };
  reporterType: {
    value: ReporterType;
    confidence: number;
  };
  patientAge?: {
    value: string;
    confidence: number;
  };
  eventDate?: {
    value: string;
    confidence: number;
  };
}

export interface ConsentStatus {
  recontactAllowed: boolean;
  allowedChannels: ContactChannel[];
  preferredChannel?: ContactChannel;
  lastContactDate?: Date;
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
  question: string;
  type: 'text' | 'select' | 'date' | 'multiselect';
  options?: string[];
  required: boolean;
  forReporterType: ReporterType[];
  forRiskLevel: RiskLevel[];
}

export interface RiskBreakdown {
  seriousnessScore: number;
  noveltyScore: number;
  drugProfileScore: number;
  dataCompletenessScore: number;
  totalScore: number;
  factors: string[];
}

export interface DashboardMetrics {
  totalCases: number;
  highRiskCases: number;
  pendingFollowups: number;
  firstTouchSuccess: number;
  averageResponseTime: string;
  reducedFU2Cases: number;
}
