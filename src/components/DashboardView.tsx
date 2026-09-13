import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  AlertOctagon,
  Flame,
  MapPin,
  CheckCircle,
  PhoneCall,
  Compass,
  ArrowUpRight,
  MessageCircle,
  Clock,
  Plus,
  Crown,
  User,
  Check,
  ExternalLink,
  ShieldCheck,
  Search,
  X,
  Target,
  TrendingUp,
  Award,
  Phone,
  IndianRupee,
} from 'lucide-react';
import { ActivePage, Lead, CallLog, AuthUser, SiteVisit, TokenAgreement } from '../types';
import {
  fmt,
  openWhatsApp,
  makePhoneCall,
  getFollowupTiming,
  parseGaj,
  formatINR,
  getLeadPaymentReceived,
} from '../utils/formatters';
import { getGajTargets, getPaymentTargets } from '../utils/targets';
import { TeamMemberDetailModal } from './TeamMemberDetailModal';
import { DailyActivityTracker } from './DailyActivityTracker';

interface DashboardViewProps {
  leads: Lead[];
  calls?: CallLog[];
  siteVisits?: SiteVisit[];
  tokensAgreements?: TokenAgreement[];
  currentUser?: AuthUser | null;
  users?: AuthUser[];
  onNavigate: (page: ActivePage) => void;
  onEditLead: (id: number) => void;
  onViewLeadDetail: (lead: Lead) => void;
  onOpenLogModal?: (lead?: Lead | null) => void;
  onSelectTeamMemberForLeads?: (memberName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  calls = [],
  siteVisits: siteVisitsList = [],
  tokensAgreements: tokensAgreementsList = [],
  currentUser,
  users = [],
  onNavigate,
  onEditLead,
  onViewLeadDetail,
  onOpenLogModal,
  onSelectTeamMemberForLeads,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [inspectingMemberModal, setInspectingMemberModal] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 16);

  // Compile list of all team members dynamically from users collection & leads' salespersons
  const allTeamMembers = useMemo(() => {
    const set = new Set<string>();
    (users || []).forEach((u) => {
      if (u.name && u.name.trim()) set.add(u.name.trim());
    });
    leads.forEach((l) => {
      if (l.salesperson && l.salesperson.trim()) {
        set.add(l.salesperson.trim());
      }
    });
    return Array.from(set);
  }, [users, leads]);

  // Compute team member summaries for the Admin selector list
  const teamMemberStats = useMemo(() => {
    return allTeamMembers.map((name) => {
      const userMeta = (users || []).find(
        (u) => u.name.toLowerCase() === name.toLowerCase()
      );
      const mLeads = leads.filter(
        (l) => (l.salesperson || '').toLowerCase() === name.toLowerCase()
      );
      const mCalls = calls.filter(
        (c) => (c.salesperson || '').toLowerCase() === name.toLowerCase()
      );

      const mToday = mLeads.filter(
        (l) => l.followup && l.followup.slice(0, 10) === todayStr
      ).length;

      const mOverdue = mLeads.filter(
        (l) =>
          l.followup &&
          l.followup < nowIso &&
          !['Booking', 'Closed', 'Lost'].includes(l.status)
      ).length;

      const mBooked = mLeads
        .filter((l) => l.status === 'Booking' || l.status === 'Closed')
        .reduce((sum, l) => sum + parseGaj(l.size), 0);

      const gajTargets = getGajTargets();
      const paymentTargets = getPaymentTargets();

      const mTarget = gajTargets[name] || 50;
      const mPercent = mTarget > 0 ? Math.round((mBooked / mTarget) * 100) : 0;

      const mPaymentTarget = paymentTargets[name] || 2500000;
      const mPaymentCollected = mLeads
        .filter((l) => l.status === 'Booking' || l.status === 'Closed')
        .reduce((sum, l) => sum + getLeadPaymentReceived(l), 0);
      const mPaymentPercent =
        mPaymentTarget > 0 ? Math.round((mPaymentCollected / mPaymentTarget) * 100) : 0;

      return {
        name,
        userMeta,
        leadsCount: mLeads.length,
        todayFollowups: mToday,
        overdueFollowups: mOverdue,
        bookedGaj: mBooked,
        targetGaj: mTarget,
        percentAchieved: mPercent,
        paymentTarget: mPaymentTarget,
        paymentCollected: mPaymentCollected,
        paymentPercent: mPaymentPercent,
        callsCount: mCalls.length,
      };
    });
  }, [allTeamMembers, leads, calls, todayStr, nowIso]);

