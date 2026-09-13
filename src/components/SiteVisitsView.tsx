import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Share2,
  Trash2,
  CalendarCheck2,
  Navigation,
  Star,
  Building2,
  ExternalLink,
  Sparkles,
  Ticket,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import { SiteVisit, SiteVisitStatus, Project, Lead, AuthUser } from '../types';

interface SiteVisitsViewProps {
  siteVisits: SiteVisit[];
  projects: Project[];
  leads: Lead[];
  currentUser: AuthUser;
  isAdmin: boolean;
  onSaveSiteVisit: (visit: Omit<SiteVisit, 'id'> & { id?: string }) => void;
  onDeleteSiteVisit: (id: string) => void;
  onUpdateLeadStatus?: (leadId: number, newStatus: any) => void;
}

export const SiteVisitsView: React.FC<SiteVisitsViewProps> = ({
  siteVisits,
  projects,
  leads,
  currentUser,
  isAdmin,
  onSaveSiteVisit,
  onDeleteSiteVisit,
  onUpdateLeadStatus,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'conducted' | 'pending_feedback'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SiteVisit | null>(null);
  const [viewingPassVisit, setViewingPassVisit] = useState<SiteVisit | null>(null);
  const [recordingFeedbackVisit, setRecordingFeedbackVisit] = useState<SiteVisit | null>(null);

  // Schedule Form State
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [salesExecutive, setSalesExecutive] = useState(currentUser.name || '');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [cabAssigned, setCabAssigned] = useState('');

  // Feedback Form State
  const [feedbackCategory, setFeedbackCategory] = useState<SiteVisit['feedbackCategory']>('Hot - Ready to Book');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);

  // Quick stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayVisits = siteVisits.filter((v) => v.scheduledTime.startsWith(todayStr));
    const conducted = siteVisits.filter((v) => v.status === 'Conducted');
    const scheduled = siteVisits.filter((v) => v.status === 'Scheduled');
    const hotLeads = siteVisits.filter((v) => v.feedbackCategory === 'Hot - Ready to Book');
    return {
      total: siteVisits.length,
      todayCount: todayVisits.length,
      conductedCount: conducted.length,
      scheduledCount: scheduled.length,
      hotCount: hotLeads.length,
    };
  }, [siteVisits]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return siteVisits.filter((v) => {
      // Status/Date Tab filter
      if (activeFilter === 'today' && !v.scheduledTime.startsWith(todayStr)) return false;
      if (activeFilter === 'upcoming' && v.status !== 'Scheduled') return false;
      if (activeFilter === 'conducted' && v.status !== 'Conducted') return false;
      if (activeFilter === 'pending_feedback' && (v.status !== 'Conducted' || v.feedbackCategory)) return false;

      // Project filter
      if (selectedProjectFilter && v.projectId !== selectedProjectFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.leadName.toLowerCase().includes(q);
        const matchMobile = v.leadMobile.includes(q);
        const matchProject = v.projectName.toLowerCase().includes(q);
        const matchExec = v.salesExecutive.toLowerCase().includes(q);
        const matchPass = v.passCode?.toLowerCase().includes(q);
        if (!matchName && !matchMobile && !matchProject && !matchExec && !matchPass) return false;
      }

      return true;
    });
  }, [siteVisits, activeFilter, selectedProjectFilter, searchQuery]);

  // Open schedule modal
  const handleOpenScheduleModal = (visitToEdit?: SiteVisit) => {
    if (visitToEdit) {
      setEditingVisit(visitToEdit);
      setSelectedLeadId(visitToEdit.leadId);
      setSelectedProjectId(visitToEdit.projectId);
      setScheduledDateTime(visitToEdit.scheduledTime);
      setSalesExecutive(visitToEdit.salesExecutive);
      setPickupRequired(visitToEdit.pickupRequired);
      setPickupAddress(visitToEdit.pickupAddress || '');
      setCabAssigned(visitToEdit.cabAssigned || '');
    } else {
      setEditingVisit(null);
      setSelectedLeadId(leads.length > 0 ? leads[0].id : '');
      setSelectedProjectId(projects.length > 0 ? projects[0].id : '');
      // Default to tomorrow 11:00 AM
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(11, 0, 0, 0);
      setScheduledDateTime(tomorrow.toISOString().slice(0, 16));
      setSalesExecutive(currentUser.name || 'Sales Executive');
      setPickupRequired(false);
      setPickupAddress('');
      setCabAssigned('');
    }
    setIsScheduleModalOpen(true);
  };

  // Submit Schedule Form
  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === Number(selectedLeadId));
    const project = projects.find((p) => p.id === selectedProjectId);

    if (!lead || !project || !scheduledDateTime) {
      alert('Please select client, project, and visit time.');
      return;
    }

    const passCode = editingVisit?.passCode || `SV-${Math.floor(1000 + Math.random() * 9000)}`;

    const visitData: Omit<SiteVisit, 'id'> & { id?: string } = {
      id: editingVisit ? editingVisit.id : `sv-${Date.now()}`,
      leadId: lead.id,
      leadName: lead.name,
      leadMobile: lead.mobile,
      projectId: project.id,
      projectName: project.name,
      developerName: project.developerName,
      scheduledTime: scheduledDateTime,
      salesExecutive: salesExecutive.trim() || currentUser.name || 'Sales Team',
      telecaller: currentUser.name,
      pickupRequired,
      pickupAddress: pickupRequired ? pickupAddress.trim() : undefined,
      cabAssigned: pickupRequired ? cabAssigned.trim() : undefined,
      status: editingVisit ? editingVisit.status : 'Scheduled',
      passCode,
      createdAt: editingVisit ? editingVisit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveSiteVisit(visitData);

    // Update lead status in CRM pipeline to Site Visit
    if (onUpdateLeadStatus && lead.status !== 'Site Visit' && lead.status !== 'Booking' && lead.status !== 'Closed') {
      onUpdateLeadStatus(lead.id, 'Site Visit');
    }

    setIsScheduleModalOpen(false);
  };

  // Submit Feedback Form
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingFeedbackVisit) return;

    const updatedVisit: SiteVisit = {
      ...recordingFeedbackVisit,
      status: 'Conducted',
      conductedTime: new Date().toISOString().slice(0, 16),
      feedbackCategory,
      feedbackNotes: feedbackNotes.trim(),
      ratingStars: feedbackRating,
      updatedAt: new Date().toISOString(),
    };

    onSaveSiteVisit(updatedVisit);

    // Auto advance lead in CRM if feedback is positive
    if (onUpdateLeadStatus && recordingFeedbackVisit.leadId) {
      if (feedbackCategory === 'Hot - Ready to Book' || feedbackCategory === 'Negotiating') {
        onUpdateLeadStatus(recordingFeedbackVisit.leadId, 'Negotiation');
      }
    }

    setRecordingFeedbackVisit(null);
  };

  // WhatsApp Site Visit Pass Sharing
  const handleSharePassWhatsApp = (visit: SiteVisit) => {
    const formattedDate = new Date(visit.scheduledTime).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const text = `🏡 *SITE VISIT PASS — ${visit.projectName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
Hello *${visit.leadName}*,

Your digital pass for the upcoming project site visit is ready:

🏷️ *Pass Code:* ${visit.passCode || 'SV-VERIFIED'}
🏢 *Project:* ${visit.projectName} (${visit.developerName || 'Builder'})
📅 *Date & Time:* ${formattedDate}
👤 *Site Executive:* ${visit.salesExecutive}
${visit.pickupRequired ? `🚗 *Pickup Details:* ${visit.cabAssigned || 'Cab Provided'} (${visit.pickupAddress || 'Your Location'})` : '🚗 *Mode:* Self Visit'}

📍 *Project Location / Gate Entry:*
Please present this pass code at the site entrance gate. Our team looks forward to welcoming you!

Warm regards,
*Housing World Sales Desk*`;

    const cleanMobile = visit.leadMobile.replace(/\D/g, '');
    const mobileWithCountry = cleanMobile.startsWith('91') && cleanMobile.length === 12 ? cleanMobile : `91${cleanMobile}`;
    window.open(`https://wa.me/${mobileWithCountry}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-900/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Housing World Real Estate Workflow • Site Visits Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Site Visits & Digital Entry Passes
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Schedule site visits for real estate leads, generate digital entry passes, coordinate cab pickups, and record client feedback seamlessly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Site Visit</span>
          </button>
        </div>

        {/* Housing World Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium">Total Site Visits</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-blue-950/50 rounded-xl p-3 border border-blue-800/40">
            <p className="text-xs text-blue-300 font-medium">Scheduled / Upcoming</p>
            <p className="text-xl font-bold text-blue-400 mt-0.5">{stats.scheduledCount}</p>
          </div>
          <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-800/40">
            <p className="text-xs text-amber-300 font-medium">Today's Visits</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.todayCount}</p>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-800/40">
            <p className="text-xs text-emerald-300 font-medium">Conducted / Done</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.conductedCount}</p>
          </div>
          <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-800/40 col-span-2 sm:col-span-1">
            <p className="text-xs text-purple-300 font-medium">Hot Booking Intent</p>
            <p className="text-xl font-bold text-purple-400 mt-0.5">{stats.hotCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Visits' },
            { id: 'today', label: "Today's Schedule" },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'conducted', label: 'Conducted (Done)' },
            { id: 'pending_feedback', label: 'Needs Feedback' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client, mobile, pass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visits Cards Grid */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Site Visits Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No site visits recorded for the selected filter or search. Click the button above to schedule a new visit.
          </p>
          <button
            type="button"
            onClick={() => handleOpenScheduleModal()}
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-blue-500 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Schedule Site Visit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((visit) => {
            const isDone = visit.status === 'Conducted';
            const visitDate = new Date(visit.scheduledTime);
            const dateStr = visitDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const timeStr = visitDate.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={visit.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Header: Project & Pass Code */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Building2 className="w-3 h-3" />
                        {visit.projectName}
                      </span>
                      {visit.developerName && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{visit.developerName}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="inline-block font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {visit.passCode || 'SV-PASS'}
                      </span>
                      <div className="mt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                            visit.status === 'Conducted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : visit.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : visit.status === 'Rescheduled'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {visit.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{visit.leadName}</h4>
                      <a
                        href={`tel:${visit.leadMobile}`}
                        className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {visit.leadMobile}
                      </a>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {dateStr}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {timeStr}
                      </span>
                    </div>

                    {/* Executive & Pickup info */}
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Executive: <strong>{visit.salesExecutive}</strong></span>
                      </div>

                      {visit.pickupRequired ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-[11px] border border-emerald-200">
                          <Car className="w-3 h-3 text-emerald-600" />
                          <span>
                            Cab Pickup: <strong>{visit.cabAssigned || 'Assigned'}</strong> • {visit.pickupAddress || 'Client Location'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Navigation className="w-3 h-3" />
                          <span>Self-Drive / Direct Visit</span>
                        </div>
                      )}
                    </div>

                    {/* Feedback summary if conducted */}
                    {isDone && visit.feedbackCategory && (
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-800 text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded">
                            {visit.feedbackCategory}
                          </span>
                          <div className="flex items-center text-amber-500">
                            {[...Array(visit.ratingStars || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        {visit.feedbackNotes && (
                          <p className="text-slate-600 mt-1.5 text-[11px] line-clamp-2">
                            "{visit.feedbackNotes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* View Digital Pass */}
                    <button
                      type="button"
                      onClick={() => setViewingPassVisit(visit)}
                      className="text-xs text-slate-700 hover:text-blue-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pass</span>
                    </button>

                    {/* WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => handleSharePassWhatsApp(visit)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                      title="Send Digital Pass on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Mark Done / Record Feedback */}
                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRecordingFeedbackVisit(visit);
                          setFeedbackNotes('');
                          setFeedbackRating(5);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        Record Feedback
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRecordingFeedbackVisit(visit);
                          setFeedbackCategory(visit.feedbackCategory || 'Hot - Ready to Book');
                          setFeedbackNotes(visit.feedbackNotes || '');
                          setFeedbackRating(visit.ratingStars || 5);
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 cursor-pointer underline"
                      >
                        Edit Feedback
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteSiteVisit(visit.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete visit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE SITE VISIT MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingVisit ? 'Edit Site Visit' : 'Schedule Project Site Visit'}
                </h3>
                <p className="text-xs text-slate-500">
                  Housing World Lead Pipeline • Book site visit for client
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-4">
              {/* Select Lead */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Buyer / Lead *
                </label>
                <select
                  required
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choose Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.mobile}) - {l.project || 'General Inquiry'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Project */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Real Estate Project *
                </label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.developerName} • {p.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attending Sales Executive *
                  </label>
                  <input
                    type="text"
                    required
                    value={salesExecutive}
                    onChange={(e) => setSalesExecutive(e.target.value)}
                    placeholder="e.g. Sunny Choudhary"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Pickup / Cab logistics */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickupRequired}
                    onChange={(e) => setPickupRequired(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    Company Cab Pickup Required (Cab Facility)
                  </span>
                </label>

                {pickupRequired && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Client Pickup Address
                      </label>
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="e.g. Sector 54, Golf Course Road, Gurugram"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Cab / Driver Details (Optional)
                      </label>
                      <input
                        type="text"
                        value={cabAssigned}
                        onChange={(e) => setCabAssigned(e.target.value)}
                        placeholder="e.g. Swift Dzire HR26-AB-1234 (Ramesh: 9812345678)"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow cursor-pointer"
                >
                  Confirm & Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SITE VISIT FEEDBACK MODAL */}
      {recordingFeedbackVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setRecordingFeedbackVisit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Visit Feedback</h3>
                <p className="text-xs text-slate-500">
                  {recordingFeedbackVisit.leadName} • {recordingFeedbackVisit.projectName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visit Outcome Category *
                </label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-medium"
                >
                  <option value="Hot - Ready to Book">🔥 Hot - Ready to Book / Finalizing Unit</option>
                  <option value="Interested - Revisit with Family">👍 Interested - Revisit with Family</option>
                  <option value="Negotiating">🤝 Negotiating on Floor Rise / Payment Plan</option>
                  <option value="Liked Project - Budget Stretched">⚠️ Liked Project - Budget Stretched</option>
                  <option value="Not Interested - Location Issue">❌ Not Interested - Location Issue</option>
                  <option value="Not Interested - Price High">❌ Not Interested - Price High</option>
                </select>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Interest Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? 'text-amber-400 fill-current'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{feedbackRating} / 5 Stars</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site Executive Notes & Next Action
                </label>
                <textarea
                  rows={3}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="e.g. Client liked 3 BHK park facing tower. Wants token discount of ₹50k. Will call tomorrow."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecordingFeedbackVisit(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow cursor-pointer"
                >
                  Save & Advance Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL SITE VISIT PASS MODAL */}
      {viewingPassVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-blue-500/30 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <button
              type="button"
              onClick={() => setViewingPassVisit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pass Header */}
            <div className="text-center pb-4 border-b border-slate-800">
              <span className="text-[10px] tracking-widest uppercase font-bold text-blue-400 bg-blue-950 px-2.5 py-1 rounded-full border border-blue-800/60">
                Official Site Visit Pass
              </span>
              <h3 className="text-xl font-black text-white mt-2.5 tracking-tight">
                {viewingPassVisit.projectName}
              </h3>
              <p className="text-xs text-slate-400">{viewingPassVisit.developerName || 'Premier Real Estate'}</p>
            </div>

            {/* Ticket Notch Cutout Visual */}
            <div className="my-5 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 text-left">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Buyer Name</span>
                <p className="text-sm font-bold text-white">{viewingPassVisit.leadName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Date</span>
                  <p className="font-semibold text-slate-200">
                    {new Date(viewingPassVisit.scheduledTime).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Time</span>
                  <p className="font-semibold text-amber-400">
                    {new Date(viewingPassVisit.scheduledTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Attending Executive</span>
                <p className="text-xs font-semibold text-slate-200">{viewingPassVisit.salesExecutive}</p>
              </div>

              {/* Pass Code Barcode / Stamp */}
              <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400">Gate Pass Code:</span>
                  <p className="font-mono text-lg font-black text-emerald-400 tracking-wider">
                    {viewingPassVisit.passCode || 'SV-9912'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center">
                  <span className="text-[9px] font-mono text-slate-900 font-bold text-center leading-tight">
                    QR ENTRY
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSharePassWhatsApp(viewingPassVisit)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp to Client</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Print Pass</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
