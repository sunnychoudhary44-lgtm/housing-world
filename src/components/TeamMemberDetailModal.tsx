import React from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Calendar,
  AlertTriangle,
  Flame,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  User,
  Shield,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import { Lead, CallLog, AuthUser } from '../types';
import { TEAM_TARGETS } from '../data/initialData';
import { fmt, parseGaj, openWhatsApp, makePhoneCall, getFollowupTiming } from '../utils/formatters';

interface TeamMemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberUser?: AuthUser;
  leads: Lead[];
  calls: CallLog[];
  onViewLeadDetail: (lead: Lead) => void;
  onNavigateToLeads: (memberName: string) => void;
  onOpenLogModal?: (lead?: Lead | null) => void;
}

export const TeamMemberDetailModal: React.FC<TeamMemberDetailModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberUser,
  leads,
  calls,
  onViewLeadDetail,
  onNavigateToLeads,
  onOpenLogModal,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 16);

  // Filter member-specific data
  const memberLeads = leads.filter(
    (l) => (l.salesperson || '').trim().toLowerCase() === memberName.trim().toLowerCase()
  );

  const memberCalls = calls.filter(
    (c) => (c.salesperson || '').trim().toLowerCase() === memberName.trim().toLowerCase()
  );

  const totalLeads = memberLeads.length;
  const hotLeads = memberLeads.filter((l) => l.priority === 'Hot').length;
  const todayFollowups = memberLeads.filter(
    (l) => l.followup && l.followup.slice(0, 10) === todayStr
  );
  const overdueFollowups = memberLeads.filter(
    (l) =>
      l.followup &&
      l.followup < nowIso &&
      !['Booking', 'Closed', 'Lost'].includes(l.status)
  );
  const siteVisits = memberLeads.filter((l) => l.status === 'Site Visit').length;
  const bookings = memberLeads.filter(
    (l) => l.status === 'Booking' || l.status === 'Closed'
  );

  const bookedGaj = bookings.reduce((sum, l) => sum + parseGaj(l.size), 0);
  const targetGaj = TEAM_TARGETS[memberName] || 50;
  const percentAchieved = Math.round((bookedGaj / targetGaj) * 100);

  const todayCallsCount = memberCalls.filter(
    (c) => c.timestamp.slice(0, 10) === todayStr
  ).length;

  // Pipeline breakdown
  const statusCounts: Record<string, number> = {
    New: 0,
    Contacted: 0,
    Interested: 0,
    'Follow-up': 0,
    'Site Visit': 0,
    Negotiation: 0,
    Booking: 0,
    Closed: 0,
    Lost: 0,
  };

  memberLeads.forEach((l) => {
    if (statusCounts[l.status] !== undefined) {
      statusCounts[l.status]++;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                memberUser?.avatarColor || 'bg-blue-600'
              }`}
            >
              {memberName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {memberName}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {memberUser?.designation || 'Sales Executive'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                {memberUser?.mobile && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-blue-400" />
                    +91 {memberUser.mobile}
                  </span>
                )}
                <span>•</span>
                <span>{totalLeads} Total Assigned Leads</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {memberUser?.mobile && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      memberUser.mobile,
                      `नमस्ते ${memberName} जी, Housing Worlds Admin Dashboard से। आपकी लीड्स और फॉलो-अप्स का रिव्यू करने के लिए संपर्क किया।`
                    )
                  }
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="WhatsApp Team Member"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => makePhoneCall(memberUser.mobile)}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Call Team Member"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Call</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Total Leads
              </span>
              <div className="text-2xl font-black text-blue-950 mt-1">{totalLeads}</div>
              <p className="text-[11px] text-blue-700/80 mt-0.5">Assigned inquiries</p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Hot Leads
              </span>
              <div className="text-2xl font-black text-amber-950 mt-1">{hotLeads}</div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">High conversion chance</p>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Pending Follow-ups
              </span>
              <div className="text-2xl font-black text-rose-950 mt-1">
                {todayFollowups.length}{' '}
                {overdueFollowups.length > 0 && (
                  <span className="text-sm font-bold text-rose-600">
                    ({overdueFollowups.length} Overdue)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-rose-700/80 mt-0.5">Scheduled calls</p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Gaj Quota Status
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {bookedGaj} <span className="text-xs font-bold text-slate-500">/ {targetGaj} Gaj</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">{percentAchieved}% of monthly target</p>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Monthly Plot Sales Quota ({targetGaj} Gaj Benchmark)</span>
              </div>
              <span className="font-bold text-blue-700">{percentAchieved}% Achieved</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentAchieved >= 100
                    ? 'bg-emerald-500'
                    : percentAchieved >= 60
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(percentAchieved, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0 Gaj</span>
              <span>{bookedGaj} Gaj Booked & Closed</span>
              <span>Target: {targetGaj} Gaj</span>
            </div>
          </div>

          {/* Pipeline Stage Distribution */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <span>Lead Pipeline Distribution ({memberName})</span>
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {Object.entries(statusCounts).map(([st, cnt]) => (
                <div
                  key={st}
                  className="bg-white p-2.5 rounded-lg border border-slate-200 text-center shadow-2xs"
                >
                  <div className="text-[11px] text-slate-500 truncate">{st}</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{cnt}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending / Overdue Follow-ups Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Pending Follow-ups for {memberName} ({todayFollowups.length + overdueFollowups.length})</span>
              </h4>
            </div>

            {todayFollowups.length > 0 || overdueFollowups.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {[...overdueFollowups, ...todayFollowups].map((lead) => {
                  const timing = getFollowupTiming(lead.followup, lead.status);
                  return (
                    <div
                      key={lead.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {lead.name}
                          </span>
                          {lead.priority === 'Hot' && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded">
                              HOT
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-mono">
                            {lead.mobile}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{lead.project || 'Plot Inquiry'}</span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              timing === 'overdue' ? 'text-rose-600' : 'text-amber-700'
                            }`}
                          >
                            Due: {fmt(lead.followup)} ({timing.toUpperCase()})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              lead.mobile,
                              `नमस्ते ${lead.name} जी, Housing Worlds से ${lead.salesperson}। ${lead.project ? `प्रोजेक्ट ${lead.project}` : ''} के सिलसिले में संपर्क कर रहे हैं।`
                            )
                          }
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => makePhoneCall(lead.mobile)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                          title="Call"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewLeadDetail(lead)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                {memberName} का कोई ओवरड्यू या आज का पेंडिंग फॉलो-अप नहीं है। सभी अप-टू-डेट हैं!
              </div>
            )}
          </div>

          {/* Calls Logged by this executive */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-sky-600" />
              <span>Calls Logged by {memberName} ({memberCalls.length} Total • {todayCallsCount} Today)</span>
            </h4>

            {memberCalls.length > 0 ? (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {memberCalls.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{call.leadName}</span>{' '}
                      <span className="text-slate-400 font-mono">({call.leadMobile})</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {fmt(call.timestamp)} • Duration: {call.durationSeconds || 0}s
                        {call.notes ? ` • Note: ${call.notes}` : ''}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      {call.outcome}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                अभी तक {memberName} द्वारा कोई कॉल लॉग नहीं की गई है।
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            Viewing live data for <strong className="text-slate-800">{memberName}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToLeads(memberName);
              }}
              className="px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-100/80 hover:bg-blue-200/80 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View All {totalLeads} Leads of {memberName}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
