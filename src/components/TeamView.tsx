import React, { useState, useEffect, useMemo } from 'react';
import { Lead, AuthUser, UserRole } from '../types';
import { parseGaj, formatINR, getLeadPaymentReceived } from '../utils/formatters';
import {
  getGajTargets,
  saveGajTargets,
  getPaymentTargets,
  savePaymentTargets,
} from '../utils/targets';
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Award,
  Shield,
  IndianRupee,
  Edit3,
  X,
  CheckCircle2,
  UserPlus,
  Trash2,
  KeyRound,
  Phone,
  Briefcase,
  Crown,
  User as UserIcon,
} from 'lucide-react';

interface TeamViewProps {
  leads: Lead[];
  currentUser?: AuthUser | null;
  users?: AuthUser[];
  onAddUser?: (user: AuthUser) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

type TargetViewFilter = 'all' | 'payment' | 'gaj';

export const TeamView: React.FC<TeamViewProps> = ({
  leads,
  currentUser,
  users = [],
  onAddUser,
  onDeleteUser,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Target values from targets.ts / localStorage
  const [gajTargets, setGajTargets] = useState<Record<string, number>>(() => getGajTargets());
  const [paymentTargets, setPaymentTargets] = useState<Record<string, number>>(() =>
    getPaymentTargets()
  );

  // View filter: 'all' | 'payment' | 'gaj'
  const [targetFilter, setTargetFilter] = useState<TargetViewFilter>('all');

  // Edit Targets Modal state (Admin only)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGajDraft, setEditGajDraft] = useState<Record<string, number>>({});
  const [editPaymentDraft, setEditPaymentDraft] = useState<Record<string, number>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Add Member Modal state (Admin only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberDesignation, setNewMemberDesignation] = useState('Sales Executive');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('user');
  const [addErrorMsg, setAddErrorMsg] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Listen to cross-component target updates
  useEffect(() => {
    const handleSync = () => {
      setGajTargets(getGajTargets());
      setPaymentTargets(getPaymentTargets());
    };
    window.addEventListener('hw_targets_updated', handleSync);
    return () => window.removeEventListener('hw_targets_updated', handleSync);
  }, []);

  // Compute all unique team member names dynamically from users collection & leads' salespersons
  const allTeamNames = useMemo(() => {
    const set = new Set<string>();
    (users || []).forEach((u) => {
      if (u.name && u.name.trim()) set.add(u.name.trim());
    });
    leads.forEach((l) => {
      if (l.salesperson && l.salesperson.trim()) set.add(l.salesperson.trim());
    });
    return Array.from(set);
  }, [users, leads]);

  // Filter team members based on user role
  const displayedMembers = useMemo(() => {
    if (isAdmin) return allTeamNames;
    const myName = (currentUser?.name || '').toLowerCase();
    return allTeamNames.filter((t) => t.toLowerCase() === myName);
  }, [isAdmin, allTeamNames, currentUser?.name]);

  // Compute team statistics
  const teamStats = useMemo(() => {
    return displayedMembers.map((name) => {
      const memberLeads = leads.filter(
        (l) => (l.salesperson || '').toLowerCase() === name.toLowerCase()
      );
      const totalLeads = memberLeads.length;
      const followups = memberLeads.filter((l) => l.status === 'Follow-up').length;
      const siteVisits = memberLeads.filter((l) => l.status === 'Site Visit').length;
      const bookings = memberLeads.filter((l) => ['Booking', 'Closed'].includes(l.status)).length;

      // Gaj target & progress
      const targetGaj = gajTargets[name] ?? 50;
      const bookedGaj = memberLeads
        .filter((l) => ['Booking', 'Closed'].includes(l.status))
        .reduce((s, l) => s + parseGaj(l.size), 0);
      const percentGaj =
        targetGaj > 0 ? Math.min(Math.round((bookedGaj / targetGaj) * 100), 200) : 0;

      // Payment target & progress
      const targetPayment = paymentTargets[name] ?? 2500000;
      const collectedPayment = memberLeads
        .filter((l) => ['Booking', 'Closed'].includes(l.status))
        .reduce((s, l) => s + getLeadPaymentReceived(l), 0);
      const percentPayment =
        targetPayment > 0 ? Math.min(Math.round((collectedPayment / targetPayment) * 100), 200) : 0;

      // Blended average quota achievement
      const overallPercent = Math.round((percentGaj + percentPayment) / 2);

      // User account details if registered
      const matchedUser = (users || []).find(
        (u) => u.name.toLowerCase() === name.toLowerCase()
      );

      return {
        name,
        userAccount: matchedUser,
        leads: totalLeads,
        followups,
        siteVisits,
        bookings,
        targetGaj,
        bookedGaj,
        percentGaj,
        targetPayment,
        collectedPayment,
        percentPayment,
        overallPercent,
      };
    });
  }, [displayedMembers, leads, gajTargets, paymentTargets, users]);

  // Top performers
  const topGajPerformer = [...teamStats].sort((a, b) => b.bookedGaj - a.bookedGaj)[0];
  const topPaymentPerformer = [...teamStats].sort(
    (a, b) => b.collectedPayment - a.collectedPayment
  )[0];

  // Team totals
  const totalTargetGaj = displayedMembers.reduce((sum, t) => sum + (gajTargets[t] ?? 50), 0);
  const totalBookedGaj = teamStats.reduce((a, b) => a + b.bookedGaj, 0);
  const overallTeamGajAchieved =
    totalTargetGaj > 0 ? Math.round((totalBookedGaj / totalTargetGaj) * 100) : 0;

  const totalTargetPayment = displayedMembers.reduce(
    (sum, t) => sum + (paymentTargets[t] ?? 2500000),
    0
  );
  const totalCollectedPayment = teamStats.reduce((a, b) => a + b.collectedPayment, 0);
  const overallTeamPaymentAchieved =
    totalTargetPayment > 0
      ? Math.round((totalCollectedPayment / totalTargetPayment) * 100)
      : 0;

  // Open edit targets modal
  const handleOpenEditModal = () => {
    setEditGajDraft({ ...gajTargets });
    setEditPaymentDraft({ ...paymentTargets });
    setSaveSuccessMsg('');
    setIsEditModalOpen(true);
  };

  // Save targets
  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    saveGajTargets(editGajDraft);
    savePaymentTargets(editPaymentDraft);
    setGajTargets(editGajDraft);
    setPaymentTargets(editPaymentDraft);
    setSaveSuccessMsg('टारगेट सफलतापूर्वक अपडेट हो गए! (Targets saved successfully)');
    setTimeout(() => {
      setIsEditModalOpen(false);
      setSaveSuccessMsg('');
    }, 900);
  };

  // Handle Admin creating a new team member
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddErrorMsg('');

    const cleanName = newMemberName.trim();
    const cleanMobile = newMemberMobile.replace(/\D/g, '').trim();
    const cleanUsername = newMemberUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = newMemberPassword.trim();

    if (!cleanName) {
      setAddErrorMsg('कृपया सदस्य का पूरा नाम दर्ज करें।');
      return;
    }
    if (cleanMobile.length !== 10) {
      setAddErrorMsg('कृपया 10-अंकों का मान्य मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setAddErrorMsg('यूज़र ID कम से कम 3 अक्षरों की होनी चाहिए।');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setAddErrorMsg('पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।');
      return;
    }

    setIsAddingUser(true);

    try {
      const newUser: AuthUser = {
        id: `user-${Date.now()}`,
        name: cleanName,
        mobile: cleanMobile,
        username: cleanUsername,
        password: cleanPassword,
        role: newMemberRole,
        designation: newMemberDesignation.trim() || 'Sales Executive',
        avatarColor: newMemberRole === 'admin' ? 'bg-amber-500' : 'bg-blue-600',
        createdAt: new Date().toISOString(),
      };

      if (onAddUser) {
        await onAddUser(newUser);
      }

      setIsAddingUser(false);
      setIsAddModalOpen(false);
      // Reset fields
      setNewMemberName('');
      setNewMemberMobile('');
      setNewMemberUsername('');
      setNewMemberPassword('');
      setNewMemberDesignation('Sales Executive');
      setNewMemberRole('user');
    } catch (err) {
      console.error('Failed to add user', err);
      setIsAddingUser(false);
      setAddErrorMsg('सदस्य जोड़ने में त्रुटि आई। कृपया पुनः प्रयास करें।');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <span>टीम परफॉर्मेंस व कोटा (Team Quota)</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {displayedMembers.length} Active Members
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'एरिया टारगेट (Gaj) व पेमेंट रिकवरी (₹) की संयुक्त ट्रैकिंग'
              : `व्यक्तिगत टारगेट व मासिक रिकवरी प्रगति (${currentUser?.name || 'User'})`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Target Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
            <button
              id="filter-target-all"
              type="button"
              onClick={() => setTargetFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                targetFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी (All)
            </button>
            <button
              id="filter-target-payment"
              type="button"
              onClick={() => setTargetFilter('payment')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                targetFilter === 'payment'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <IndianRupee className="w-3 h-3" />
              <span>पेमेंट (₹)</span>
            </button>
            <button
              id="filter-target-gaj"
              type="button"
              onClick={() => setTargetFilter('gaj')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                targetFilter === 'gaj'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <Target className="w-3 h-3" />
              <span>एरिया (Gaj)</span>
            </button>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                id="btn-add-team-member"
                type="button"
                onClick={() => {
                  setAddErrorMsg('');
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ नया सदस्य (Add Member)</span>
              </button>

              <button
                id="btn-edit-targets"
                type="button"
                onClick={handleOpenEditModal}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>टारगेट सेट करें (Targets)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            यह आपका व्यक्तिगत स्कोरकार्ड है। अन्य टीम मेंबर्स का पेमेंट व टारगेट डेटा केवल कंपनी एडमिन के लिए उपलब्ध है।
          </span>
        </div>
      )}

      {/* Empty State when no team members yet */}
      {displayedMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            अभी कोई टीम सदस्य पंजीकृत नहीं है
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            पुराने डेमो नाम साफ कर दिए गए हैं। अब कोई भी टीम सदस्य लॉगिन स्क्रीन से <strong>'नया ID व पासवर्ड बनाएं'</strong> पर क्लिक करके तुरंत अपना अकाउंट बना सकता है, या आप नीचे दिए गए बटन से सीधे सदस्य जोड़ सकते हैं।
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setAddErrorMsg('');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ पहला टीम सदस्य जोड़ें (Add Member)</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Gaj / Plot Area Target */}
            {(targetFilter === 'all' || targetFilter === 'gaj') && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {isAdmin ? 'Total Team Area Target' : 'My Area Target'}
                  </span>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {totalTargetGaj} <span className="text-sm font-semibold text-slate-500">Gaj</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Booked: <strong>{totalBookedGaj} Gaj</strong>
                  </span>
                  <span className="font-bold text-blue-600">{overallTeamGajAchieved}% Achieved</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, overallTeamGajAchieved)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Card 2: Payment / Collection Target */}
            {(targetFilter === 'all' || targetFilter === 'payment') && (
              <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAdmin ? 'Total Payment Target' : 'My Payment Target'}</span>
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Monthly
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-1">
                  {formatINR(totalTargetPayment)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAdmin
                    ? `संयुक्त मासिक कलेक्शन कोटा (${displayedMembers.length} सदस्य)`
                    : 'आपकी मासिक पेमेंट व रेवेन्यू रिकवरी का लक्ष्य'}
                </p>
              </div>
            )}

            {/* Card 3: Total Payment Collected / Received */}
            {(targetFilter === 'all' || targetFilter === 'payment') && (
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {isAdmin ? 'Payment Collected' : 'My Collection'}
                  </span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                  {formatINR(totalCollectedPayment)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-600">टोकन व डाउन पेमेंट</span>
                  <span className="font-bold text-emerald-700">
                    {overallTeamPaymentAchieved}% Achieved
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, overallTeamPaymentAchieved)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Card 4: Leaderboard Star */}
            <div className="bg-gradient-to-tr from-amber-50 to-orange-50/70 p-4 rounded-xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  {isAdmin ? 'Leaderboard Star' : 'Status & Quota'}
                </span>
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-amber-950 mt-1 truncate">
                {isAdmin
                  ? topPaymentPerformer && topPaymentPerformer.collectedPayment > 0
                    ? topPaymentPerformer.name
                    : topGajPerformer
                    ? topGajPerformer.name
                    : '—'
                  : `${teamStats[0]?.overallPercent || 0}% Total Done`}
              </div>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                {isAdmin ? (
                  topPaymentPerformer && topPaymentPerformer.collectedPayment > 0 ? (
                    <>
                      पेमेंट स्टार: <strong>{formatINR(topPaymentPerformer.collectedPayment)}</strong> (
                      {topPaymentPerformer.percentPayment}% लक्ष्य)
                    </>
                  ) : (
                    'टारगेट मॉनिटरिंग सक्रिय'
                  )
                ) : (
                  <>
                    {teamStats[0]?.bookedGaj || 0} Gaj •{' '}
                    {formatINR(teamStats[0]?.collectedPayment || 0)} प्राप्त
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Main Team Performance Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Executive Quota Scorecard (एरिया व पेमेंट लक्ष्य)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>पेमेंट लक्ष्य (₹ Target)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>एरिया लक्ष्य (Gaj Target)</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Salesperson</th>
                    <th className="py-3 px-3 text-center">Leads</th>
                    <th className="py-3 px-3 text-center">Visits</th>
                    <th className="py-3 px-3 text-center">Bookings</th>

                    {/* Gaj Target Columns */}
                    {(targetFilter === 'all' || targetFilter === 'gaj') && (
                      <>
                        <th className="py-3 px-3 text-right">Target (Gaj)</th>
                        <th className="py-3 px-3 text-right">Booked Gaj</th>
                      </>
                    )}

                    {/* Payment Target Columns */}
                    {(targetFilter === 'all' || targetFilter === 'payment') && (
                      <>
                        <th className="py-3 px-3 text-right text-emerald-800">Payment Target (₹)</th>
                        <th className="py-3 px-3 text-right text-emerald-800">Collected (₹)</th>
                      </>
                    )}

                    <th className="py-3 px-4">Progress Breakdown</th>
                  </tr>
                </thead>
                <tbody id="teamRows" className="divide-y divide-slate-100 text-slate-700">
                  {teamStats.map((tm) => {
                    const isStar =
                      topPaymentPerformer &&
                      topPaymentPerformer.name === tm.name &&
                      tm.collectedPayment > 0;
                    return (
                      <tr key={tm.name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {tm.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{tm.name}</span>
                                {isStar && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                                    <Award className="w-3 h-3 text-amber-600" /> Star
                                  </span>
                                )}
                              </div>
                              {tm.userAccount && (
                                <div className="text-[10px] text-slate-400 font-normal font-mono">
                                  ID: {tm.userAccount.username || tm.userAccount.mobile}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-semibold text-slate-800">
                          {tm.leads}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                            {tm.siteVisits}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {tm.bookings}
                          </span>
                        </td>

                        {/* Gaj Columns */}
                        {(targetFilter === 'all' || targetFilter === 'gaj') && (
                          <>
                            <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                              {tm.targetGaj} Gaj
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-blue-600">
                              {tm.bookedGaj} Gaj
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {tm.percentGaj}% of target
                              </span>
                            </td>
                          </>
                        )}

                        {/* Payment Columns */}
                        {(targetFilter === 'all' || targetFilter === 'payment') && (
                          <>
                            <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                              {formatINR(tm.targetPayment)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                              {formatINR(tm.collectedPayment)}
                              <span className="block text-[10px] text-emerald-600 font-normal">
                                {tm.percentPayment}% recovered
                              </span>
                            </td>
                          </>
                        )}

                        {/* Progress Bars */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 min-w-[140px]">
                            {/* Payment Progress */}
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-semibold">
                                <span className="text-emerald-800">पेमेंट रिकवरी</span>
                                <span className="text-emerald-700">{tm.percentPayment}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, tm.percentPayment)}%` }}
                                />
                              </div>
                            </div>

                            {/* Gaj Progress */}
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-semibold">
                                <span className="text-blue-700">एरिया प्लॉट</span>
                                <span className="text-blue-600">{tm.percentGaj}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, tm.percentGaj)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Registered Accounts Management Panel */}
          {isAdmin && users.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    पंजीकृत यूज़र अकाउंट्स (Registered Accounts)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {users.length} Registered Users in Cloud
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {u.name}
                        </span>
                        {u.role === 'admin' ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Admin
                          </span>
                        ) : (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <UserIcon className="w-2.5 h-2.5" /> Sales
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 font-mono">
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span>ID: {u.username || u.mobile}</span>
                      </div>
                      {u.mobile && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.mobile}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {u.designation || 'Sales Executive'}
                      </div>
                    </div>

                    {/* Delete button (cannot delete main admin) */}
                    {u.username !== 'admin' && onDeleteUser && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `क्या आप सदस्य "${u.name}" (ID: ${u.username || u.mobile}) का खाता हटाना चाहते हैं?`
                            )
                          ) {
                            onDeleteUser(u.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: Edit Quota / Targets (Admin Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    मासिक एरिया व पेमेंट टारगेट सेट करें
                  </h3>
                  <p className="text-xs text-slate-400">
                    प्रत्येक सदस्य के लिए गज (Area) और पेमेंट (₹) कोटा सेट करें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTargets} className="flex-1 overflow-y-auto p-5 space-y-4">
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                {displayedMembers.map((member) => {
                  const currGaj = editGajDraft[member] ?? 50;
                  const currPayment = editPaymentDraft[member] ?? 2500000;

                  return (
                    <div
                      key={member}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                            {member.slice(0, 1)}
                          </span>
                          <span>{member}</span>
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Current: {currGaj} Gaj • {formatINR(currPayment)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Area Target in Gaj */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            एरिया टारगेट (Area Target in Gaj)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={10}
                              max={1000}
                              step={5}
                              value={currGaj}
                              onChange={(e) =>
                                setEditGajDraft({
                                  ...editGajDraft,
                                  [member]: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-xs text-slate-500 font-semibold">Gaj</span>
                          </div>
                        </div>

                        {/* Payment Target in Rupees */}
                        <div>
                          <label className="block text-[11px] font-semibold text-emerald-800 mb-1 flex items-center justify-between">
                            <span>पेमेंट टारगेट (Payment Target ₹)</span>
                            <span className="text-[10px] text-slate-500">
                              {formatINR(currPayment)}
                            </span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={100000}
                              max={100000000}
                              step={100000}
                              value={currPayment}
                              onChange={(e) =>
                                setEditPaymentDraft({
                                  ...editPaymentDraft,
                                  [member]: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-emerald-950 font-semibold focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {[1500000, 2500000, 3500000, 5000000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setEditPaymentDraft({
                                    ...editPaymentDraft,
                                    [member]: preset,
                                  })
                                }
                                className="px-1.5 py-0.5 text-[10px] rounded bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-semibold transition-colors cursor-pointer"
                              >
                                {formatINR(preset)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  id="btn-save-targets-submit"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>टारगेट सुरक्षित करें (Save Targets)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add New Team Member with ID & Password (Admin Only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    नया टीम सदस्य जोड़ें (Add Team Member)
                  </h3>
                  <p className="text-xs text-slate-400">
                    सदस्य के लिए नाम, मोबाइल, ID और पासवर्ड बनाएं
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-3.5">
              {addErrorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {addErrorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पूरा नाम (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="उदा. राहुल वर्मा"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  मोबाइल नंबर (Mobile No.) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={newMemberMobile}
                  onChange={(e) => setNewMemberMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-अंकों का मोबाइल नंबर"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    यूज़र ID (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="उदा. rahul12"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    पासवर्ड (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="कम से कम 4 अक्षर"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    पद (Designation)
                  </label>
                  <input
                    type="text"
                    value={newMemberDesignation}
                    onChange={(e) => setNewMemberDesignation(e.target.value)}
                    placeholder="उदा. Sales Executive"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    रोल (Role)
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="user">👤 Sales User</option>
                    <option value="admin">👑 Company Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAddingUser ? 'सेव हो रहा है...' : 'सदस्य जोड़ें (Save)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