  // Filter team members by search term if typed
  const filteredTeamMembers = useMemo(() => {
    if (!memberSearchTerm.trim()) return teamMemberStats;
    const q = memberSearchTerm.toLowerCase().trim();
    return teamMemberStats.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.userMeta?.designation || '').toLowerCase().includes(q) ||
        (m.userMeta?.mobile || '').includes(q)
    );
  }, [teamMemberStats, memberSearchTerm]);

  // Apply active member filter if selected by Admin
  const activeLeads = useMemo(() => {
    if (!selectedMember) return leads;
    return leads.filter(
      (l) => (l.salesperson || '').toLowerCase() === selectedMember.toLowerCase()
    );
  }, [leads, selectedMember]);

  const activeCalls = useMemo(() => {
    if (!selectedMember) return calls;
    return calls.filter(
      (c) => (c.salesperson || '').toLowerCase() === selectedMember.toLowerCase()
    );
  }, [calls, selectedMember]);

  // Selected member meta
  const selectedMemberStats = useMemo(() => {
    if (!selectedMember) return null;
    return teamMemberStats.find(
      (m) => m.name.toLowerCase() === selectedMember.toLowerCase()
    );
  }, [teamMemberStats, selectedMember]);

  // Metrics computation for cards
  const total = activeLeads.length;
  const hot = activeLeads.filter((l) => l.priority === 'Hot').length;

  const todayFollowups = activeLeads.filter(
    (l) => l.followup && l.followup.slice(0, 10) === todayStr
  ).length;

  const overdue = activeLeads.filter(
    (l) =>
      l.followup &&
      l.followup < nowIso &&
      !['Booking', 'Closed', 'Lost'].includes(l.status)
  ).length;

  const siteVisits = activeLeads.filter((l) => l.status === 'Site Visit').length;
  const bookingsClosed = activeLeads.filter(
    (l) => l.status === 'Booking' || l.status === 'Closed'
  ).length;

  const bookedGajTotal = activeLeads
    .filter((l) => l.status === 'Booking' || l.status === 'Closed')
    .reduce((sum, l) => sum + parseGaj(l.size), 0);

  const totalPaymentCollected = useMemo(() => {
    return activeLeads
      .filter((l) => ['Booking', 'Closed'].includes(l.status))
      .reduce((sum, l) => sum + getLeadPaymentReceived(l), 0);
  }, [activeLeads]);

  const paymentTargetsMap = useMemo(() => getPaymentTargets(), []);

  const totalPaymentTarget = useMemo(() => {
    if (selectedMember) {
      return paymentTargetsMap[selectedMember] || 2500000;
    }
    return (Object.values(paymentTargetsMap) as number[]).reduce((a, b) => a + b, 0);
  }, [selectedMember, paymentTargetsMap]);

  const paymentPercentAchieved =
    totalPaymentTarget > 0 ? Math.round((totalPaymentCollected / totalPaymentTarget) * 100) : 0;

  const todayCallsCount = activeCalls.filter(
    (c) => c.timestamp.slice(0, 10) === todayStr
  ).length;

  // Filter site visits by executive if selectedMember is active
  const memberFilteredVisits = useMemo(() => {
    if (!selectedMember) return siteVisitsList;
    const q = selectedMember.toLowerCase().trim();
    return siteVisitsList.filter(
      (v) =>
        (v.salesExecutive && v.salesExecutive.toLowerCase().trim() === q) ||
        (v.telecaller && v.telecaller.toLowerCase().trim() === q)
    );
  }, [siteVisitsList, selectedMember]);

  // Today's site visits
  const todayVisits = useMemo(() => {
    return memberFilteredVisits.filter((v) => {
      const s = v.scheduledTime ? v.scheduledTime.slice(0, 10) : '';
      const c = v.conductedTime ? v.conductedTime.slice(0, 10) : '';
      return s === todayStr || c === todayStr;
    });
  }, [memberFilteredVisits, todayStr]);

  const todayVisitsCount = todayVisits.length;
  const todayConductedCount = todayVisits.filter((v) => v.status === 'Conducted').length;

  // Filter tokens and agreements by executive if selectedMember is active
  const memberFilteredTokens = useMemo(() => {
    if (!selectedMember) return tokensAgreementsList;
    const q = selectedMember.toLowerCase().trim();
    return tokensAgreementsList.filter(
      (t) => t.executiveName && t.executiveName.toLowerCase().trim() === q
    );
  }, [tokensAgreementsList, selectedMember]);

  // Today's payment collected from tokens/agreements
  const todayTokensCollected = useMemo(() => {
    return memberFilteredTokens
      .filter((t) => {
        const pDate = t.paymentDate ? t.paymentDate.slice(0, 10) : '';
        const cDate = t.createdAt ? t.createdAt.slice(0, 10) : '';
        return pDate === todayStr || cDate === todayStr;
      })
      .reduce((sum, t) => sum + (t.tokenAmount || 0), 0);
  }, [memberFilteredTokens, todayStr]);

  // Metric card definitions
  const statCards = [
    {
      id: 'stat-total-leads',
      label: selectedMember ? `${selectedMember}'s Leads` : 'Total Leads',
      value: total,
      sub: selectedMember ? `Inquiries assigned to ${selectedMember}` : 'All recorded inquiries',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/80 border-blue-200/60',
      textColor: 'text-blue-900',
      onClick: () => {
        if (selectedMember && onSelectTeamMemberForLeads) {
          onSelectTeamMemberForLeads(selectedMember);
        } else {
          onNavigate('leads');
        }
      },
    },
    {
      id: 'stat-today-followups',
      label: selectedMember ? `${selectedMember}'s Follow-ups` : 'Today Follow-ups',
      value: todayFollowups,
      sub: selectedMember ? `Scheduled today for ${selectedMember}` : 'Scheduled for today',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/80 border-indigo-200/60',
      textColor: 'text-indigo-900',
      onClick: () => onNavigate('followups'),
    },
    {
      id: 'stat-overdue',
      label: 'Overdue',
      value: overdue,
      sub: overdue > 0 ? (selectedMember ? `${overdue} overdue for ${selectedMember}` : 'Requires immediate action') : 'All caught up!',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600" />,
      bg: overdue > 0 ? 'bg-rose-50/90 border-rose-300' : 'bg-slate-50 border-slate-200',
      textColor: overdue > 0 ? 'text-rose-700 font-extrabold' : 'text-slate-800',
      onClick: () => onNavigate('followups'),
    },
    {
      id: 'stat-hot-leads',
      label: selectedMember ? `${selectedMember}'s Hot Leads` : 'Hot Leads',
      value: hot,
      sub: selectedMember ? `High purchase intent for ${selectedMember}` : 'High purchase intent',
      icon: <Flame className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/80 border-amber-200/70',
      textColor: 'text-amber-900',
      onClick: () => {
        if (selectedMember && onSelectTeamMemberForLeads) {
          onSelectTeamMemberForLeads(selectedMember);
        } else {
          onNavigate('leads');
        }
      },
    },
    {
      id: 'stat-site-visits',
      label: selectedMember ? `${selectedMember}'s Site Visits` : 'Site Visits',
      value: todayVisitsCount > 0 ? `${todayVisitsCount} Today` : siteVisits,
      sub:
        todayVisitsCount > 0
          ? `${todayConductedCount} Conducted today • ${memberFilteredVisits.length} total`
          : (selectedMember ? `On-ground visits by ${selectedMember}` : 'On-ground plot visits'),
      icon: <MapPin className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50/80 border-purple-200/70',
      textColor: 'text-purple-900',
      onClick: () => onNavigate('site_visits'),
    },
    {
      id: 'stat-bookings',
      label: 'Bookings/Closed',
      value: `${bookingsClosed} (${bookedGajTotal} Gaj)`,
      sub: selectedMember
        ? `${bookedGajTotal} of ${selectedMemberStats?.targetGaj || 50} Gaj booked`
        : 'Tokens & registered plots',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/80 border-emerald-200/70',
      textColor: 'text-emerald-900',
      onClick: () => onNavigate('reports'),
    },
    {
      id: 'stat-payment-target',
      label: selectedMember ? `${selectedMember}'s Collection` : 'Payment & Collection',
      value:
        todayTokensCollected > 0
          ? `${formatINR(todayTokensCollected, true)} Today`
          : formatINR(totalPaymentCollected, true),
      sub:
        todayTokensCollected > 0
          ? `Total: ${formatINR(totalPaymentCollected, true)} • Click to open ledger`
          : `Target: ${formatINR(totalPaymentTarget, true)} (${paymentPercentAchieved}% done)`,
      icon: <IndianRupee className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/80 border-emerald-300/80 shadow-2xs',
      textColor: 'text-emerald-950 font-black',
      onClick: () => onNavigate('tokens_agreements'),
    },
    {
      id: 'stat-calls-target',
      label: selectedMember ? `${selectedMember}'s Calls` : 'Call Tracker (50/day)',
      value: todayCallsCount > 0 ? `${todayCallsCount} Calls Today` : '50 / day',
      sub: selectedMember
        ? `${activeCalls.length} total calls recorded by ${selectedMember}`
        : (todayCallsCount > 0 ? 'Click to open tracker' : 'Benchmark per executive'),
      icon: <PhoneCall className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50/80 border-sky-200/70',
      textColor: 'text-sky-900',
      onClick: () => onNavigate('calls'),
    },
  ];

  const recentLeads = [...activeLeads].slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Sales & Operations Dashboard</span>
            {isAdmin && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin View</span>
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {selectedMember
              ? `Showing filtered live metrics and leads specifically for ${selectedMember}.`
              : 'Housing Worlds live activity, pipeline health, and real-time lead performance.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenLogModal && (
            <button
              type="button"
              onClick={() => onOpenLogModal()}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('add')}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            + New Lead Entry
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedMember && onSelectTeamMemberForLeads) {
                onSelectTeamMemberForLeads(selectedMember);
              } else {
                onNavigate('leads');
              }
            }}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
          >
            <span>{selectedMember ? `View ${selectedMember}'s Leads` : 'View All Leads'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN TEAM MEMBERS SELECTOR & INSPECTION LIST (केवल एडमिन के लिए)           */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                  <Crown className="w-4 h-4" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  टीम मेंबर्स अवलोकन (Team Members List & Inspection)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {allTeamMembers.length} Executives
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                जिस टीम मेंबर की डिटेल देखना चाहते हैं, उस पर क्लिक करें। पूरा डैशबोर्ड उसी मेंबर के हिसाब से अपडेट हो जाएगा।
              </p>
            </div>

            {/* Quick search input if team has multiple members */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="टीम मेंबर सर्च करें..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {memberSearchTerm && (
                <button
                  type="button"
                  onClick={() => setMemberSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Grid of Team Member Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* "All Team" Card */}
            <div
              onClick={() => setSelectedMember(null)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedMember === null
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    selectedMember === null ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                {selectedMember === null && (
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">पूरी टीम (All Team)</div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    selectedMember === null ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {leads.length} Leads • Total
                </div>
              </div>
            </div>

            {/* Individual Team Members Cards */}
            {filteredTeamMembers.map((m) => {
              const isSelected =
                selectedMember?.toLowerCase() === m.name.toLowerCase();

              return (
                <div
                  key={m.name}
                  onClick={() => setSelectedMember(m.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between hover:shadow-sm ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-white hover:border-slate-300 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs ${
                          m.userMeta?.avatarColor || 'bg-blue-600'
                        }`}
                      >
                        {m.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      {isSelected ? (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {m.leadsCount} L
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {m.userMeta?.designation || 'Sales Executive'}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold ${
                        m.overdueFollowups > 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {m.overdueFollowups > 0
                        ? `${m.overdueFollowups} Due`
                        : `${m.todayFollowups} Today`}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatINR(m.paymentCollected, true)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{m.bookedGaj} Gaj</span>
                    <span>{m.paymentPercent}% Pay</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Focused Member Profile Banner (when a specific member is selected) */}
          {selectedMember && selectedMemberStats && (
            <div className="mt-4 p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 rounded-xl border border-blue-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0 ${
                    selectedMemberStats.userMeta?.avatarColor || 'bg-blue-600'
                  }`}
                >
                  {selectedMember
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900">
                      {selectedMember}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-200/60 text-blue-800">
                      {selectedMemberStats.userMeta?.designation || 'Sales Executive'}
                    </span>
                    {selectedMemberStats.userMeta?.mobile && (
                      <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-600" />
                        +91 {selectedMemberStats.userMeta.mobile}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                    <span>
                      📋 <strong>{selectedMemberStats.leadsCount} Leads</strong>
                    </span>
                    <span>•</span>
                    <span
                      className={
                        selectedMemberStats.overdueFollowups > 0
                          ? 'text-rose-600 font-bold'
                          : 'text-slate-600'
                      }
                    >
                      ⏰ {selectedMemberStats.todayFollowups} Today (
                      {selectedMemberStats.overdueFollowups} Overdue)
                    </span>
                    <span>•</span>
                    <span>
                      🏆 <strong>{selectedMemberStats.bookedGaj}</strong> /{' '}
                      {selectedMemberStats.targetGaj} Gaj ({selectedMemberStats.percentAchieved}% Quota)
                    </span>
                    <span>•</span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-emerald-600" />
                      <span>
                        पेमेंट: <strong>{formatINR(selectedMemberStats.paymentCollected, true)}</strong> /{' '}
                        {formatINR(selectedMemberStats.paymentTarget, true)} ({selectedMemberStats.paymentPercent}%)
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      📞 <strong>{selectedMemberStats.callsCount}</strong> Calls logged
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for selected member */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {selectedMemberStats.userMeta?.mobile && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          selectedMemberStats.userMeta!.mobile,
                          `नमस्ते ${selectedMember} जी, Housing Worlds Admin Dashboard से। आपकी लीड्स और फॉलो-अप्स का स्टेटस जानने के लिए संपर्क किया।`
                        )
                      }
                      className="p-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="WhatsApp Executive"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => makePhoneCall(selectedMemberStats.userMeta!.mobile)}
                      className="p-2 text-blue-700 bg-blue-100 hover:bg-blue-200/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Call Executive"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingMemberModal(selectedMember)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>पूरी डिटेल देखें (Full Detail)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectTeamMemberForLeads) {
                      onSelectTeamMemberForLeads(selectedMember);
                    } else {
                      onNavigate('leads');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  View All Leads ({selectedMemberStats.leadsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Clear filter and view all team"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>पूरी टीम</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8 Primary Cards Grid (4 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div id="cards" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((c) => (
          <div
            key={c.id}
            id={c.id}
            onClick={c.onClick}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${c.bg}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <small className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate pr-1">
                {c.label}
              </small>
              <div className="p-1.5 rounded-lg bg-white/80 shadow-xs shrink-0">{c.icon}</div>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${c.textColor}`}>
              {c.value}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily Activity Tracker: Per Day Visits & Payments Live Ledger */}
      <DailyActivityTracker
        siteVisits={siteVisitsList}
        tokensAgreements={tokensAgreementsList}
        leads={activeLeads}
        calls={activeCalls}
        selectedMember={selectedMember}
        currentUser={currentUser}
        onNavigate={onNavigate}
        onViewLeadDetail={onViewLeadDetail}
      />

      {/* Recent Leads Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {selectedMember ? `Recent Leads for ${selectedMember}` : 'Recent Leads'}
            </h3>
            {selectedMember && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                Filtered
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedMember && (
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Clear filter
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (selectedMember && onSelectTeamMemberForLeads) {
                  onSelectTeamMemberForLeads(selectedMember);
                } else {
                  onNavigate('leads');
                }
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              See all ({activeLeads.length}) &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody id="recent" className="divide-y divide-slate-100 text-slate-700">
              {recentLeads.length > 0 ? (
                recentLeads.map((l) => {
                  const timing = getFollowupTiming(l.followup, l.status);
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewLeadDetail(l)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{l.name}</span>
                          {l.priority === 'Hot' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {l.mobile} {l.size ? `• ${l.size}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {l.project || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            l.status === 'Booking' || l.status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : l.status === 'Site Visit'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : l.status === 'Negotiation'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : l.status === 'Lost'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs ${
                            timing === 'overdue'
                              ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded'
                              : timing === 'today'
                              ? 'text-amber-700 font-semibold'
                              : 'text-slate-600'
                          }`}
                        >
                          {fmt(l.followup)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {l.salesperson || 'Unassigned'}
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                l.mobile,
                                `नमस्ते ${l.name} जी, Housing Worlds से ${l.salesperson || 'टीम'}। ${l.project ? `प्रोजेक्ट ${l.project}` : ''} के बारे में बातचीत करने हेतु संपर्क किया।`
                              )
                            }
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => makePhoneCall(l.mobile)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                            title="Call customer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditLead(l.id)}
                            className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {selectedMember
                      ? `${selectedMember} के लिए कोई लीड्स नहीं मिलीं।`
                      : 'No recent leads found. Click "+ Add Lead" to create your first inquiry.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Team Member Inspection Modal */}
      {inspectingMemberModal && (
        <TeamMemberDetailModal
          isOpen={true}
          onClose={() => setInspectingMemberModal(null)}
          memberName={inspectingMemberModal}
          memberUser={(users || []).find(
            (u) => u.name.toLowerCase() === inspectingMemberModal.toLowerCase()
          )}
          leads={leads}
          calls={calls}
          onViewLeadDetail={onViewLeadDetail}
          onNavigateToLeads={(mName) => {
            setInspectingMemberModal(null);
            if (onSelectTeamMemberForLeads) {
              onSelectTeamMemberForLeads(mName);
            } else {
              onNavigate('leads');
            }
          }}
          onOpenLogModal={onOpenLogModal}
        />
      )}
    </div>
  );
};
