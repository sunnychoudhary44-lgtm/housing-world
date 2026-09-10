import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Lock,
  User,
  Crown,
  Sparkles,
  RefreshCw,
  Building2,
  Users2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { DEFAULT_USERS } from '../data/initialData';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [mobileNumber, setMobileNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSimulatingSms, setIsSimulatingSms] = useState(false);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Clean mobile digits
  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(cleaned);
    setErrorMsg('');

    // Check if entered number matches an existing user in DEFAULT_USERS
    const matched = DEFAULT_USERS.find((u) => u.mobile === cleaned);
    if (matched) {
      setSelectedRole(matched.role);
      setUserName(matched.name);
    }
  };

  // Generate and send OTP
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (mobileNumber.length !== 10) {
      setErrorMsg('कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें (Enter 10-digit mobile number).');
      return;
    }

    if (selectedRole === 'user' && !userName.trim()) {
      // If user not in default list and no name provided
      const matched = DEFAULT_USERS.find((u) => u.mobile === mobileNumber);
      if (!matched) {
        setErrorMsg('कृपया अपना नाम दर्ज करें (Please enter your name).');
        return;
      }
    }

    // Generate random 4-digit OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);
    setOtp('');
    setStep('otp');
    setResendTimer(30);
    setIsSimulatingSms(true);
  };

  // One-click quick demo login selector
  const handleSelectQuickDemo = (user: AuthUser) => {
    setSelectedRole(user.role);
    setMobileNumber(user.mobile);
    setUserName(user.name);
    setErrorMsg('');

    // Directly prepare OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);
    setOtp(newOtp); // prefill for instant 1-click test
    setStep('otp');
    setResendTimer(30);
    setIsSimulatingSms(true);
  };

  // Verify OTP and complete login
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (otp.trim() !== generatedOtp) {
      setErrorMsg('अमान्य OTP! कृपया स्क्रीन पर आया OTP दर्ज करें (Invalid OTP).');
      return;
    }

    // Look up or create user object
    const matched = DEFAULT_USERS.find((u) => u.mobile === mobileNumber);
    const loggedInUser: AuthUser = matched
      ? { ...matched, role: selectedRole }
      : {
          id: `user-${Date.now()}`,
          name: userName.trim() || (selectedRole === 'admin' ? 'Admin User' : `User ${mobileNumber.slice(-4)}`),
          mobile: mobileNumber,
          role: selectedRole,
          designation: selectedRole === 'admin' ? 'System Administrator' : 'Sales Executive',
          avatarColor: selectedRole === 'admin' ? 'bg-amber-500' : 'bg-blue-500',
        };

    onLoginSuccess(loggedInUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Background glowing ambient circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 mb-3 border border-blue-400/30">
            🏠
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Housing Worlds <span className="text-blue-400 font-semibold text-base sm:text-lg">CRM</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real Estate Sales & Telecalling Portal • Secure Access
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="p-2 bg-slate-950/70 border-b border-slate-800 flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg('');
              // If current mobile matches user, clear it or adjust
              const matched = DEFAULT_USERS.find((u) => u.mobile === mobileNumber);
              if (matched && matched.role !== 'admin') {
                setMobileNumber('9876500000');
                setUserName('Sunny Choudhary');
              }
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Admin Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('user');
              setErrorMsg('');
              const matched = DEFAULT_USERS.find((u) => u.mobile === mobileNumber);
              if (matched && matched.role !== 'user') {
                setMobileNumber('9871111111');
                setUserName('Vishal');
              }
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'user'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>User / Telecaller</span>
          </button>
        </div>

        {/* Role Explanation Notice */}
        <div className="px-6 pt-4 pb-2">
          {selectedRole === 'admin' ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-200">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">
                  👑 एडमिन (Admin) एक्सेस:
                </strong>
                आप सभी यूज़र्स का डेटा, पूरी टीम की लीड्स, कॉल लॉग्स और ओवरऑल परफॉर्मेंस देख सकते हैं।
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-start gap-2.5 text-xs text-blue-200">
              <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-blue-300 font-semibold mb-0.5">
                  🔒 प्राइवेट यूज़र (User) एक्सेस:
                </strong>
                आप सिर्फ अपनी असाइन की हुई लीड्स और कॉल्स ही देख सकेंगे। अन्य यूज़र्स का डेटा पूरी तरह सुरक्षित और गुप्त रहेगा।
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 pt-2 space-y-5">
          {/* Simulated SMS Alert Banner when OTP is sent */}
          {step === 'otp' && isSimulatingSms && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-600 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>📲 SMS अलर्ट प्राप्त हुआ (Simulated SMS)</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  अभी-अभी
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-mono">
                "Housing Worlds CRM लॉगिन हेतु आपका OTP है:{' '}
                <strong className="text-emerald-300 text-sm font-bold tracking-wider">
                  {generatedOtp}
                </strong>
                "
              </p>
              <button
                type="button"
                onClick={() => setOtp(generatedOtp)}
                className="mt-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-fill ({generatedOtp})</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'mobile' ? (
            /* STEP 1: MOBILE NUMBER INPUT */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  10-अंकों का मोबाइल नंबर (Mobile Number)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-semibold text-sm select-none border-r border-slate-700 pr-2">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98XXXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-16 pr-4 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-wider font-mono font-medium"
                    autoFocus
                  />
                </div>
              </div>

              {/* If User Role and custom number, ask for User Name */}
              {selectedRole === 'user' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    कार्यकारी का नाम (Sales Executive Name)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. विशाल / राहुल / अमित शर्मा"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 ${
                  selectedRole === 'admin'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                <span>OTP भेजें (Send OTP)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: OTP INPUT */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  नंबर: <strong className="text-white font-mono">+91 {mobileNumber}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('mobile');
                    setOtp('');
                    setErrorMsg('');
                  }}
                  className="text-blue-400 hover:underline cursor-pointer"
                >
                  नंबर बदलें
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  4-अंकों का OTP दर्ज करें (Enter 4-Digit OTP)
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder:text-slate-600 text-center text-lg tracking-[0.5em] font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {resendTimer > 0 ? (
                    `पुनः OTP भेजें (${resendTimer}s)`
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      OTP दोबारा भेजें (Resend OTP)
                    </button>
                  )}
                </span>
                <span className="text-slate-500 text-[11px]">सुरक्षित OTP प्रमाणीकरण</span>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 ${
                  selectedRole === 'admin'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>लॉगिन सत्यापित करें (Verify & Login)</span>
              </button>
            </form>
          )}

          {/* Quick Demo One-Click Accounts */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Demo Accounts (तुरंत टेस्ट करें)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_USERS.map((user) => {
                const isAdmin = user.role === 'admin';
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectQuickDemo(user)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer group hover:scale-[1.02] ${
                      isAdmin
                        ? 'bg-amber-950/30 border-amber-800/60 hover:border-amber-500'
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-blue-500'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-white'
                      }`}
                    >
                      {isAdmin ? <Crown className="w-4 h-4" /> : user.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate group-hover:text-blue-300">
                          {user.name}
                        </span>
                        {isAdmin && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        +91 {user.mobile}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex items-center justify-around text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role-Based Access</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>User Data Isolated</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Housing Worlds</span>
          </span>
        </div>
      </div>
    </div>
  );
};
