import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
  ICSRCase, 
  DashboardMetrics, 
  AIExtractedData, 
  MissingField, 
  RiskAnalysis,
  ConsentStatus,
  FollowUpQuestion,
  RiskLevel
} from '../types/icsr';

export type UserRole = 'pv_analyst' | 'reporter' | null;

interface AppState {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  currentCase: ICSRCase | null;
  setCurrentCase: (caseData: ICSRCase | null) => void;
  cases: ICSRCase[];
  setCases: (cases: ICSRCase[]) => void;
  metrics: DashboardMetrics;
  
  // Dynamic state update functions
  updateCaseNarrative: (narrative: string) => void;
  updateCaseExtraction: (extractedData: AIExtractedData, missingFields: MissingField[]) => void;
  updateCaseRiskAnalysis: (riskAnalysis: RiskAnalysis) => void;
  updateCaseConsent: (consentStatus: ConsentStatus) => void;
  updateCaseQuestions: (questions: FollowUpQuestion[]) => void;
  updateCaseStatus: (status: ICSRCase['status']) => void;
  resetCurrentCase: () => void;
  initializeNewCase: (narrative: string) => void;
}

const defaultMetrics: DashboardMetrics = {
  totalCases: 47,
  highRiskCases: 8,
  pendingFollowups: 12,
  firstTouchSuccess: 78,
  averageResponseTime: '2.3 days',
  reducedFU2Cases: 34,
};

const AppContext = createContext<AppState | undefined>(undefined);

// Helper function to calculate risk from extracted data
export function calculateRisk(extractedData: AIExtractedData, missingFields: MissingField[]): RiskAnalysis {
  const severity = extractedData.severity?.value?.toLowerCase() || '';
  
  // Calculate seriousness score based on severity
  let seriousnessScore = 40;
  if (severity === 'fatal') seriousnessScore = 100;
  else if (severity === 'life-threatening') seriousnessScore = 95;
  else if (severity === 'hospitalization') seriousnessScore = 80;
  else if (severity === 'disability') seriousnessScore = 70;
  else if (severity === 'other serious') seriousnessScore = 60;
  else if (severity === 'non-serious') seriousnessScore = 30;

  // Calculate data completeness score
  const totalFields = missingFields.length;
  const availableFields = missingFields.filter(f => f.available).length;
  const dataCompletenessScore = Math.round((availableFields / totalFields) * 100);

  // Drug profile score (simulated based on drug type keywords)
  const drugValue = extractedData.suspect_drug?.value?.toLowerCase() || '';
  let drugProfileScore = 50;
  if (drugValue.includes('immunotherapy') || drugValue.includes('pembrolizumab') || 
      drugValue.includes('nivolumab') || drugValue.includes('checkpoint')) {
    drugProfileScore = 85;
  } else if (drugValue.includes('chemotherapy') || drugValue.includes('biologic')) {
    drugProfileScore = 75;
  }

  // Novelty score (simulated)
  const noveltyScore = 65 + Math.floor(Math.random() * 20);

  // Calculate total score
  const totalScore = Math.round(
    (seriousnessScore * 0.4) + 
    (drugProfileScore * 0.25) + 
    (noveltyScore * 0.2) + 
    ((100 - dataCompletenessScore) * 0.15) // Lower completeness = higher risk
  );

  // Determine risk level
  let level: RiskLevel = 'low';
  if (totalScore >= 80 || severity === 'fatal' || severity === 'life-threatening') {
    level = 'high';
  } else if (totalScore >= 50) {
    level = 'medium';
  }

  // Generate risk factors
  const factors: string[] = [];
  if (severity === 'fatal' || severity === 'life-threatening') {
    factors.push(`${severity.charAt(0).toUpperCase() + severity.slice(1)} adverse event`);
  }
  if (extractedData.seriousness_indicators?.length > 0) {
    factors.push(...extractedData.seriousness_indicators.slice(0, 2));
  }
  if (drugProfileScore >= 75) {
    factors.push('High-risk drug class profile');
  }
  if (dataCompletenessScore < 70) {
    factors.push('Incomplete safety data requiring follow-up');
  }
  const criticalMissing = missingFields.filter(f => !f.available && f.priority === 'critical');
  if (criticalMissing.length > 0) {
    factors.push(`${criticalMissing.length} critical data points missing`);
  }

  return {
    level,
    score: totalScore,
    seriousnessScore,
    noveltyScore,
    drugProfileScore,
    dataCompletenessScore,
    factors: factors.slice(0, 5)
  };
}

// Generate follow-up questions based on missing fields
export function generateFollowUpQuestions(
  missingFields: MissingField[], 
  riskLevel: RiskLevel,
  reporterType: 'hcp' | 'patient'
): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [];
  const missing = missingFields.filter(f => !f.available);
  
  // Prioritize critical fields first, then important
  const prioritized = [
    ...missing.filter(f => f.priority === 'critical'),
    ...missing.filter(f => f.priority === 'important'),
    ...missing.filter(f => f.priority === 'optional')
  ].slice(0, 5); // Max 5 questions

  prioritized.forEach((field, index) => {
    const question = getQuestionForField(field, reporterType);
    if (question) {
      questions.push({
        ...question,
        id: `q-${index + 1}`
      });
    }
  });

  return questions;
}

