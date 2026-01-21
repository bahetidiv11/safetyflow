import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
  ICSRCase, 
  DashboardMetrics, 
  AIExtractedData, 
  MissingField, 
  RiskAnalysis,
  ConsentStatus,
  FollowUpQuestion,
  RiskLevel,
  ReporterResponse,
  OutreachMessage
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
  updateCaseOutreach: (outreach: OutreachMessage) => void;
  updateCaseStatus: (status: ICSRCase['status']) => void;
  updateReporterResponses: (responses: ReporterResponse[]) => void;
  mergeReporterData: (responses: ReporterResponse[]) => void;
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

// ICH E2B(R3) aligned risk calculation
export function calculateRisk(extractedData: AIExtractedData, missingFields: MissingField[], seriousnessCriteria?: string[]): RiskAnalysis {
  const severity = extractedData.severity?.value?.toLowerCase() || '';
  const criteria = seriousnessCriteria || extractedData.seriousness_criteria || [];
  
  // ICH E2B(R3) seriousness criteria check
  const hasFatal = criteria.includes('fatal') || severity === 'fatal';
  const hasLifeThreatening = criteria.includes('life_threatening') || severity === 'life-threatening';
  const hasHospitalization = criteria.includes('hospitalization') || severity === 'hospitalization';
  const hasDisability = criteria.includes('disability') || severity === 'disability';
  const hasCongenitalAnomaly = criteria.includes('congenital_anomaly') || severity === 'congenital anomaly';
  const hasMedicallySignificant = criteria.includes('medically_significant') || severity === 'medically significant';
  
  // Calculate seriousness score based on ICH E2B(R3)
  let seriousnessScore = 30;
  if (hasFatal) seriousnessScore = 100;
  else if (hasLifeThreatening) seriousnessScore = 95;
  else if (hasHospitalization) seriousnessScore = 80;
  else if (hasDisability) seriousnessScore = 75;
  else if (hasCongenitalAnomaly) seriousnessScore = 85;
  else if (hasMedicallySignificant) seriousnessScore = 70;
  else if (severity === 'other serious') seriousnessScore = 60;
  else if (severity === 'non-serious') seriousnessScore = 30;

  // Calculate data completeness score
  const totalFields = missingFields.length;
  const availableFields = missingFields.filter(f => f.available).length;
  const dataCompletenessScore = totalFields > 0 ? Math.round((availableFields / totalFields) * 100) : 50;

  // Drug profile score (based on drug class keywords)
  const drugValue = extractedData.suspect_drug?.value?.toLowerCase() || '';
  let drugProfileScore = 50;
  if (drugValue.includes('immunotherapy') || drugValue.includes('pembrolizumab') || 
      drugValue.includes('nivolumab') || drugValue.includes('checkpoint') ||
      drugValue.includes('car-t') || drugValue.includes('gene therapy')) {
    drugProfileScore = 90;
  } else if (drugValue.includes('chemotherapy') || drugValue.includes('biologic') ||
             drugValue.includes('monoclonal')) {
    drugProfileScore = 75;
  } else if (drugValue.includes('anticoagulant') || drugValue.includes('insulin')) {
    drugProfileScore = 65;
  }

  // Novelty score (based on event characteristics)
  const eventValue = extractedData.adverse_event?.value?.toLowerCase() || '';
  let noveltyScore = 50;
  if (eventValue.includes('unexpected') || eventValue.includes('rare') || 
      eventValue.includes('novel') || eventValue.includes('first report')) {
    noveltyScore = 85;
  } else if (extractedData.adverse_event?.meddra_pt) {
    noveltyScore = 60; // Known event with MedDRA coding
  }

  // Calculate total score
  const totalScore = Math.round(
    (seriousnessScore * 0.45) + 
    (drugProfileScore * 0.25) + 
    (noveltyScore * 0.15) + 
    ((100 - dataCompletenessScore) * 0.15)
  );

  // Determine risk level based on ICH E2B(R3) criteria
  let level: RiskLevel = 'low';
  if (totalScore >= 75 || hasFatal || hasLifeThreatening || hasHospitalization || hasDisability || hasCongenitalAnomaly || hasMedicallySignificant) {
    level = 'high';
  } else if (totalScore >= 50) {
    level = 'medium';
  }

  // Generate risk factors
  const factors: string[] = [];
  if (hasFatal) factors.push('Fatal outcome reported');
  else if (hasLifeThreatening) factors.push('Life-threatening event');
  else if (hasHospitalization) factors.push('Required hospitalization');
  else if (hasDisability) factors.push('Resulted in disability');
  else if (hasCongenitalAnomaly) factors.push('Congenital anomaly reported');
  else if (hasMedicallySignificant) factors.push('Medically significant event');
  
  if (extractedData.seriousness_indicators?.length > 0) {
    factors.push(...extractedData.seriousness_indicators.slice(0, 2));
  }
  if (drugProfileScore >= 75) {
    factors.push('High-risk drug class profile');
  }
  if (dataCompletenessScore < 60) {
    factors.push('Incomplete safety data requiring follow-up');
  }
  const criticalMissing = missingFields.filter(f => !f.available && f.priority === 'critical');
  if (criticalMissing.length > 0) {
    factors.push(`${criticalMissing.length} critical data points missing`);
  }
  if (extractedData.adverse_event?.meddra_pt) {
    factors.push(`MedDRA: ${extractedData.adverse_event.meddra_pt}`);
  }

  return {
    level,
    score: totalScore,
    seriousnessScore,
    noveltyScore,
    drugProfileScore,
    dataCompletenessScore,
    factors: factors.slice(0, 5),
    seriousnessCriteria: criteria,
    isE2BR3Compliant: true
  };
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
      reporterResponses: [],
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

  const updateCaseOutreach = useCallback((outreach: OutreachMessage) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      outreachMessage: outreach,
      updatedAt: new Date()
    } : null);
  }, []);

  const updateCaseStatus = useCallback((status: ICSRCase['status']) => {
    setCurrentCase(prev => {
      if (!prev) return null;
      const updates: Partial<ICSRCase> = { status, updatedAt: new Date() };
      if (status === 'followup_sent') updates.sentAt = new Date();
      if (status === 'response_received') updates.respondedAt = new Date();
      return { ...prev, ...updates };
    });
  }, []);

  const updateReporterResponses = useCallback((responses: ReporterResponse[]) => {
    setCurrentCase(prev => prev ? {
      ...prev,
      reporterResponses: responses,
      updatedAt: new Date()
    } : null);
  }, []);

  // Merge reporter responses back into extracted data - closing the loop
  const mergeReporterData = useCallback((responses: ReporterResponse[]) => {
    setCurrentCase(prev => {
      if (!prev || !prev.extractedData) return prev;
      
      const updatedExtractedData = { ...prev.extractedData };
      const updatedMissingFields = prev.missingFields.map(f => {
        const response = responses.find(r => r.field === f.field);
        if (response && response.answer) {
          // Update the extracted data with the reporter's answer
          const fieldKey = f.field as keyof AIExtractedData;
          if (fieldKey in updatedExtractedData) {
            (updatedExtractedData[fieldKey] as any) = {
              ...(updatedExtractedData[fieldKey] as any),
              value: Array.isArray(response.answer) ? response.answer.join(', ') : response.answer,
              found: true,
              confidence: 1.0
            };
          }
          return { ...f, available: true };
        }
        return f;
      });
      
      return {
        ...prev,
        extractedData: updatedExtractedData,
        missingFields: updatedMissingFields,
        reporterResponses: responses,
        status: 'ready_for_review' as const,
        respondedAt: new Date(),
        updatedAt: new Date()
      };
    });
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
        updateCaseOutreach,
        updateCaseStatus,
        updateReporterResponses,
        mergeReporterData,
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
