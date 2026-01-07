import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ICSRCase, DashboardMetrics } from '@/types/icsr';

type UserRole = 'pv_analyst' | 'reporter' | null;

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCase, setCurrentCase] = useState<ICSRCase | null>(null);
  const [cases, setCases] = useState<ICSRCase[]>([]);
  const [metrics] = useState<DashboardMetrics>(defaultMetrics);

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
