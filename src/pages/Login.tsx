import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, UserCog, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

type AuthStep = 'login' | 'consent' | 'role';

export default function Login() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUserRole } = useApp();
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'pv_analyst' | 'reporter' | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('consent');
  };

  const handleConsent = () => {
    if (consentChecked) {
      setStep('role');
    }
  };

  const handleRoleSelect = (role: 'pv_analyst' | 'reporter') => {
    setSelectedRole(role);
    setIsAuthenticated(true);
    setUserRole(role);
    
    if (role === 'pv_analyst') {
      navigate('/dashboard');
    } else {
      navigate('/reporter/inbox');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SafetyFlow</h1>
              <p className="text-sm text-white/70">Intelligent ICSR Follow-up</p>
            </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Smarter Safety Data,<br />
            <span className="text-white/80">Faster Insights</span>
          </h2>
          
          <p className="text-lg text-white/70 mb-10 max-w-md">
            Transform pharmacovigilance with intelligent, consent-aware follow-ups that ask the right questions early.
          </p>

          <div className="space-y-4">
            {[
              'Early risk stratification',
              'Personalised follow-up forms',
              'Consent-aware workflows',
              'First-touch success optimization',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SafetyFlow</h1>
              <p className="text-xs text-muted-foreground">Intelligent ICSR Follow-up</p>
            </div>
          </div>

          {step === 'login' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
              <p className="text-muted-foreground mb-8">Sign in to your account to continue</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" variant="hero" size="lg">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Demo mode: Enter any email to continue
              </p>
            </div>
          )}

          {step === 'consent' && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-foreground mb-2">Privacy & Compliance</h2>
              <p className="text-muted-foreground mb-8">Please review and acknowledge our policies</p>

              <div className="card-elevated p-6 mb-6">
                <h3 className="font-semibold text-foreground mb-3">Data Processing Agreement</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  By using SafetyFlow, you acknowledge that safety data will be processed in accordance with applicable pharmacovigilance regulations (EU GVP, FDA regulations) and data protection laws (GDPR, HIPAA where applicable).
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>All data is encrypted at rest and in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>Access is role-based and audit-logged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>Reporter consent is verified before contact</span>
                  </li>
                </ul>
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input accent-accent"
                />
                <span className="text-sm text-foreground">
                  I acknowledge and agree to the privacy policy and data processing terms
                </span>
              </label>

              <Button
                onClick={handleConsent}
                disabled={!consentChecked}
                className="w-full"
                variant="hero"
                size="lg"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 'role' && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-foreground mb-2">Select your role</h2>
              <p className="text-muted-foreground mb-8">Choose how you'll be using SafetyFlow</p>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect('pv_analyst')}
                  className={cn(
                    'w-full card-elevated p-6 text-left transition-all hover:shadow-elevated hover:border-accent/50',
                    selectedRole === 'pv_analyst' && 'border-accent ring-2 ring-accent/20'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">PV Analyst</h3>
                      <p className="text-sm text-muted-foreground">
                        Review ICSRs, manage risk stratification, and oversee follow-up workflows
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('reporter')}
                  className={cn(
                    'w-full card-elevated p-6 text-left transition-all hover:shadow-elevated hover:border-accent/50',
                    selectedRole === 'reporter' && 'border-accent ring-2 ring-accent/20'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Reporter</h3>
                      <p className="text-sm text-muted-foreground">
                        Respond to follow-up requests and submit additional safety information
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