function getQuestionForField(field: MissingField, reporterType: 'hcp' | 'patient'): Omit<FollowUpQuestion, 'id'> | null {
  const questionMap: Record<string, Omit<FollowUpQuestion, 'id'>> = {
    event_onset_date: {
      field: 'event_onset_date',
      question: reporterType === 'hcp' 
        ? 'When did the patient first experience symptoms?' 
        : 'When did you first notice symptoms?',
      type: 'date',
      required: true,
      hint: 'Approximate date is acceptable if exact date is unknown'
    },
    outcome: {
      field: 'outcome',
      question: reporterType === 'hcp'
        ? "What is the patient's current condition?"
        : 'How are you feeling now?',
      type: 'select',
      options: ['Recovered', 'Recovering', 'Not recovered', 'Recovered with sequelae', 'Fatal', 'Unknown'],
      required: true
    },
    lot_number: {
      field: 'lot_number',
      question: 'What is the lot/batch number of the medication?',
      type: 'text',
      required: field.priority === 'critical',
      hint: 'Found on medication packaging or pharmacy records'
    },
    dosage: {
      field: 'dosage',
      question: 'What was the dose and how was the medication administered?',
      type: 'text',
      required: field.priority === 'critical',
      hint: 'e.g., 200mg IV every 3 weeks'
    },
    dechallenge: {
      field: 'dechallenge',
      question: 'Was the medication stopped, and if so, did symptoms improve?',
      type: 'select',
      options: ['Yes, stopped and symptoms improved', 'Yes, stopped but symptoms did not improve', 'Medication not stopped', 'Unknown'],
      required: true
    },
    rechallenge: {
      field: 'rechallenge',
      question: 'Was the medication restarted after stopping?',
      type: 'select',
      options: ['Yes, restarted with recurrence of symptoms', 'Yes, restarted without recurrence', 'Not restarted', 'Unknown'],
      required: false
    },
    concomitant_medications: {
      field: 'concomitant_medications',
      question: reporterType === 'hcp'
        ? 'What other medications was the patient taking?'
        : 'What other medications were you taking?',
      type: 'text',
      required: false,
      hint: 'List all prescription and over-the-counter medications'
    },
    medical_history: {
      field: 'medical_history',
      question: reporterType === 'hcp'
        ? 'What is the relevant medical history?'
        : 'Do you have any other medical conditions?',
      type: 'text',
      required: false
    }
  };

  return questionMap[field.field] || null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCase, setCurrentCase] = useState<ICSRCase | null>(null);
  const [cases, setCases] = useState<ICSRCase[]>([]);
  const [metrics] = useState<DashboardMetrics>(defaultMetrics);

  const initializeNewCase = useCallback((narrative: string) => {
    const newCase: ICSRCase = {
      id: 'case-' + Date.now(),
      caseNumber: `ICSR-2024-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
      narrativeText: narrative,
      extractedData: null,
      missingFields: [],
      riskAnalysis: null,
      consentStatus: null,
      followUpQuestions: [],
      status: 'intake',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentCase(newCase);
  }, []);

  const updateCaseNarrative = useCallback((narrative: string) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      narrativeText: narrative,
      extractedData: null,
      missingFields: [],
      riskAnalysis: null,
      followUpQuestions: [],
      updatedAt: new Date()
    } : null);
  }, []);

  const updateCaseExtraction = useCallback((extractedData: AIExtractedData, missingFields: MissingField[]) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      extractedData,
      missingFields,
      updatedAt: new Date()
    } : null);
  }, []);

  const updateCaseRiskAnalysis = useCallback((riskAnalysis: RiskAnalysis) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      riskAnalysis,
      status: 'risk_classified',
      updatedAt: new Date()
    } : null);
  }, []);

  const updateCaseConsent = useCallback((consentStatus: ConsentStatus) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      consentStatus,
      updatedAt: new Date()
    } : null);
  }, []);

  const updateCaseQuestions = useCallback((questions: FollowUpQuestion[]) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      followUpQuestions: questions,
      updatedAt: new Date()
    } : null);
  }, []);

  const updateCaseStatus = useCallback((status: ICSRCase['status']) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      status,
      updatedAt: new Date()
    } : null);
  }, []);

  const resetCurrentCase = useCallback(() => {
    setCurrentCase(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        isAuthenticated,
        setIsAuthenticated,
        currentCase,
        setCurrentCase,
        cases,
        setCases,
        metrics,
        updateCaseNarrative,
        updateCaseExtraction,
        updateCaseRiskAnalysis,
        updateCaseConsent,
        updateCaseQuestions,
        updateCaseStatus,
        resetCurrentCase,
        initializeNewCase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
