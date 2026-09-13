import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock3,
  CalendarCheck,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Building,
  FileText,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Tag,
  Check,
  X,
  Briefcase,
  Layers,
  ListOrdered,
} from 'lucide-react';
import {
  CrmMeeting,
  MeetingStage,
  MeetingType,
  Lead,
  AuthUser,
  Project,
} from '../types';
import { openWhatsApp, makePhoneCall, fmt } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';

interface MeetingsViewProps {
  meetings: CrmMeeting[];
  leads: Lead[];
  projects?: Project[];
  currentUser?: AuthUser | null;
  onSaveMeeting: (meeting: CrmMeeting) => Promise<void>;
  onDeleteMeeting: (meetingId: string) => Promise<void>;
  onViewLeadDetail?: (lead: Lead) => void;
}

const getTodayYMD = (): string => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const MEETING_STAGES: MeetingStage[] = [
  'Scheduled',
  'In Progress',
  'Completed',
  'Follow-up Needed',
  'Rescheduled',
  'Cancelled',
  'No Show',
];

const MEETING_TYPES: MeetingType[] = [
  'Face to Face (Office Lounge)',
  'Site Visit & Walkthrough',
  'Virtual (Zoom / Google Meet)',
  'Price Negotiation & Token',
  'Client Home / Office Visit',
];

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings = [],
  leads = [],
  projects = [],
  currentUser,
  onSaveMeeting,
  onDeleteMeeting,
  onViewLeadDetail,
}) => {
  const { t } = useLanguage();
  const todayYMD = useMemo(() => getTodayYMD(), []);

  // View state
  const [activeTab, setActiveTab] = useState<'tracker' | 'pipeline'>('tracker');
  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'tomorrow' | 'week' | 'all' | 'custom'>('today');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CrmMeeting | null>(null);

  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [outcomeMeeting, setOutcomeMeeting] = useState<CrmMeeting | null>(null);
  const [momDiscussion, setMomDiscussion] = useState('');
  const [momOutcome, setMomOutcome] = useState('');
  const [momStage, setMomStage] = useState<MeetingStage>('Completed');
  const [momNextDate, setMomNextDate] = useState('');

  // Form Fields for Schedule Meeting
  const [formData, setFormData] = useState({
    title: '',
    leadId: '' as string | number,
    clientName: '',
    clientMobile: '',
    clientEmail: '',
    projectName: '',
    salesperson: currentUser?.name || 'Sunny Choudhary',
    meetingDate: todayYMD,
    startTime: '11:00',
    endTime: '12:00',
    meetingType: 'Face to Face (Office Lounge)' as MeetingType,
    stage: 'Scheduled' as MeetingStage,
    locationOrLink: 'HousingWorld Office Lounge, Sector 65',
    agenda: '',
    discussionPoints: '',
    outcome: '',
    nextStepDate: '',
  });

  // Calculate quick date offsets
  const tomorrowYMD = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const weekRange = useMemo(() => {
    const d1 = new Date();
    const d2 = new Date();
    d2.setDate(d2.getDate() + 7);
    return {
      start: d1.toISOString().slice(0, 10),
      end: d2.toISOString().slice(0, 10),
    };
  }, []);

  // Distinct salespersons
  const salespersonsList = useMemo(() => {
    const names = new Set<string>();
    if (currentUser?.name) names.add(currentUser.name);
    meetings.forEach((m) => {
      if (m.salesperson) names.add(m.salesperson);
    });
    leads.forEach((l) => {
      if (l.salesperson) names.add(l.salesperson);
    });
    return Array.from(names);
  }, [meetings, leads, currentUser]);

  // Handle Date Filter Mode Changes
  const handleDateFilterChange = (mode: 'today' | 'tomorrow' | 'week' | 'all' | 'custom', customVal?: string) => {
    setDateFilterMode(mode);
    if (mode === 'today') {
      setSelectedDate(todayYMD);
    } else if (mode === 'tomorrow') {
      setSelectedDate(tomorrowYMD);
    } else if (mode === 'custom' && customVal) {
      setSelectedDate(customVal);
    }
  };

  // Step Date forward / back in tracker view
  const stepDate = (offset: number) => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() + offset);
      const nextYMD = curr.toISOString().slice(0, 10);
      setSelectedDate(nextYMD);
      if (nextYMD === todayYMD) setDateFilterMode('today');
      else if (nextYMD === tomorrowYMD) setDateFilterMode('tomorrow');
      else setDateFilterMode('custom');
    } catch (e) {
      setSelectedDate(todayYMD);
    }
  };

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      // Salesperson filter
      if (salespersonFilter !== 'all' && m.salesperson !== salespersonFilter) {
        return false;
      }

      // Stage filter
      if (stageFilter !== 'all' && m.stage !== stageFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && m.meetingType !== typeFilter) {
        return false;
      }

      // Date filtering:
      if (activeTab === 'tracker') {
        if (dateFilterMode === 'today' && m.meetingDate !== todayYMD) return false;
        if (dateFilterMode === 'tomorrow' && m.meetingDate !== tomorrowYMD) return false;
        if (dateFilterMode === 'week') {
          if (m.meetingDate < weekRange.start || m.meetingDate > weekRange.end) return false;
        }
        if (dateFilterMode === 'custom' && m.meetingDate !== selectedDate) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchClient = m.clientName.toLowerCase().includes(q);
        const matchMobile = m.clientMobile?.toLowerCase().includes(q);
        const matchProject = m.projectName?.toLowerCase().includes(q);
        const matchLocation = m.locationOrLink?.toLowerCase().includes(q);
        const matchOutcome = m.outcome?.toLowerCase().includes(q);
        const matchAgenda = m.agenda?.toLowerCase().includes(q);
        const matchNumber = m.meetingNumber?.toLowerCase().includes(q);
        if (
          !matchTitle &&
          !matchClient &&
          !matchMobile &&
          !matchProject &&
          !matchLocation &&
          !matchOutcome &&
          !matchAgenda &&
          !matchNumber
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    meetings,
    salespersonFilter,
    stageFilter,
    typeFilter,
    activeTab,
    dateFilterMode,
    todayYMD,
    tomorrowYMD,
    selectedDate,
    weekRange,
    searchQuery,
  ]);

  // Group tracker meetings into Time Slots (Morning, Afternoon, Evening)
  const trackerSlotGroups = useMemo(() => {
    const morning: CrmMeeting[] = [];
    const afternoon: CrmMeeting[] = [];
    const evening: CrmMeeting[] = [];

    filteredMeetings.forEach((m) => {
      const hour = parseInt(m.startTime?.split(':')[0] || '12', 10);
      if (hour < 12) {
        morning.push(m);
      } else if (hour < 16) {
        afternoon.push(m);
      } else {
        evening.push(m);
      }
    });

    const sortFn = (a: CrmMeeting, b: CrmMeeting) => (a.startTime || '').localeCompare(b.startTime || '');

    return {
      morning: morning.sort(sortFn),
      afternoon: afternoon.sort(sortFn),
      evening: evening.sort(sortFn),
    };
  }, [filteredMeetings]);

  // Overall KPI statistics
  const kpis = useMemo(() => {
    const todayMeetings = meetings.filter((m) => m.meetingDate === todayYMD);
    const scheduledCount = meetings.filter((m) => m.stage === 'Scheduled').length;
    const inProgressCount = meetings.filter((m) => m.stage === 'In Progress').length;
    const completedCount = meetings.filter((m) => m.stage === 'Completed').length;
    const followUpCount = meetings.filter((m) => m.stage === 'Follow-up Needed' || m.stage === 'Rescheduled').length;

    return {
      todayTotal: todayMeetings.length,
      todayScheduled: todayMeetings.filter((m) => m.stage === 'Scheduled').length,
      todayCompleted: todayMeetings.filter((m) => m.stage === 'Completed').length,
      totalScheduled: scheduledCount,
      totalInProgress: inProgressCount,
      totalCompleted: completedCount,
      totalFollowUp: followUpCount,
    };
  }, [meetings, todayYMD]);

  // Open Add Meeting modal
  const handleOpenAddModal = (initialLead?: Lead) => {
    setEditingMeeting(null);
    setFormData({
      title: initialLead ? `Meeting with ${initialLead.name} - ${initialLead.project}` : '',
      leadId: initialLead ? initialLead.id : '',
      clientName: initialLead ? initialLead.name : '',
      clientMobile: initialLead ? initialLead.mobile : '',
      clientEmail: '',
      projectName: initialLead ? initialLead.project : '',
      salesperson: initialLead?.salesperson || currentUser?.name || 'Sunny Choudhary',
      meetingDate: selectedDate || todayYMD,
      startTime: '11:30',
      endTime: '12:30',
      meetingType: 'Face to Face (Office Lounge)',
      stage: 'Scheduled',
      locationOrLink: 'HousingWorld VIP Sales Lounge, Sector 65 Gurugram',
      agenda: initialLead ? `Discussion regarding ${initialLead.project} (${initialLead.size}) within budget ${initialLead.budget}` : '',
      discussionPoints: '',
      outcome: '',
      nextStepDate: '',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Meeting modal
  const handleOpenEditModal = (m: CrmMeeting) => {
    setEditingMeeting(m);
    setFormData({
      title: m.title,
      leadId: m.leadId || '',
      clientName: m.clientName,
      clientMobile: m.clientMobile || '',
      clientEmail: m.clientEmail || '',
      projectName: m.projectName || '',
      salesperson: m.salesperson,
      meetingDate: m.meetingDate,
      startTime: m.startTime,
      endTime: m.endTime || '',
      meetingType: m.meetingType,
      stage: m.stage,
      locationOrLink: m.locationOrLink || '',
      agenda: m.agenda || '',
      discussionPoints: m.discussionPoints || '',
      outcome: m.outcome || '',
      nextStepDate: m.nextStepDate || '',
    });
    setIsFormModalOpen(true);
  };

  // Open Log MOM / Outcome modal
  const handleOpenOutcomeModal = (m: CrmMeeting) => {
    setOutcomeMeeting(m);
    setMomDiscussion(m.discussionPoints || '');
    setMomOutcome(m.outcome || '');
    setMomStage(m.stage === 'Scheduled' || m.stage === 'In Progress' ? 'Completed' : m.stage);
    setMomNextDate(m.nextStepDate || '');
    setIsOutcomeModalOpen(true);
  };

  // Save MOM Outcome
  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeMeeting) return;

    const updated: CrmMeeting = {
      ...outcomeMeeting,
      discussionPoints: momDiscussion.trim(),
      outcome: momOutcome.trim(),
      stage: momStage,
      nextStepDate: momNextDate || undefined,
      updatedAt: new Date().toISOString(),
    };

    await onSaveMeeting(updated);
    setIsOutcomeModalOpen(false);
    setOutcomeMeeting(null);
  };

  // Quick Stage change directly from dropdown or pipeline
  const handleQuickStageChange = async (meeting: CrmMeeting, newStage: MeetingStage) => {
    const updated: CrmMeeting = {
      ...meeting,
      stage: newStage,
      updatedAt: new Date().toISOString(),
    };
    await onSaveMeeting(updated);
  };

  // Handle lead selection inside the form
  const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData((prev) => ({ ...prev, leadId: '' }));
      return;
    }
    const lead = leads.find((l) => String(l.id) === selectedId);
    if (lead) {
      setFormData((prev) => ({
        ...prev,
        leadId: lead.id,
        clientName: lead.name,
        clientMobile: lead.mobile,
        projectName: lead.project,
        salesperson: lead.salesperson || prev.salesperson,
        title: prev.title || `Client Meeting: ${lead.name} (${lead.project})`,
        agenda: prev.agenda || `Review ${lead.project} options and finalize site walk or token terms.`,
      }));
    }
  };

  // Save Schedule / Edit Meeting
  const handleSaveMeetingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.clientName.trim() || !formData.meetingDate) {
      alert('Please fill in the meeting title, client name, and date.');
      return;
    }

    const meetingId = editingMeeting ? editingMeeting.id : `meet-${Date.now()}`;
    const meetingNumber = editingMeeting ? editingMeeting.meetingNumber : `MT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newMeeting: CrmMeeting = {
      id: meetingId,
      meetingNumber,
      title: formData.title.trim(),
      leadId: formData.leadId ? Number(formData.leadId) : undefined,
      clientName: formData.clientName.trim(),
      clientMobile: formData.clientMobile.trim(),
      clientEmail: formData.clientEmail.trim() || undefined,
      projectName: formData.projectName.trim() || undefined,
      salesperson: formData.salesperson.trim(),
      meetingDate: formData.meetingDate,
      startTime: formData.startTime,
      endTime: formData.endTime || undefined,
      meetingType: formData.meetingType,
      stage: formData.stage,
      locationOrLink: formData.locationOrLink.trim() || undefined,
      agenda: formData.agenda.trim() || undefined,
      discussionPoints: formData.discussionPoints.trim() || undefined,
      outcome: formData.outcome.trim() || undefined,
      nextStepDate: formData.nextStepDate || undefined,
      createdAt: editingMeeting ? editingMeeting.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveMeeting(newMeeting);
    setIsFormModalOpen(false);
    setEditingMeeting(null);
  };

  // Send WhatsApp Reminder
  const handleSendWhatsAppReminder = (m: CrmMeeting) => {
    if (!m.clientMobile) {
      alert('No mobile number available for this client.');
      return;
    }

    const isVirtual = m.meetingType.includes('Virtual');
    const locationText = isVirtual
      ? `Virtual Meeting Link: ${m.locationOrLink || 'Sent on request'}`
      : `Meeting Location: ${m.locationOrLink || 'HousingWorld Sales Lounge'}`;

    const text = `Namaste ${m.clientName} ji,

