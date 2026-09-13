import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Receipt,
  Building,
  Phone,
  MessageCircle,
  CalendarCheck2,
  FileCheck2,
  TrendingUp,
  User,
  Star,
  Plus,
} from 'lucide-react';
import { ActivePage, Lead, CallLog, AuthUser, SiteVisit, TokenAgreement } from '../types';
import {
  formatINR,
  fmt,
  openWhatsApp,
  makePhoneCall,
  getLeadPaymentReceived,
} from '../utils/formatters';

interface DailyActivityTrackerProps {
  siteVisits?: SiteVisit[];
  tokensAgreements?: TokenAgreement[];
  leads?: Lead[];
  calls?: CallLog[];
  selectedMember: string | null;
  currentUser?: AuthUser | null;
  onNavigate: (page: ActivePage) => void;
  onViewLeadDetail?: (lead: Lead) => void;
}

// Helper to get local YYYY-MM-DD string
const getLocalYMD = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to format date in readable Indian style (e.g., "13 Sep 2026, रविवार")
const formatDisplayDate = (ymd: string): string => {
  try {
    const [year, month, day] = ymd.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      weekday: 'short',
    };
    return date.toLocaleDateString('hi-IN', options);
  } catch (e) {
    return ymd;
  }
};

export const DailyActivityTracker: React.FC<DailyActivityTrackerProps> = ({
  siteVisits = [],
  tokensAgreements = [],
  leads = [],
  calls = [],
  selectedMember,
  currentUser,
  onNavigate,
  onViewLeadDetail,
}) => {
  const todayYMD = useMemo(() => getLocalYMD(), []);
  const yesterdayYMD = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalYMD(d);
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [activeTab, setActiveTab] = useState<'visits' | 'payments' | 'trend'>('visits');

  // Filter site visits by executive if selectedMember is active
  const memberFilteredVisits = useMemo(() => {
    if (!selectedMember) return siteVisits;
    const q = selectedMember.toLowerCase().trim();
    return siteVisits.filter(
      (v) =>
        (v.salesExecutive && v.salesExecutive.toLowerCase().trim() === q) ||
        (v.telecaller && v.telecaller.toLowerCase().trim() === q)
    );
  }, [siteVisits, selectedMember]);

  // Filter tokens and agreements by executive if selectedMember is active
  const memberFilteredTokens = useMemo(() => {
    if (!selectedMember) return tokensAgreements;
    const q = selectedMember.toLowerCase().trim();
    return tokensAgreements.filter(
      (t) => t.executiveName && t.executiveName.toLowerCase().trim() === q
    );
  }, [tokensAgreements, selectedMember]);

  // Filter calls by executive
  const memberFilteredCalls = useMemo(() => {
    if (!selectedMember) return calls;
    const q = selectedMember.toLowerCase().trim();
    return calls.filter(
      (c) => c.salesperson && c.salesperson.toLowerCase().trim() === q
    );
  }, [calls, selectedMember]);

  // Visits matching the selected date (either scheduled or conducted on this date)
  const visitsForDate = useMemo(() => {
    return memberFilteredVisits.filter((v) => {
      const scheduledDate = v.scheduledTime ? v.scheduledTime.slice(0, 10) : '';
      const conductedDate = v.conductedTime ? v.conductedTime.slice(0, 10) : '';
      return scheduledDate === selectedDate || conductedDate === selectedDate;
    });
  }, [memberFilteredVisits, selectedDate]);

  // Payments / Tokens matching the selected date
  const paymentsForDate = useMemo(() => {
    const tokens = memberFilteredTokens.filter((t) => {
      const pDate = t.paymentDate ? t.paymentDate.slice(0, 10) : '';
      const cDate = t.createdAt ? t.createdAt.slice(0, 10) : '';
      return pDate === selectedDate || cDate === selectedDate;
    });

    // Also check if any leads have payment received recorded on this date and not already in tokens
    const leadPayments = leads.filter((l) => {
      if (selectedMember && l.salesperson?.toLowerCase().trim() !== selectedMember.toLowerCase().trim()) {
        return false;
      }
      const pAmt = getLeadPaymentReceived(l);
      if (pAmt <= 0) return false;
      const lDate = l.updatedAt ? l.updatedAt.slice(0, 10) : (l.createdAt ? l.createdAt.slice(0, 10) : '');
      if (lDate !== selectedDate) return false;
      // Exclude if already matched in tokens
      const alreadyInTokens = tokens.some(
        (t) => t.leadId === l.id || t.clientName.toLowerCase() === l.name.toLowerCase()
      );
      return !alreadyInTokens;
    });

    return { tokens, leadPayments };
  }, [memberFilteredTokens, leads, selectedDate, selectedMember]);

  // Calls matching selected date
  const callsForDate = useMemo(() => {
    return memberFilteredCalls.filter((c) => c.timestamp && c.timestamp.slice(0, 10) === selectedDate);
  }, [memberFilteredCalls, selectedDate]);

  // Calculations for selected date
  const totalVisitsCount = visitsForDate.length;
  const conductedVisitsCount = visitsForDate.filter((v) => v.status === 'Conducted').length;
  const scheduledVisitsCount = visitsForDate.filter((v) => v.status === 'Scheduled').length;
  const rescheduledVisitsCount = visitsForDate.filter(
    (v) => v.status === 'Rescheduled' || v.status === 'Cancelled' || v.status === 'No Show'
  ).length;

  const totalTokensAmount = paymentsForDate.tokens.reduce((acc, t) => acc + (t.tokenAmount || 0), 0);
  const totalLeadPaymentAmount = paymentsForDate.leadPayments.reduce(
    (acc, l) => acc + getLeadPaymentReceived(l),
    0
  );
  const totalDayPaymentCollected = totalTokensAmount + totalLeadPaymentAmount;

  const totalDealValueGenerated = paymentsForDate.tokens.reduce(
    (acc, t) => acc + (t.totalDealValue || 0),
    0
  );

  // Past 7 Days matrix data for trend tab
  const past7DaysData = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ymd = getLocalYMD(d);

      const dVisits = memberFilteredVisits.filter((v) => {
        const s = v.scheduledTime ? v.scheduledTime.slice(0, 10) : '';
        const c = v.conductedTime ? v.conductedTime.slice(0, 10) : '';
        return s === ymd || c === ymd;
      });

      const dConducted = dVisits.filter((v) => v.status === 'Conducted').length;
      const dScheduled = dVisits.filter((v) => v.status === 'Scheduled').length;

      const dTokens = memberFilteredTokens.filter((t) => {
        const p = t.paymentDate ? t.paymentDate.slice(0, 10) : '';
        const c = t.createdAt ? t.createdAt.slice(0, 10) : '';
        return p === ymd || c === ymd;
      });
      const dPay = dTokens.reduce((sum, t) => sum + (t.tokenAmount || 0), 0);

      const dCalls = memberFilteredCalls.filter((c) => c.timestamp && c.timestamp.slice(0, 10) === ymd).length;

      list.push({
        ymd,
        label: i === 0 ? 'आज (Today)' : i === 1 ? 'कल (Yesterday)' : formatDisplayDate(ymd),
        visitsTotal: dVisits.length,
        visitsConducted: dConducted,
        visitsScheduled: dScheduled,
        paymentAmount: dPay,
        tokensCount: dTokens.length,
        callsCount: dCalls,
        isToday: i === 0,
      });
    }
    return list;
  }, [memberFilteredVisits, memberFilteredTokens, memberFilteredCalls]);

  // Stepper handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(getLocalYMD(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDate(getLocalYMD(date));
  };

  const isSelectedToday = selectedDate === todayYMD;
  const isSelectedYesterday = selectedDate === yesterdayYMD;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CalendarCheck2 className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                प्रतिदिन विज़िट एवं पेमेंट ट्रैकर (Daily Visits & Collections)
              </h3>
              {selectedMember && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>फ़िल्टर: {selectedMember}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              चयनित दिन की सभी ऑन-ग्राउंड साइट विज़िट्स और प्राप्त टोकन / सेल एग्रीमेंट भुगतानों का सीधा लेखा-जोखा।
            </p>
          </div>

          {/* Date Selector Controls */}
          <div className="flex items-center gap-2 flex-wrap bg-white/10 p-1.5 rounded-xl backdrop-blur-xs border border-white/10">
            {/* Quick buttons */}
            <button
              type="button"
              onClick={() => setSelectedDate(todayYMD)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isSelectedToday
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              आज (Today)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayYMD)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isSelectedYesterday
                  ? 'bg-indigo-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              कल (Yesterday)
            </button>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1 pl-1 border-l border-white/20">
              <button
                type="button"
                onClick={handlePrevDay}
                title="पिछला दिन (Previous Day)"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="text-xs font-mono font-bold bg-white text-slate-900 px-2 py-1 rounded-lg border border-slate-300 focus:outline-hidden cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                title="अगला दिन (Next Day)"
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Date Metric Highlight Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Daily Visits Highlight */}
          <div
            onClick={() => setActiveTab('visits')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'visits'
                ? 'bg-white/20 border-emerald-400/60 ring-2 ring-emerald-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>दैनिक विज़िट्स (Visits)</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {totalVisitsCount}{' '}
              <span className="text-xs font-normal text-slate-300">विज़िट्स</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
              <span className="text-emerald-300 font-bold">{conductedVisitsCount} संपन्न</span>
              <span>•</span>
              <span className="text-sky-300 font-bold">{scheduledVisitsCount} शेड्यूल्ड</span>
              {rescheduledVisitsCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-300">{rescheduledVisitsCount} अन्य</span>
                </>
              )}
            </div>
          </div>

          {/* Daily Payment Highlight */}
          <div
            onClick={() => setActiveTab('payments')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white/20 border-amber-400/60 ring-2 ring-amber-400/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                <span>दैनिक कलेक्शन (Payments)</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {paymentsForDate.tokens.length + paymentsForDate.leadPayments.length} रसीदें
              </span>
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {formatINR(totalDayPaymentCollected, true)}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {totalDealValueGenerated > 0 ? (
                <span>डील वैल्यू: {formatINR(totalDealValueGenerated, true)}</span>
              ) : (
                <span>टोकन एवं बयाना राशि</span>
              )}
            </div>
          </div>

          {/* Daily Calls Highlight */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>दैनिक कॉल्स (Calls Logged)</span>
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300">
                Target: 50
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {callsForDate.length}{' '}
              <span className="text-xs font-normal text-slate-300">कॉल्स</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              कॉल ट्रैकर से लॉग की गई कॉल्स
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-xs text-slate-300 font-medium">त्वरित क्रिया (Quick Actions)</span>
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => onNavigate('site_visits')}
                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
              >
                + विज़िट शेड्यूल
              </button>
              <button
                type="button"
                onClick={() => onNavigate('tokens_agreements')}
                className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
              >
                + टोकन रसीद
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'visits'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>दैनिक साइट विज़िट्स (Site Visits)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                totalVisitsCount > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totalVisitsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <IndianRupee className="w-4 h-4 text-amber-600" />
            <span>दैनिक पेमेंट्स व टोकन (Payments)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                totalDayPaymentCollected > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {formatINR(totalDayPaymentCollected, true)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'trend'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>7-दिन का दैनिक सारांश (7-Day Matrix)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium py-2">
          तारीख: <strong>{formatDisplayDate(selectedDate)}</strong>
        </div>
      </div>

      {/* Tab 1: Daily Site Visits List */}
      {activeTab === 'visits' && (
        <div className="p-4 sm:p-5">
          {visitsForDate.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>
                  इस दिन कुल <strong>{visitsForDate.length}</strong> विज़िट्स निर्धारित/संपन्न हैं:
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('site_visits')}
                  className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>विज़िट हब खोलें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {visitsForDate.map((v) => {
                  const isConducted = v.status === 'Conducted';
                  const isScheduled = v.status === 'Scheduled';
                  const timeSlot = v.scheduledTime
                    ? v.scheduledTime.includes('T')
                      ? v.scheduledTime.split('T')[1].slice(0, 5)
                      : v.scheduledTime.slice(11, 16)
                    : '11:00';

                  return (
                    <div
                      key={v.id}
                      className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                        isConducted
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isScheduled
                          ? 'bg-blue-50/30 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {v.leadName}
                            </span>
                            {v.passCode && (
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                {v.passCode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800">{v.projectName}</span>
                            {v.developerName && (
                              <span className="text-slate-400">({v.developerName})</span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
                            isConducted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isScheduled
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isConducted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{v.status}</span>
                        </span>
                      </div>

                      {/* Timing, Executive & Cab info */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-slate-200/80 bg-white/70 px-3 rounded-lg">
                        <div>
                          <span className="text-slate-400 block text-[10px]">समय स्लॉट (Time):</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{timeSlot || '11:00 AM'}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">
                            सेल्स एग्जीक्यूटिव (Executive):
                          </span>
                          <span className="font-bold text-slate-800 truncate block">
                            {v.salesExecutive || 'Unassigned'}
                          </span>
                        </div>

                        {v.pickupRequired && (
                          <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center gap-1 text-slate-700 text-[11px]">
                            <Car className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              कैब पिकअप:{' '}
                              <strong>{v.cabAssigned || 'Cab Assigned'}</strong> •{' '}
                              {v.pickupAddress || 'Customer Address'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Feedback if conducted */}
                      {v.feedbackCategory && (
                        <div className="mb-2 text-xs bg-emerald-100/60 p-2 rounded-md text-emerald-950 border border-emerald-200/60">
                          <div className="flex items-center gap-1 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{v.feedbackCategory}</span>
                            {v.ratingStars && <span>• {v.ratingStars}★</span>}
                          </div>
                          {v.feedbackNotes && (
                            <p className="text-[11px] text-emerald-800 mt-0.5 line-clamp-2">
                              {v.feedbackNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quick Communication Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-500 font-mono">{v.leadMobile}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                v.leadMobile,
                                `नमस्ते ${v.leadName} जी, Housing Worlds से ${v.salesExecutive || 'टीम'}। ${v.projectName} की साइट विज़िट के संबंध में संपर्क किया। क्या आप नियत समय पर उपलब्ध हैं?`
                              )
                            }
                            className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="WhatsApp Chat"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px]">WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => makePhoneCall(v.leadMobile)}
                            className="p-1.5 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-[11px]">कॉल</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800">
                तारीख {formatDisplayDate(selectedDate)} को कोई साइट विज़िट दर्ज नहीं है
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                इस तारीख के लिए कोई साइट विज़िट शेड्यूल या संपन्न नहीं है। आप सीधे नयी साइट विज़िट बुक कर सकते हैं।
              </p>
              <button
                type="button"
                onClick={() => onNavigate('site_visits')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ नयी साइट विज़िट शेड्यूल करें</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Daily Payments & Tokens List */}
      {activeTab === 'payments' && (
        <div className="p-4 sm:p-5">
          {paymentsForDate.tokens.length > 0 || paymentsForDate.leadPayments.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>
                  इस दिन कुल <strong>{formatINR(totalDayPaymentCollected, true)}</strong> का कलेक्शन (
                  {paymentsForDate.tokens.length + paymentsForDate.leadPayments.length} ट्रांजैक्शन):
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('tokens_agreements')}
                  className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>टोकन व एग्रीमेंट्स खोलें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {paymentsForDate.tokens.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {t.clientName}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            {t.receiptNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800">{t.projectName}</span>
                          <span className="text-slate-500">• Unit: {t.unitNumber}</span>
                        </div>
                      </div>

                      {/* Payment Amount Badge */}
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-emerald-700">
                          {formatINR(t.tokenAmount)}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t.paymentMode}
                        </span>
                      </div>
                    </div>

                    {/* Financial details row */}
                    <div className="grid grid-cols-3 gap-2 text-xs py-2 my-2 border-y border-amber-200/60 bg-white/80 px-3 rounded-lg">
                      <div>
                        <span className="text-slate-400 block text-[10px]">प्रकार (Deal Type):</span>
                        <span className="font-bold text-slate-800 text-[11px] truncate block">
                          {t.dealType}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">कुल डील वैल्यू:</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {formatINR(t.totalDealValue, true)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">बकाया राशि:</span>
                        <span className="font-bold text-rose-700 text-[11px]">
                          {formatINR(t.balanceDue, true)}
                        </span>
                      </div>
                    </div>

                    {/* Executive & Transaction Ref */}
                    <div className="text-xs text-slate-600 flex items-center justify-between flex-wrap gap-1 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>क्लोजर: <strong>{t.executiveName}</strong></span>
                      </span>
                      {t.transactionRef && (
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Ref: {t.transactionRef}
                        </span>
                      )}
                    </div>

                    {/* Quick WhatsApp Receipt & Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs font-mono text-slate-500">{t.clientMobile}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              t.clientMobile,
                              `नमस्ते ${t.clientName} जी, Housing Worlds से आधिकारिक टोकन रसीद: ${t.receiptNumber}। परियोजना: ${t.projectName} (${t.unitNumber})। भुगतान राशि: ${formatINR(t.tokenAmount)} प्राप्त हुई। बहुत-बहुत बधाई!`
                            )
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>रसीद शेयर करें</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('tokens_agreements')}
                          className="px-2 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          विवरण
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Additional lead payments matching this date */}
                {paymentsForDate.leadPayments.map((lp) => (
                  <div
                    key={`lp-${lp.id}`}
                    className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {lp.name}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{lp.project || 'Project Booking'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-black text-emerald-700">
                          {formatINR(getLeadPaymentReceived(lp))}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Lead Token
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-200">
                      <span>सेल्सपर्सन: <strong>{lp.salesperson}</strong></span>
                      <button
                        type="button"
                        onClick={() => onViewLeadDetail && onViewLeadDetail(lp)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        लीड विवरण देखें &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <IndianRupee className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800">
                तारीख {formatDisplayDate(selectedDate)} को कोई टोकन या पेमेंट रिकॉर्ड नहीं है
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                इस तारीख के लिए कोई भुगतान अथवा बयाना राशि दर्ज नहीं है। आप नया टोकन या सेल एग्रीमेंट रसीद अभी दर्ज कर सकते हैं।
              </p>
              <button
                type="button"
                onClick={() => onNavigate('tokens_agreements')}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ नया टोकन / पेमेंट रसीद दर्ज करें</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: 7-Day Trend Matrix Table */}
      {activeTab === 'trend' && (
        <div className="p-4 sm:p-5">
          <div className="text-xs text-slate-500 mb-3 flex items-center justify-between">
            <span>विगत 7 दिनों का दिन-प्रतिदिन विज़िट्स एवं पेमेंट कलेक्शन विश्लेषण:</span>
            <span className="text-[11px] text-slate-400">
              किसी भी तारीख के कार्ड पर क्लिक करके उसका विस्तृत विवरण देखें
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-4">तारीख (Date)</th>
                  <th className="py-2.5 px-4 text-center">साइट विज़िट्स (Visits)</th>
                  <th className="py-2.5 px-4 text-right">कलेक्शन (Payment ₹)</th>
                  <th className="py-2.5 px-4 text-center">लॉग कॉल्स (Calls)</th>
                  <th className="py-2.5 px-4 text-right">क्रिया (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {past7DaysData.map((row) => {
                  const isCurrent = row.ymd === selectedDate;
                  return (
                    <tr
                      key={row.ymd}
                      onClick={() => {
                        setSelectedDate(row.ymd);
                        setActiveTab('visits');
                      }}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-indigo-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{row.label}</span>
                          {row.isToday && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              आज
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                              चयनित
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal font-mono">
                          {row.ymd}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs ${
                            row.visitsTotal > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{row.visitsTotal} Visits</span>
                        </span>
                        {row.visitsConducted > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            ({row.visitsConducted} संपन्न)
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-black">
                        <span
                          className={
                            row.paymentAmount > 0 ? 'text-amber-700' : 'text-slate-400'
                          }
                        >
                          {formatINR(row.paymentAmount)}
                        </span>
                        {row.tokensCount > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {row.tokensCount} रसीदें
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center text-slate-700 font-medium">
                        {row.callsCount} कॉल्स
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(row.ymd);
                            setActiveTab('visits');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                        >
                          विवरण देखें
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
