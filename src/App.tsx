import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CaseIntake from "./pages/CaseIntake";
import RiskStratification from "./pages/RiskStratification";
import ConsentCheck from "./pages/ConsentCheck";
import MissingInfo from "./pages/MissingInfo";
import QuestionBuilder from "./pages/QuestionBuilder";
import OutreachPreview from "./pages/OutreachPreview";
import ReporterInbox from "./pages/ReporterInbox";
import ReporterForm from "./pages/ReporterForm";
import ImpactDashboard from "./pages/ImpactDashboard";
import SystemIntelligence from "./pages/SystemIntelligence";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/impact" element={<ImpactDashboard />} />
            <Route path="/intake" element={<CaseIntake />} />
            <Route path="/case/:id/risk" element={<RiskStratification />} />
            <Route path="/case/:id/consent" element={<ConsentCheck />} />
            <Route path="/case/:id/missing" element={<MissingInfo />} />
            <Route path="/case/:id/questions" element={<QuestionBuilder />} />
            <Route path="/case/:id/outreach" element={<OutreachPreview />} />
            <Route path="/reporter/inbox" element={<ReporterInbox />} />
            <Route path="/reporter/form/:id" element={<ReporterForm />} />
            <Route path="/system-intelligence" element={<SystemIntelligence />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