This is a confirmation reminder for our scheduled meeting regarding *${m.projectName || 'Real Estate Property'}*.

📅 *Date:* ${m.meetingDate}
⏰ *Time:* ${m.startTime}${m.endTime ? ' to ' + m.endTime : ''}
📍 *${isVirtual ? 'Join Link' : 'Venue'}:* ${locationText}
🎯 *Agenda:* ${m.agenda || 'Discussion on property investment & unit selection'}

Executive: *${m.salesperson}*
Company: *HousingWorld Infra Private Limited*

Please let us know if you need any adjustments in schedule. Looking forward to meeting you!`;

    openWhatsApp(m.clientMobile, text);
  };

  // Badge colors for Meeting Type
  const getTypeBadge = (type: MeetingType) => {
    switch (type) {
      case 'Virtual (Zoom / Google Meet)':
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
          icon: <Video className="w-3.5 h-3.5 mr-1" />,
        };
      case 'Site Visit & Walkthrough':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
          icon: <Building className="w-3.5 h-3.5 mr-1" />,
        };
      case 'Price Negotiation & Token':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
        };
      case 'Client Home / Office Visit':
        return {
          bg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
          icon: <Users className="w-3.5 h-3.5 mr-1" />,
        };
      default:
        return {
          bg: 'bg-teal-500/10 text-teal-400 border border-teal-500/30',
          icon: <MapPin className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  // Badge colors for Stage
  const getStageBadge = (stage: MeetingStage) => {
    switch (stage) {
      case 'Scheduled':
        return 'bg-blue-950/70 text-blue-300 border-blue-600/40';
      case 'In Progress':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/40 animate-pulse';
      case 'Completed':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
      case 'Follow-up Needed':
        return 'bg-purple-950/70 text-purple-300 border-purple-500/40';
      case 'Rescheduled':
        return 'bg-yellow-950/70 text-yellow-300 border-yellow-500/40';
      case 'Cancelled':
      case 'No Show':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Render Card for Meeting (Used in Daily Time Slots & List views)
  const renderMeetingCard = (m: CrmMeeting) => {
    const typeInfo = getTypeBadge(m.meetingType);
    const stageClass = getStageBadge(m.stage);
    const linkedLead = m.leadId ? leads.find((l) => l.id === m.leadId) : null;

    return (
      <div
        key={m.id}
        className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between group"
      >
        <div className="space-y-3">
          {/* Top Row: Time & Type Badge + Stage */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-teal-950/70 border border-teal-800/60 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{m.startTime}</span>
              {m.endTime && <span className="text-teal-400/80">– {m.endTime}</span>}
            </div>

            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${stageClass}`}>
              {m.stage}
            </span>
          </div>

          {/* Meeting Title & Type */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${typeInfo.bg}`}>
                {typeInfo.icon}
                {m.meetingType}
              </span>
              {m.meetingNumber && (
                <span className="text-slate-500 font-mono text-[10px]">#{m.meetingNumber}</span>
              )}
            </div>
            <h4 className="text-sm font-bold text-white leading-snug group-hover:text-teal-200 transition-colors">
              {m.title}
            </h4>
          </div>

          {/* Client Details */}
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                {m.clientName}
              </span>
              {linkedLead && onViewLeadDetail && (
                <button
                  type="button"
                  onClick={() => onViewLeadDetail(linkedLead)}
                  className="text-[10px] text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lead #{linkedLead.id}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="text-slate-400 text-[11px] flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
                {m.clientMobile}
              </span>
              {m.projectName && (
                <span className="truncate text-teal-400/90 font-medium">
                  • {m.projectName}
                </span>
              )}
            </div>
          </div>

          {/* Location / Meeting Link */}
          {m.locationOrLink && (
            <div className="text-[11px] text-slate-300 flex items-center gap-1.5 bg-slate-800/40 p-2 rounded border border-slate-800/70">
              {m.meetingType.includes('Virtual') ? (
                <>
                  <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <a
                    href={m.locationOrLink.startsWith('http') ? m.locationOrLink : `https://${m.locationOrLink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-300 hover:underline truncate"
                  >
                    {m.locationOrLink}
                  </a>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{m.locationOrLink}</span>
                </>
              )}
            </div>
          )}

          {/* Agenda or Outcome */}
          {m.outcome ? (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200">
              <div className="font-bold flex items-center gap-1 text-[11px] text-emerald-300 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Minutes of Meeting (MOM):</span>
              </div>
              <p className="line-clamp-2">{m.outcome}</p>
              {m.nextStepDate && (
                <div className="mt-1 text-[10px] text-emerald-400/80 font-medium">
                  Next Step: {m.nextStepDate}
                </div>
              )}
            </div>
          ) : m.agenda ? (
            <div className="text-xs text-slate-400 italic bg-slate-800/30 p-2 rounded border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase not-italic block mb-0.5">
                Agenda:
              </span>
              <p className="line-clamp-2">{m.agenda}</p>
            </div>
          ) : null}
        </div>

        {/* Card Footer: Salesperson & Actions */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <span className="truncate">{m.salesperson}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Log Outcome / MOM */}
            <button
              type="button"
              onClick={() => handleOpenOutcomeModal(m)}
              className="px-2 py-1 text-[11px] font-semibold bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              title="Record Meeting Minutes & Outcome"
            >
              <FileText className="w-3 h-3" />
              <span>MOM</span>
            </button>

            {/* WhatsApp Reminder */}
            <button
              type="button"
              onClick={() => handleSendWhatsAppReminder(m)}
              className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors cursor-pointer"
              title="Send WhatsApp Reminder"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>

            {/* Direct Call */}
            {m.clientMobile && (
              <button
                type="button"
                onClick={() => makePhoneCall(m.clientMobile)}
                className="p-1.5 text-sky-400 hover:bg-sky-500/20 rounded-md transition-colors cursor-pointer"
                title="Call Client"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEditModal(m)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Edit Meeting Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete meeting "${m.title}"?`)) {
                  onDeleteMeeting(m.id);
                }
              }}
              className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors cursor-pointer"
              title="Delete Meeting"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Scheduled Meeting Pipeline & Minutes Tracker</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            Meetings & Client Schedule
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-medium">
              {meetings.length} Total
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real estate buyer consultations, virtual presentations, boardroom negotiations, and daily meeting minutes (MOM).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700/70">
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'tracker'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Tracker (Timeline)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pipeline (Kanban Stages)</span>
            </button>
          </div>

          {/* Schedule Meeting Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-teal-900/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Today's Scheduled</span>
            <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{kpis.todayTotal}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{kpis.todayCompleted} done</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">{kpis.todayScheduled} upcoming</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pipeline Active</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock3 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{kpis.totalScheduled + kpis.totalInProgress}</div>
          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
            <span>{kpis.totalInProgress} ongoing right now</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Completed & MOM Logged</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{kpis.totalCompleted}</div>
          <div className="text-xs text-emerald-400 mt-1">
            Successful client consultations
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Follow-up & Rescheduled</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{kpis.totalFollowUp}</div>
          <div className="text-xs text-purple-400 mt-1">
            Pending next meeting date
          </div>
        </div>
      </div>

      {/* Date Bar & Filtering Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-3">
        {/* Date Selector row for Daily Tracker */}
        {activeTab === 'tracker' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => stepDate(-1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-sm font-semibold text-white">
                <Calendar className="w-4 h-4 text-teal-400 mr-1.5" />
                <span>{selectedDate}</span>
                {selectedDate === todayYMD && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-bold border border-teal-500/30">
                    Today
                  </span>
                )}
                {selectedDate === tomorrowYMD && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">
                    Tomorrow
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => stepDate(1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDateFilterChange('today')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilterMode === 'today'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Today (आज)
              </button>
              <button
                type="button"
                onClick={() => handleDateFilterChange('tomorrow')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilterMode === 'tomorrow'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Tomorrow (कल)
              </button>
              <button
                type="button"
                onClick={() => handleDateFilterChange('week')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  dateFilterMode === 'week'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Next 7 Days
              </button>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateFilterChange('custom', e.target.value)}
                  className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client, mobile, project, agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/90 text-sm text-slate-200 placeholder-slate-500 rounded-xl border border-slate-700/80 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <select
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 text-sm text-slate-200 rounded-xl border border-slate-700/80 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Sales Executives</option>
              {salespersonsList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 text-sm text-slate-200 rounded-xl border border-slate-700/80 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Meeting Formats</option>
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 text-sm text-slate-200 rounded-xl border border-slate-700/80 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Stages</option>
              {MEETING_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: DAILY MEETING TRACKER (TIMELINE / SLOTS) */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          {filteredMeetings.length === 0 ? (
            <div className="bg-slate-900/60 p-12 text-center rounded-2xl border border-slate-800">
              <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-300">No Meetings Scheduled</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                There are no client meetings scheduled for this date or matching your search filters.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule a Meeting for this Day</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* MORNING SLOT */}
              {trackerSlotGroups.morning.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Morning Sessions (09:00 AM – 12:00 PM)</span>
                    <span className="text-slate-500 text-[11px] font-normal">({trackerSlotGroups.morning.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trackerSlotGroups.morning.map((m) => renderMeetingCard(m))}
                  </div>
                </div>
              )}

              {/* AFTERNOON SLOT */}
              {trackerSlotGroups.afternoon.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>Afternoon Sessions (12:00 PM – 04:00 PM)</span>
                    <span className="text-slate-500 text-[11px] font-normal">({trackerSlotGroups.afternoon.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trackerSlotGroups.afternoon.map((m) => renderMeetingCard(m))}
                  </div>
                </div>
              )}

              {/* EVENING SLOT */}
              {trackerSlotGroups.evening.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>Evening Sessions (04:00 PM – 08:00 PM+)</span>
                    <span className="text-slate-500 text-[11px] font-normal">({trackerSlotGroups.evening.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trackerSlotGroups.evening.map((m) => renderMeetingCard(m))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PIPELINE (KANBAN STAGES) */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1280px]">
            {MEETING_STAGES.map((stage) => {
              const stageMeetings = filteredMeetings.filter((m) => m.stage === stage);
              return (
                <div
                  key={stage}
                  className="w-80 flex-shrink-0 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col max-h-[750px]"
                >
                  {/* Stage Header */}
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        stage === 'Scheduled' ? 'bg-blue-400' :
                        stage === 'In Progress' ? 'bg-amber-400 animate-ping' :
                        stage === 'Completed' ? 'bg-emerald-400' :
                        stage === 'Follow-up Needed' ? 'bg-purple-400' :
                        stage === 'Rescheduled' ? 'bg-yellow-400' : 'bg-rose-400'
                      }`}></span>
                      <h4 className="font-semibold text-sm text-slate-200">{stage}</h4>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      {stageMeetings.length}
                    </span>
                  </div>

                  {/* Stage Card List */}
                  <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {stageMeetings.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 italic">
                        No meetings in {stage}
                      </div>
                    ) : (
                      stageMeetings.map((m) => (
                        <div
                          key={m.id}
                          className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-sm space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                              {m.title}
                            </h5>
                            <span className="text-[10px] text-teal-400 font-mono shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                              {m.startTime}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 flex items-center justify-between">
                            <span className="font-medium text-slate-200">{m.clientName}</span>
                            {m.projectName && (
                              <span className="text-slate-400 truncate max-w-[120px]">{m.projectName}</span>
                            )}
                          </div>

                          {m.outcome ? (
                            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                              <span className="font-bold">Outcome:</span> {m.outcome}
                            </div>
                          ) : m.agenda ? (
                            <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                              "{m.agenda}"
                            </p>
                          ) : null}

                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 truncate">{m.salesperson}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenOutcomeModal(m)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium"
                                title="Log MOM / Outcome"
                              >
                                MOM
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppReminder(m)}
                                className="p-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded"
                                title="WhatsApp Reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick stage transition button row */}
                          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Change Stage:</span>
                            <select
                              value={m.stage}
                              onChange={(e) => handleQuickStageChange(m, e.target.value as MeetingStage)}
                              className="bg-slate-900 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-700"
                            >
                              {MEETING_STAGES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER FUNCTION: Single Meeting Card (Used in Tracker View) */}
      {function renderMeetingCard(m: CrmMeeting) {
        const typeBadge = getTypeBadge(m.meetingType);
        const stageBadgeClass = getStageBadge(m.stage);
        const isVirtual = m.meetingType.includes('Virtual');

        return (
          <div
            key={m.id}
            className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all p-4 flex flex-col justify-between shadow-lg relative group"
          >
            <div>
              {/* Card Header: Time & Stage & Format Badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-teal-300 bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-800/50">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{m.startTime}</span>
                    {m.endTime && <span>– {m.endTime}</span>}
                  </div>
                  {m.meetingDate !== selectedDate && (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {m.meetingDate}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={m.stage}
                    onChange={(e) => handleQuickStageChange(m, e.target.value as MeetingStage)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${stageBadgeClass}`}
                  >
                    {MEETING_STAGES.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-slate-200">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Meeting Number */}
              <div className="mb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
                  <span>{m.meetingNumber}</span>
                  {m.projectName && (
                    <>
                      <span>•</span>
                      <span className="text-teal-400 font-semibold">{m.projectName}</span>
                    </>
                  )}
                </div>
                <h4 className="text-base font-bold text-white mt-0.5 group-hover:text-teal-300 transition-colors">
                  {m.title}
                </h4>
              </div>

              {/* Client Details Row */}
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 mb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-teal-600/30 text-teal-300 flex items-center justify-center text-xs font-bold border border-teal-500/40">
                      {m.clientName.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{m.clientName}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {m.clientMobile && (
                      <>
                        <button
                          type="button"
                          onClick={() => makePhoneCall(m.clientMobile)}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all"
                          title="Call Client"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReminder(m)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>{m.clientMobile || 'No mobile added'}</span>
                  <span className="text-slate-300 font-medium">Rep: {m.salesperson}</span>
                </div>
              </div>

              {/* Format & Location / Link */}
              <div className="space-y-1.5 text-xs mb-3">
                <div className="flex items-center">
                  <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md ${typeBadge.bg}`}>
                    {typeBadge.icon}
                    {m.meetingType}
                  </span>
                </div>

                {m.locationOrLink && (
                  <div className="flex items-start gap-1.5 text-slate-300 text-xs">
                    {isVirtual ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <a
                          href={m.locationOrLink.startsWith('http') ? m.locationOrLink : `https://${m.locationOrLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-300 hover:text-indigo-200 underline font-medium truncate flex items-center gap-1"
                        >
                          <span className="truncate">{m.locationOrLink}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                        <span className="text-slate-300 line-clamp-1">{m.locationOrLink}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Agenda / Objective */}
              {m.agenda && (
                <div className="text-xs text-slate-400 mb-2.5">
                  <span className="font-semibold text-slate-300">Agenda:</span> {m.agenda}
                </div>
              )}

              {/* MOM / Outcomes Pill */}
              {m.outcome && (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-700/40 text-xs text-emerald-200 mb-3 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-emerald-400 text-[11px] uppercase tracking-wide">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Meeting Decision & Outcome</span>
                  </div>
                  <p className="text-emerald-100/90 text-xs leading-relaxed">{m.outcome}</p>
                </div>
              )}

              {/* Discussion Points / MOM preview if available */}
              {m.discussionPoints && !m.outcome && (
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 mb-3 space-y-1">
                  <span className="font-semibold text-slate-200">MOM Notes:</span>
                  <p className="line-clamp-2 text-slate-400">{m.discussionPoints}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleOpenOutcomeModal(m)}
                className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{m.outcome ? 'Edit MOM' : 'Log Outcome / MOM'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(m)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                  title="Edit Meeting"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete meeting "${m.title}"?`)) {
                      onDeleteMeeting(m.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                  title="Delete Meeting"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      }}

      {/* MODAL 1: SCHEDULE / EDIT MEETING */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <CalendarCheck className="w-5 h-5 text-teal-400" />
                <span>{editingMeeting ? 'Edit Scheduled Meeting' : 'Schedule Client Meeting'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingForm} className="p-6 space-y-4">
              {/* Optional: Auto-fill from Existing Lead */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Existing Lead (Optional - Auto-populates client data)
                </label>
                <select
                  value={formData.leadId}
                  onChange={handleLeadSelect}
                  className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose from Leads List or Enter Manually --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.mobile}) - {l.project} [{l.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meeting Title / Agenda Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DLF Privana 4BHK Price Negotiation & Booking Token"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Client Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client / Investor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.clientMobile}
                    onChange={(e) => setFormData({ ...formData, clientMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Project & Assigned Salesperson */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project / Property Discussed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DLF Privana South, Godrej Woods"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Sales Executive *
                  </label>
                  <select
                    value={formData.salesperson}
                    onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  >
                    {salespersonsList.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meeting Date, Start Time, End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Meeting Type & Initial Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meeting Format / Venue *
                  </label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value as MeetingType })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  >
                    {MEETING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as MeetingStage })}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  >
                    {MEETING_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location or Virtual Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Venue Location or Virtual Meeting Link (Google Meet / Zoom)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HousingWorld Boardroom 1 OR https://meet.google.com/abc-xyz"
                  value={formData.locationOrLink}
                  onChange={(e) => setFormData({ ...formData, locationOrLink: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Agenda / Objective */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meeting Objective / Pre-meeting Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Key discussion points, payment plan requirements, car parking concessions, or family decision timeline..."
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-900/30 transition-all"
                >
                  {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG MINUTES OF MEETING (MOM) & OUTCOME */}
      {isOutcomeModalOpen && outcomeMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <FileText className="w-5 h-5 text-teal-400" />
                <span>Log Meeting Minutes (MOM) & Outcome</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOutcomeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutcome} className="p-6 space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white text-sm">{outcomeMeeting.title}</div>
                <div>Client: <span className="font-semibold text-slate-200">{outcomeMeeting.clientName}</span> ({outcomeMeeting.clientMobile})</div>
                <div>Project: <span className="font-semibold text-teal-400">{outcomeMeeting.projectName || 'Not specified'}</span></div>
              </div>

              {/* Discussion Points / Minutes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discussion Points / Minutes of Meeting (MOM)
                </label>
                <textarea
                  rows={3}
                  placeholder="What was discussed during the session? (e.g. Client liked 14th floor Tower B, requested 5% discount on BSP, agreed to 30:70 payment plan)..."
                  value={momDiscussion}
                  onChange={(e) => setMomDiscussion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Outcome / Final Decision */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meeting Decision & Agreed Outcome *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Token ₹2,00,000 promised tomorrow; Booking unit #1402 blocked; Next site walkthrough on Sunday."
                  value={momOutcome}
                  onChange={(e) => setMomOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Update Stage & Next Follow-up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Update Pipeline Stage *
                  </label>
                  <select
                    value={momStage}
                    onChange={(e) => setMomStage(e.target.value as MeetingStage)}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Completed">Completed (सफल मीटिंग)</option>
                    <option value="Follow-up Needed">Follow-up Needed (फॉलो-अप अपेक्षित)</option>
                    <option value="Rescheduled">Rescheduled (रीशेड्यूल)</option>
                    <option value="In Progress">In Progress (चल रही है)</option>
                    <option value="Cancelled">Cancelled (रद्द)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Next Follow-up / Step Date
                  </label>
                  <input
                    type="date"
                    value={momNextDate}
                    onChange={(e) => setMomNextDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-sm text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Form actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOutcomeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-900/30 transition-all"
                >
                  Save Outcome & Update Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
