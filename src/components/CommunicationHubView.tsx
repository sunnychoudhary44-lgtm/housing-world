import React, { useState, useMemo } from 'react';
import {
  CallLog,
  CallOutcome,
  CallType,
  Lead,
  SiteVisit,
  TokenAgreement,
  CrmTask,
  WhatsAppTemplate,
  AuthUser,
} from '../types';
import { formatINR } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import { WHATSAPP_TEMPLATES } from '../data/initialData';
import {
  PhoneCall,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageSquare,
  Activity,
  Calendar,
  Clock,
  Search,
  Plus,
  Send,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  MapPin,
  Flame,
  Copy,
  Check,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface CommunicationHubViewProps {
  calls: CallLog[];
  leads: Lead[];
  siteVisits: SiteVisit[];
  tokensAgreements: TokenAgreement[];
  tasks: CrmTask[];
  currentUser?: AuthUser | null;
  isAdmin: boolean;
  onOpenLogModal: (lead?: Lead) => void;
  onDeleteCall?: (callId: string) => void;
  onViewLeadDetail?: (lead: Lead) => void;
  onNavigate?: (page: any) => void;
}

export const CommunicationHubView: React.FC<CommunicationHubViewProps> = ({
  calls,
  leads,
  siteVisits,
  tokensAgreements,
  tasks,
  currentUser,
  isAdmin,
  onOpenLogModal,
  onDeleteCall,
  onViewLeadDetail,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'calls' | 'whatsapp' | 'activity'>('calls');
  const [callSearchTerm, setCallSearchTerm] = useState('');
  const [callOutcomeFilter, setCallOutcomeFilter] = useState<string>('all');
  const [callSalespersonFilter, setCallSalespersonFilter] = useState<string>('all');

  // WhatsApp Tab State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [customMobile, setCustomMobile] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    WHATSAPP_TEMPLATES[0]?.id || ''
  );
  const [customMessage, setCustomMessage] = useState(WHATSAPP_TEMPLATES[0]?.message || '');
  const [copied, setCopied] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered Calls
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      if (!isAdmin && currentUser?.name) {
        if (c.salesperson.toLowerCase() !== currentUser.name.toLowerCase()) {
          return false;
        }
      }
      if (callSalespersonFilter !== 'all' && c.salesperson !== callSalespersonFilter) {
        return false;
      }
      if (callOutcomeFilter !== 'all' && c.outcome !== callOutcomeFilter) {
        return false;
      }
      if (callSearchTerm.trim()) {
        const q = callSearchTerm.toLowerCase();
        const matchName = c.leadName.toLowerCase().includes(q);
        const matchMobile = c.mobile.includes(q);
        const matchProject = (c.project || '').toLowerCase().includes(q);
        const matchNotes = (c.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchMobile && !matchProject && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [calls, isAdmin, currentUser, callSalespersonFilter, callOutcomeFilter, callSearchTerm]);

  // Unique salespersons from calls
  const allSalespersons = useMemo(() => {
    const set = new Set<string>();
    calls.forEach((c) => c.salesperson && set.add(c.salesperson));
    leads.forEach((l) => l.salesperson && set.add(l.salesperson));
    if (currentUser?.name) set.add(currentUser.name);
    return Array.from(set).sort();
  }, [calls, leads, currentUser]);

  // Call stats
  const callStats = useMemo(() => {
    const todayCalls = calls.filter((c) => c.timestamp.slice(0, 10) === todayStr);
    const connected = calls.filter((c) => c.outcome.startsWith('Connected')).length;
    const visitsBooked = calls.filter((c) =>
      c.outcome.includes('Site Visit Scheduled')
    ).length;
    const totalDurationSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0);
    const avgDurationSeconds = calls.length > 0 ? Math.round(totalDurationSeconds / calls.length) : 0;

    return {
      total: calls.length,
      today: todayCalls.length,
      connected,
      connectedRate: calls.length > 0 ? Math.round((connected / calls.length) * 100) : 0,
      visitsBooked,
      totalMinutes: Math.round(totalDurationSeconds / 60),
      avgMinutes: Math.round(avgDurationSeconds / 60),
    };
  }, [calls, todayStr]);

  // Combined Live Activity Feed
  const activityFeed = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'call' | 'visit' | 'token' | 'task';
      title: string;
      description: string;
      timestamp: string;
      actor: string;
      clientName?: string;
      badge: string;
      badgeColor: string;
    }> = [];

    // Add calls
    calls.forEach((c) => {
      items.push({
        id: `act-call-${c.id}`,
        type: 'call',
        title: `Call with ${c.leadName}`,
        description: `${c.outcome} • ${c.notes || 'No call notes'}${
          c.durationSeconds ? ` (${Math.round(c.durationSeconds / 60)}m)` : ''
        }`,
        timestamp: c.timestamp,
        actor: c.salesperson,
        clientName: c.leadName,
        badge: c.outcome.startsWith('Connected') ? 'Connected' : 'Attempted',
        badgeColor: c.outcome.startsWith('Connected')
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800',
      });
    });

    // Add site visits
    siteVisits.forEach((v) => {
      items.push({
        id: `act-visit-${v.id}`,
        type: 'visit',
        title: `Site Visit for ${v.projectName}`,
        description: `Client: ${v.leadName} (${v.leadMobile}) • Status: ${v.status} • Feedback: ${
          v.feedbackCategory || v.feedbackNotes || 'Pending'
        }`,
        timestamp: v.conductedTime || v.scheduledTime || v.createdAt,
        actor: v.salesExecutive,
        clientName: v.leadName,
        badge: v.status,
        badgeColor:
          v.status === 'Conducted'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-indigo-100 text-indigo-800',
      });
    });

    // Add tokens
    tokensAgreements.forEach((t) => {
      items.push({
        id: `act-token-${t.id}`,
        type: 'token',
        title: `Token Payment: ${formatINR(t.tokenAmount)}`,
        description: `Client: ${t.clientName} for ${t.projectName} (${t.unitNumber}) • Mode: ${t.paymentMode}`,
        timestamp: t.paymentDate || t.createdAt,
        actor: t.executiveName,
        clientName: t.clientName,
        badge: t.status,
        badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
      });
    });

    // Sort descending by timestamp
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [calls, siteVisits, tokensAgreements]);

  // Handle lead selection in WhatsApp tab
  const handleSelectLeadForWhatsApp = (leadIdStr: string) => {
    setSelectedLeadId(leadIdStr);
    if (!leadIdStr) {
      setCustomMobile('');
      setCustomName('');
      return;
    }
    const lead = leads.find((l) => String(l.id) === leadIdStr);
    if (lead) {
      setCustomMobile(lead.mobile);
      setCustomName(lead.name);
      // Personalize message
      const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId);
      if (tpl) {
        const personalized = tpl.message
          .replace('[Lead Name]', lead.name)
          .replace('[Project Name]', lead.project);
        setCustomMessage(personalized);
      }
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (tpl) {
      const name = customName || '[Lead Name]';
      const lead = leads.find((l) => String(l.id) === selectedLeadId);
      const project = lead?.project || '[Project Name]';
      setCustomMessage(
        tpl.message.replace('[Lead Name]', name).replace('[Project Name]', project)
      );
    }
  };

  const handleSendWhatsApp = () => {
    if (!customMobile) {
      alert('Please enter or select a 10-digit mobile number.');
      return;
    }
    const cleanMobile = customMobile.replace(/[^0-9]/g, '').slice(-10);
    const encoded = encodeURIComponent(customMessage);
    window.open(`https://wa.me/91${cleanMobile}?text=${encoded}`, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Ribbon */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <PhoneCall className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t('commHubTitle', 'Communication & Activity Center')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {t(
                  'commHubSubtitle',
                  'Unified call logs, WhatsApp message templates, and real-time sales activity timeline.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenLogModal()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t('logCall', '+ Log Call')}</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calls'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Call Tracker ({calls.length})</span>
            {callStats.today > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-sky-600 text-white rounded-full font-bold">
                {callStats.today} Today
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Sender & Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-purple-50 text-purple-700 border border-purple-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Live Activity Stream ({activityFeed.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CALL TRACKER */}
      {activeTab === 'calls' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Calls Today
              </div>
              <div className="text-xl font-extrabold text-sky-700 mt-0.5">
                {callStats.today}{' '}
                <span className="text-xs font-normal text-slate-400">/ 50 Target</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (callStats.today / 50) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Connected Rate
              </div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {callStats.connectedRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {callStats.connected} calls answered
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Site Visits Booked
              </div>
              <div className="text-xl font-extrabold text-purple-700 mt-0.5">
                {callStats.visitsBooked}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Visits scheduled over phone</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Talk Time
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {callStats.totalMinutes} mins
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ~{callStats.avgMinutes} mins avg duration
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client name, mobile, project, notes..."
                value={callSearchTerm}
                onChange={(e) => setCallSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={callOutcomeFilter}
              onChange={(e) => setCallOutcomeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Call Outcomes</option>
              <option value="Connected - Interested">Connected - Interested</option>
              <option value="Connected - Site Visit Scheduled">
                Connected - Site Visit Scheduled
              </option>
              <option value="Connected - Callback Requested">Connected - Callback Requested</option>
              <option value="Connected - Not Interested">Connected - Not Interested</option>
              <option value="Not Connected - Ringing">Not Connected - Ringing</option>
              <option value="Not Connected - Busy">Not Connected - Busy</option>
              <option value="Not Connected - Switched Off">Not Connected - Switched Off</option>
            </select>

            {isAdmin && (
              <select
                value={callSalespersonFilter}
                onChange={(e) => setCallSalespersonFilter(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 cursor-pointer"
              >
                <option value="all">All Executives ({allSalespersons.length})</option>
                {allSalespersons.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Calls List */}
          <div className="space-y-2.5">
            {filteredCalls.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
                <Phone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No call records found matching criteria</p>
              </div>
            ) : (
              filteredCalls.map((call) => {
                const isConnected = call.outcome.startsWith('Connected');
                return (
                  <div
                    key={call.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {call.callType === 'Incoming' ? (
                          <PhoneIncoming className="w-4 h-4" />
                        ) : call.callType === 'Follow-up' ? (
                          <Phone className="w-4 h-4" />
                        ) : (
                          <PhoneOutgoing className="w-4 h-4" />
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {call.leadName}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isConnected
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {call.outcome}
                          </span>
                          {call.project && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {call.project}
                            </span>
                          )}
                        </div>

                        {call.notes && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            "{call.notes}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span>👤 {call.salesperson}</span>
                          <span>📞 {call.mobile}</span>
                          {call.durationSeconds > 0 && (
                            <span>⏱️ {Math.round(call.durationSeconds / 60)} mins</span>
                          )}
                          <span>🕒 {call.timestamp.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => window.open(`tel:${call.mobile}`, '_self')}
                        className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.open(
                            `https://wa.me/91${call.mobile}?text=${encodeURIComponent(
                              `Namaste ${call.leadName} ji...`
                            )}`,
                            '_blank'
                          );
                        }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      {onDeleteCall && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this call log?')) {
                              onDeleteCall(call.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP SENDER & TEMPLATES */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Template Selector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Select Pre-Written Template</span>
            </h3>
            <p className="text-xs text-slate-500">
              High-conversion templates in English, Hindi, and Hinglish for instant delivery.
            </p>

            <div className="space-y-2">
              {WHATSAPP_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{tpl.title}</div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      {tpl.labelHindi}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {tpl.message}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Message Composer & Recipient */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Send WhatsApp Message</span>
              <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Instant WhatsApp Web / App Link
              </span>
            </h3>

            {/* Recipient Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pick Lead from CRM:
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleSelectLeadForWhatsApp(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Or enter custom mobile below --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.mobile}) - {l.project}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Mobile Number (10 Digits):
                </label>
                <input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={customMobile}
                  onChange={(e) => setCustomMobile(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Message Content (Editable):
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={8}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Opens chat window in WhatsApp Web or WhatsApp Desktop.
              </span>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE ACTIVITY STREAM */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>Real-Time Sales Activity Timeline</span>
              </h3>
              <p className="text-xs text-slate-500">
                Unified audit trail of all calls, site visits, tokens booked, and operations across
                the team.
              </p>
            </div>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activityFeed.slice(0, 50).map((act) => {
              return (
                <div key={act.id} className="relative group">
                  {/* Bullet */}
                  <span
                    className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                      act.type === 'token'
                        ? 'bg-emerald-500 ring-emerald-200'
                        : act.type === 'visit'
                        ? 'bg-purple-500 ring-purple-200'
                        : 'bg-sky-500 ring-sky-200'
                    }`}
                  />

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {act.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${act.badgeColor}`}
                        >
                          {act.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {act.timestamp.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{act.description}</p>

                    <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Logged by: <strong className="text-slate-800">{act.actor}</strong></span>
                      {act.clientName && (
                        <span className="text-slate-400">👤 {act.clientName}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
