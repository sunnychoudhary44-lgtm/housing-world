import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  Clock,
  Play,
  Square,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Tag,
  FileText,
} from 'lucide-react';
import { Lead, LeadStatus, CallLog, CallOutcome, CallType, AuthUser } from '../types';
import { CALL_OUTCOMES, COMMON_PROJECTS, STATUSES } from '../data/initialData';
import { cleanMobile, formatCallDuration, makePhoneCall } from '../utils/formatters';

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  currentUser?: AuthUser | null;
  teamMembers?: string[];
  initialLead?: Lead | null;
  onSaveCall: (callData: Omit<CallLog, 'id'>, syncLead: boolean) => void;
}

export const LogCallModal: React.FC<LogCallModalProps> = ({
  isOpen,
  onClose,
  leads,
  currentUser,
  teamMembers = [],
  initialLead,
  onSaveCall,
}) => {
  const isUserRole = currentUser?.role === 'user';
  const defaultSalesperson = isUserRole && currentUser?.name ? currentUser.name : (teamMembers[0] || currentUser?.name || 'Sales Team');

  // Form state
  const [selectedLeadId, setSelectedLeadId] = useState<number | ''>('');
  const [leadName, setLeadName] = useState('');
  const [mobile, setMobile] = useState('');
  const [salesperson, setSalesperson] = useState(defaultSalesperson);
  const [project, setProject] = useState(COMMON_PROJECTS[0]);
  const [callType, setCallType] = useState<CallType>('Outgoing');
  const [outcome, setOutcome] = useState<CallOutcome>('Connected - Interested');
  const [durationSeconds, setDurationSeconds] = useState<number>(120);
  const [notes, setNotes] = useState('');

  // Sync to Lead options
  const [syncStatus, setSyncStatus] = useState(true);
  const [newLeadStatus, setNewLeadStatus] = useState<LeadStatus>('Contacted');
  const [syncFollowup, setSyncFollowup] = useState(false);
  const [nextFollowup, setNextFollowup] = useState('');

  // Live Stopwatch
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Initialize or reset when modal opens or initialLead changes
  useEffect(() => {
    if (isOpen) {
      if (initialLead) {
        setSelectedLeadId(initialLead.id);
        setLeadName(initialLead.name);
        setMobile(initialLead.mobile);
        setSalesperson(
          isUserRole && currentUser?.name
            ? currentUser.name
            : initialLead.salesperson || defaultSalesperson
        );
        setProject(initialLead.project || COMMON_PROJECTS[0]);
        setNewLeadStatus(
          initialLead.status === 'New' ? 'Contacted' : initialLead.status
        );
        // Default follow-up to tomorrow same time if needed
        const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
        setNextFollowup(tomorrow.toISOString().slice(0, 16));
      } else {
        setSelectedLeadId('');
        setLeadName('');
        setMobile('');
        setSalesperson(defaultSalesperson);
        setProject(COMMON_PROJECTS[0]);
        setNewLeadStatus('Contacted');
        setNextFollowup('');
      }
      setCallType('Outgoing');
      setOutcome('Connected - Interested');
      setDurationSeconds(120);
      setNotes('');
      setSyncStatus(true);
      setSyncFollowup(false);
      setIsTimerRunning(false);
      setTimerSeconds(0);
    }
  }, [isOpen, initialLead]);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setDurationSeconds(timerSeconds);
  };

  const handleStartTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  // When selecting an existing lead from the dropdown
  const handleSelectLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedLeadId('');
      return;
    }
    const id = parseInt(val, 10);
    setSelectedLeadId(id);
    const found = leads.find((l) => l.id === id);
    if (found) {
      setLeadName(found.name);
      setMobile(found.mobile);
      if (found.salesperson) setSalesperson(found.salesperson);
      if (found.project) setProject(found.project);
      setNewLeadStatus(found.status);
    }
  };

  // Outcome change auto-suggests status
  const handleOutcomeChange = (newOutcome: CallOutcome) => {
    setOutcome(newOutcome);
    if (newOutcome === 'Connected - Site Visit Scheduled') {
      setNewLeadStatus('Site Visit');
      setSyncStatus(true);
      setSyncFollowup(true);
    } else if (newOutcome === 'Connected - Interested') {
      if (newLeadStatus === 'New') setNewLeadStatus('Interested');
    } else if (newOutcome === 'Connected - Not Interested' || newOutcome === 'Invalid Number') {
      setNewLeadStatus('Lost');
    } else if (newOutcome.startsWith('Not Connected')) {
      setDurationSeconds(0);
    }
  };

  const handleSave = (andDial = false) => {
    if (!leadName.trim()) {
      alert('Please enter or select customer name');
      return;
    }
    if (!mobile.trim() || cleanMobile(mobile).length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    const finalDuration = isTimerRunning ? timerSeconds : durationSeconds;
    if (isTimerRunning) {
      setIsTimerRunning(false);
    }

    const callData: Omit<CallLog, 'id'> = {
      leadId: selectedLeadId ? Number(selectedLeadId) : undefined,
      leadName: leadName.trim(),
      mobile: cleanMobile(mobile),
      salesperson,
      project,
      callType,
      outcome,
      durationSeconds: finalDuration,
      timestamp: new Date().toISOString(),
      notes: notes.trim(),
      updatedLeadStatus: syncStatus ? newLeadStatus : undefined,
      rescheduledFollowup: syncFollowup && nextFollowup ? nextFollowup : undefined,
    };

    onSaveCall(callData, true);

    if (andDial) {
      makePhoneCall(mobile);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Log Call Record</h3>
              <p className="text-xs text-slate-300">
                Track phone conversation, client response, and auto-update lead
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Live Call Timer Bar */}
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-sky-600 animate-pulse' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-700">Live Call Stopwatch:</span>
                <span className="ml-2 font-mono font-bold text-slate-900 text-sm">
                  {Math.floor((isTimerRunning ? timerSeconds : durationSeconds) / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {((isTimerRunning ? timerSeconds : durationSeconds) % 60)
                    .toString()
                    .padStart(2, '0')}
                </span>
                {isTimerRunning && (
                  <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded animate-pulse">
                    RECORDING CALL
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isTimerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Timer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopTimer}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop & Set</span>
                </button>
              )}
            </div>
          </div>

          {/* Existing Lead Picker (if not locked to initialLead) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Lead (Optional)
            </label>
            <select
              value={selectedLeadId}
              onChange={handleSelectLeadChange}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Direct Call / Unlisted Lead --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.mobile}) — {l.project || 'No Project'} [{l.salesperson || 'Unassigned'}]
                </option>
              ))}
            </select>
          </div>

          {/* Contact Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. Rameshwar Sharma"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 text-xs text-slate-500 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Salesperson & Project Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span>Calling Executive</span>
                {isUserRole && (
                  <span className="text-[10px] text-blue-600 font-medium">Locked to you</span>
                )}
              </label>

              {isUserRole ? (
                <div className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-semibold flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentUser?.name || salesperson}</span>
                </div>
              ) : (
                <select
                  value={salesperson}
                  onChange={(e) => setSalesperson(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {Array.from(new Set([...teamMembers, ...(salesperson ? [salesperson] : [])]))
                    .filter(Boolean)
                    .map((tm) => (
                      <option key={tm} value={tm}>
                        {tm}
                      </option>
                    ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Township / Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {COMMON_PROJECTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Call Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Call Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Outgoing', 'Incoming', 'Follow-up'] as CallType[]).map((type) => {
                const isSelected = callType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCallType(type)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {type === 'Outgoing' && <PhoneForwarded className="w-3.5 h-3.5 text-sky-600" />}
                    {type === 'Incoming' && <PhoneIncoming className="w-3.5 h-3.5 text-emerald-600" />}
                    {type === 'Follow-up' && <Clock className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call Outcome Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Call Outcome / Customer Response <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CALL_OUTCOMES.map((oc) => {
                const isSelected = outcome === oc.value;
                return (
                  <button
                    key={oc.value}
                    type="button"
                    onClick={() => handleOutcomeChange(oc.value)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `${oc.badgeBg} ${oc.border} ring-2 ring-sky-400 font-bold`
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={isSelected ? oc.badgeText : 'text-slate-800'}>
                      {oc.value}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration Preset Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">
                Call Duration: <span className="text-slate-900 font-bold font-mono">{formatCallDuration(durationSeconds)}</span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: '0s (No Ans)', sec: 0 },
                { label: '30s', sec: 30 },
                { label: '1 min', sec: 60 },
                { label: '2 min', sec: 120 },
                { label: '3 min', sec: 180 },
                { label: '5 min', sec: 300 },
                { label: '10 min', sec: 600 },
              ].map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => setDurationSeconds(item.sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    durationSeconds === item.sec
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Call Conversation Notes & Requirements
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Budget ₹15L, wants 100 Gaj facing road in Nekpur. Agreed for site visit with family on Sunday."
              className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Lead Auto-Update Options */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <span className="text-xs font-bold text-slate-700 block">
              Auto-Sync with Lead Pipeline
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={syncStatus}
                  onChange={(e) => setSyncStatus(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Update Lead Status to:</span>
              </label>

              {syncStatus && (
                <select
                  value={newLeadStatus}
                  onChange={(e) => setNewLeadStatus(e.target.value as LeadStatus)}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-slate-200/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={syncFollowup}
                  onChange={(e) => setSyncFollowup(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Schedule Next Follow-up:</span>
              </label>

              {syncFollowup && (
                <input
                  type="datetime-local"
                  value={nextFollowup}
                  onChange={(e) => setNextFollowup(e.target.value)}
                  className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Save & Call</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Save Call Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
