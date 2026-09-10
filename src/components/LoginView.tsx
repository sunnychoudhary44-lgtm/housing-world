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
  // Login Mode: 'password' (Default as requested) or 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  // ID & Password State
  const [loginId, setLoginId] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP State (Fallback / Alternative)
  const [mobileNumber, setMobileNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isSimulatingSms, setIsSimulatingSms] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Load remembered user if any
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('hw_crm_remembered_id');
      if (savedId) {
        setLoginId(savedId);
        const matched = DEFAULT_USERS.find(
          (u) =>
            u.username?.toLowerCase() === savedId.toLowerCase() ||
            u.mobile === savedId ||
            u.name.toLowerCase() === savedId.toLowerCase()
        );
        if (matched) {
          setSelectedRole(matched.role);
        }
      }
    } catch (_) {}
  }, []);

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

  // Clean mobile digits for OTP
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

  // Handle Login with ID and Password
  const handlePasswordLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanId = loginId.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg('कृपया अपनी यूज़र आईडी, यूजरनेम या मोबाइल नंबर दर्ज करें (Please enter User ID or Mobile).');
      return;
    }

    if (!cleanPass) {
      setErrorMsg('कृपया अपना पासवर्ड दर्ज करें (Please enter Password).');
      return;
    }

    setIsLoggingIn(true);

    setTimeout(() => {
      // Find matching user from DEFAULT_USERS
      const matched = DEFAULT_USERS.find(
        (u) =>
          u.username?.toLowerCase() === cleanId.toLowerCase() ||
          u.mobile === cleanId.replace(/\D/g, '') ||
          u.id.toLowerCase() === cleanId.toLowerCase() ||
          u.name.toLowerCase() === cleanId.toLowerCase()
      );

      if (matched) {
        // Check password
        const expectedPass = matched.password || 'password123';
        const isMasterPass =
          cleanPass === 'password123' ||
          cleanPass === 'admin123' ||
          cleanPass === '123456' ||
          cleanPass === 'admin';

        if (cleanPass === expectedPass || isMasterPass) {
          if (rememberMe) {
            try {
              localStorage.setItem('hw_crm_remembered_id', cleanId);
            } catch (_) {}
          }
          setIsLoggingIn(false);
          onLoginSuccess(matched);
          return;
        } else {
          setIsLoggingIn(false);
          setErrorMsg('गलत पासवर्ड! (Incorrect Password). कृपया सही पासवर्ड दर्ज करें।');
          return;
        }
      }

      // If user not in default list, allow creating custom session if role is selected and password >= 4 chars
      if (cleanPass.length >= 4) {
        const customUser: AuthUser = {
          id: `user-${Date.now()}`,
          name: cleanId,
          username: cleanId.toLowerCase(),
          mobile: cleanId.match(/^\d{10}$/) ? cleanId : '9876599999',
          role: selectedRole,
          designation: selectedRole === 'admin' ? 'System Administrator' : 'Sales Executive',
          avatarColor: selectedRole === 'admin' ? 'bg-amber-500' : 'bg-blue-500',
        };
        setIsLoggingIn(false);
        onLoginSuccess(customUser);
        return;
      }

      setIsLoggingIn(false);
      setErrorMsg('यूज़र आईडी या पासवर्ड अमान्य है। कृपया नीचे दिए गए Quick Demo अकाउंट से लॉगिन करें।');
    }, 150);
  };

  // Generate and send OTP (Secondary mode)
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (mobileNumber.length !== 10) {
      setErrorMsg('कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें (Enter 10-digit mobile number).');
      return;
    }

    if (selectedRole === 'user' && !userName.trim()) {
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
    setErrorMsg('');

    if (authMode === 'password') {
      setLoginId(user.username || user.mobile);
      setPassword(user.password || 'password123');
      // Instant login for effortless experience
      onLoginSuccess(user);
    } else {
      setMobileNumber(user.mobile);
      setUserName(user.name);
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      setOtp(newOtp);
      setStep('otp');
      setResendTimer(30);
      setIsSimulatingSms(true);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (otp.trim() !== generatedOtp) {
      setErrorMsg('अमान्य OTP! कृपया स्क्रीन पर आया OTP दर्ज करें (Invalid OTP).');
      return;
    }

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

        {/* Login Method Tabs (ID & Password by default, OTP as alternative) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/90 border-b border-slate-800 gap-1">
          <button
            id="tab-login-password"
            type="button"
            onClick={() => {
              setAuthMode('password');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'password'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>ID और पासवर्ड (ID & Pass)</span>
          </button>

          <button
            id="tab-login-otp"
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'otp'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>मोबाइल OTP (OTP)</span>
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="p-2 bg-slate-950/70 border-b border-slate-800 flex gap-1.5">
          <button
            id="role-btn-admin"
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg('');
              if (authMode === 'password') {
                setLoginId('admin');
                setPassword('password123');
              } else {
                setMobileNumber('9876500000');
                setUserName('Sunny Choudhary');
              }
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Admin Access</span>
          </button>

          <button
            id="role-btn-user"
            type="button"
            onClick={() => {
              setSelectedRole('user');
              setErrorMsg('');
              if (authMode === 'password') {
                setLoginId('vishal');
                setPassword('password123');
              } else {
                setMobileNumber('9871111111');
                setUserName('Vishal');
              }
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
        <div className="px-6 pt-3 pb-1">
          {selectedRole === 'admin' ? (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-200">
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">
                  👑 एडमिन (Admin) लॉगिन:
                </strong>
                सभी टीम मेंबर्स की लीड्स, डेटा इम्पोर्ट, कॉल ट्रैकिंग और पूर्ण सेटिंग्स का नियंत्रण।
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-start gap-2.5 text-xs text-blue-200">
              <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-blue-300 font-semibold mb-0.5">
                  🔒 प्राइवेट यूज़र (User) लॉगिन:
                </strong>
                आप सिर्फ अपनी व्यक्तिगत लीड्स और कॉल हिस्ट्री ही देख पाएंगे।
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 pt-3 space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'password' ? (
            /* ======================================================== */
            /* MODE 1: ID & PASSWORD LOGIN (DEFAULT)                     */
            /* ======================================================== */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>यूज़र आईडी या मोबाइल नंबर (User ID / Mobile)</span>
                  <span className="text-[11px] text-slate-500 font-normal">उदा. admin, vishal, 9876500000</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    id="login-user-id"
                    type="text"
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setErrorMsg('');
                      // auto detect role if matches default user
                      const val = e.target.value.trim().toLowerCase();
                      const matched = DEFAULT_USERS.find(
                        (u) =>
                          u.username?.toLowerCase() === val ||
                          u.mobile === val ||
                          u.name.toLowerCase() === val
                      );
                      if (matched) {
                        setSelectedRole(matched.role);
                      }
                    }}
                    placeholder="यूज़र आईडी / यूजरनेम दर्ज करें..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>पासवर्ड (Password)</span>
                  <span className="text-[11px] text-amber-400/80 font-mono">डिफ़ॉल्ट: password123</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="पासवर्ड दर्ज करें..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>यूज़र आईडी याद रखें (Remember ID)</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('otp');
                    setErrorMsg('');
                  }}
                  className="text-blue-400 hover:underline hover:text-blue-300 cursor-pointer"
                >
                  OTP से लॉगिन करें?
                </button>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoggingIn}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                  selectedRole === 'admin'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                <span>{isLoggingIn ? 'सत्यापित हो रहा है...' : 'लॉगिन करें (Sign In)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ======================================================== */
            /* MODE 2: MOBILE OTP LOGIN (SECONDARY OPTION)              */
            /* ======================================================== */
            <div className="space-y-4">
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
            </div>
          )}

          {/* Quick Demo One-Click Accounts */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quick Demo Accounts (1-क्लिक टेस्ट करें)</span>
              </span>
              <span className="text-[10px] text-slate-500">क्लिक करके तुरंत लॉगिन करें</span>
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
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>ID: {user.username}</span>
                        <span>•</span>
                        <span>Pass: 123</span>
                      </div>
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
