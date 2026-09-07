import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Building, 
  MapPin, 
  Phone,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'trainee' | 'trainer'>('trainee');
  const [registerStation, setRegisterStation] = useState('IMD-HQ-DELHI');
  const [registerOrg, setRegisterOrg] = useState('India Meteorological Department (IMD)');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
    } catch {
      // Error handled in store
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationSuccess(null);
    try {
      const res = await register({
        email: registerEmail.trim(),
        password: registerPassword,
        full_name: registerName.trim(),
        role: registerRole,
        station_code: registerStation.trim() || 'IMD-HQ-DELHI',
        organization: registerOrg.trim() || 'India Meteorological Department (IMD)',
        phone_number: registerPhone.trim() || undefined,
      });
      setRegistrationSuccess(
        res.message || 'Registration submitted successfully! Your account is pending administrative approval.'
      );
      // Clear form
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterPhone('');
    } catch {
      // Error handled in store
    }
  };

  const fillDemoAdmin = () => {
    setLoginEmail('admin.imd@moes.gov.in');
    setLoginPassword('Admin@CapacityConnect2026');
    clearError();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 text-white p-6 relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-400 text-slate-950">
              PORTAL AUTHENTICATION
            </span>
            <span className="text-[11px] font-mono text-teal-300">RBAC Level 1</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Capacity Connect Access Gateway</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Ministry of Earth Sciences &bull; India Meteorological Department
          </p>

          {/* Modal Tabs */}
          <div className="flex mt-5 bg-slate-900/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                setAuthModalTab('login');
                clearError();
                setRegistrationSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalTab === 'login'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In to Station
            </button>
            <button
              onClick={() => {
                setAuthModalTab('register');
                clearError();
                setRegistrationSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                authModalTab === 'register'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Register Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Registration Success Message */}
          {registrationSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Account Created (Approval Pending)</span>
              </div>
              <p className="leading-relaxed text-emerald-700">
                {registrationSuccess}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setRegistrationSuccess(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {authModalTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer@imd.gov.in"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-900 hover:bg-blue-950 focus:ring-4 focus:ring-blue-900/20 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate Station Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo Admin Quick-Fill Banner */}
              <div className="pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Evaluation Mode Admin</div>
                      <div className="text-[11px] text-slate-500">admin.imd@moes.gov.in</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoAdmin}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition"
                  >
                    Quick Fill
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {authModalTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Full Name (with Designation)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Verma (Scientist-D)"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Official Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="name@imd.gov.in"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Password (Min 8 chars)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Requested Functional Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('trainee')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      registerRole === 'trainee'
                        ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">Trainee / Learner</div>
                    <div className="text-[10px] text-slate-500">Meteorologists, Observers &amp; Cadres</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('trainer')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition ${
                      registerRole === 'trainer'
                        ? 'border-blue-900 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="font-bold">Trainer / Instructor</div>
                    <div className="text-[10px] text-slate-500">Domain Specialists &amp; Faculty</div>
                  </button>
                </div>
              </div>

              {/* Station Code, Org & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Station Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={registerStation}
                      onChange={(e) => setRegisterStation(e.target.value)}
                      placeholder="e.g. IMD-HQ-DELHI"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Organization / Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={registerOrg}
                      onChange={(e) => setRegisterOrg(e.target.value)}
                      placeholder="e.g. IMD"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Phone / Extension (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="+91-XXXXXXXXXX"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-800 transition"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>MoES Protocol Note:</strong> All registrations default to <em>pending_approval</em> and must be approved by the station administrator before portal login.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-900 hover:bg-blue-950 focus:ring-4 focus:ring-blue-900/20 shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration for Approval</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
