import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Flame,
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  Trash2,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  Percent,
  Timer,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { CallLog, Lead, ActivePage } from '../types';
import { CALL_OUTCOMES } from '../data/initialData';
import {
  fmt,
  formatCallDuration,
  openWhatsApp,
  makePhoneCall,
  exportCallsToCSV,
} from '../utils/formatters';

interface CallTrackerViewProps {
  calls: CallLog[];
  leads: Lead[];
  teamMembers?: string[];
  onOpenLogModal: (lead?: Lead | null) => void;
  onDeleteCall: (id: string) => void;
  onViewLeadDetail: (lead: Lead) => void;
  onNavigate: (page: ActivePage) => void;
}

export const CallTrackerView: React.FC<CallTrackerViewProps> = ({
  calls,
  leads,
  teamMembers = [],
  onOpenLogModal,
  onDeleteCall,
  onViewLeadDetail,
  onNavigate,
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'yesterday' | 'week' | 'all'>('all');
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Metrics calculations
  const todayCalls = useMemo(
    () => calls.filter((c) => c.timestamp.slice(0, 10) === todayStr),
    [calls, todayStr]
  );

  const connectedCallsToday = useMemo(
    () =>
      todayCalls.filter(
        (c) =>
          c.outcome.startsWith('Connected') ||
          c.outcome === 'Connected - Site Visit Scheduled'
      ),
    [todayCalls]
  );

  const siteVisitsBookedToday = useMemo(
    () =>
      todayCalls.filter(
        (c) => c.outcome === 'Connected - Site Visit Scheduled'
      ).length,
    [todayCalls]
  );

  const totalConnectedAll = useMemo(
    () => calls.filter((c) => c.outcome.startsWith('Connected')),
    [calls]
  );

  const connectRate = todayCalls.length > 0
    ? Math.round((connectedCallsToday.length / todayCalls.length) * 100)
    : calls.length > 0
    ? Math.round((totalConnectedAll.length / calls.length) * 100)
    : 0;

  const avgConnectedDurationSec = useMemo(() => {
    const list = calls.filter((c) => c.durationSeconds > 0);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, c) => acc + c.durationSeconds, 0);
    return Math.round(sum / list.length);
  }, [calls]);

  // Active Callers dynamically from teamMembers and logged calls
  const activeCallers = useMemo(() => {
    const set = new Set<string>();
    (teamMembers || []).forEach((tm) => set.add(tm));
    calls.forEach((c) => {
      if (c.salesperson && c.salesperson.trim()) set.add(c.salesperson.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [teamMembers, calls]);

  // Executive 50 calls tracker stats
  const executiveStats = useMemo(() => {
    return activeCallers.map((name) => {
      const execCallsToday = todayCalls.filter((c) => c.salesperson === name);
      const connectedToday = execCallsToday.filter((c) =>
        c.outcome.startsWith('Connected')
      ).length;
      const visitsScheduled = execCallsToday.filter(
        (c) => c.outcome === 'Connected - Site Visit Scheduled'
      ).length;
      const target = 50; // Standard real estate telecalling benchmark
      const progressPct = Math.min(100, Math.round((execCallsToday.length / target) * 100));

      return {
        name,
        callsToday: execCallsToday.length,
        connectedToday,
        visitsScheduled,
        target,
        progressPct,
      };
    });
  }, [activeCallers, todayCalls]);

  // Filtered Calls list
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Date filter
      if (selectedDateRange === 'today') {
        if (call.timestamp.slice(0, 10) !== todayStr) return false;
      } else if (selectedDateRange === 'yesterday') {
        if (call.timestamp.slice(0, 10) !== yesterday) return false;
      } else if (selectedDateRange === 'week') {
        if (call.timestamp < sevenDaysAgo) return false;
      }

      // Executive filter
      if (selectedExecutive !== 'all' && call.salesperson !== selectedExecutive) {
        return false;
      }

      // Type filter
      if (selectedTypeFilter !== 'all' && call.callType !== selectedTypeFilter) {
        return false;
      }

      // Outcome filter
      if (selectedOutcomeFilter !== 'all') {
        if (selectedOutcomeFilter === 'connected') {
          if (!call.outcome.startsWith('Connected')) return false;
        } else if (selectedOutcomeFilter === 'not_connected') {
          if (!call.outcome.startsWith('Not Connected')) return false;
        } else if (selectedOutcomeFilter === 'site_visit') {
          if (call.outcome !== 'Connected - Site Visit Scheduled') return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = call.leadName.toLowerCase().includes(q);
        const matchesMobile = call.mobile.includes(q);
        const matchesProject = (call.project || '').toLowerCase().includes(q);
        const matchesNotes = (call.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesProject && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [
    calls,
    selectedDateRange,
    selectedExecutive,
    selectedTypeFilter,
    selectedOutcomeFilter,
    searchQuery,
    todayStr,
    yesterday,
    sevenDaysAgo,
  ]);

  // Helper to find lead object
  const findLead = (call: CallLog): Lead | undefined => {
    if (call.leadId) return leads.find((l) => l.id === call.leadId);
    return leads.find((l) => l.mobile === call.mobile);
  };

  const getOutcomeConfig = (outcome: string) => {
    const found = CALL_OUTCOMES.find((o) => o.value === outcome);
    if (found) return found;
    return {
      value: outcome,
      category: 'connected',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700 font-medium',
      border: 'border-slate-200',
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Telecalling & Call Tracker
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              50 Calls/Day Benchmark
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time call logs, customer discussion notes, connectivity rate, and team quota tracker.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportCallsToCSV(filteredCalls)}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Export filtered call records to CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLogModal()}
            className="px-4 py-2 text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sky-600/20 active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Call</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">Calls Today</span>
            <PhoneCall className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-sky-950 font-mono">
              {todayCalls.length}
            </span>
            <span className="text-xs text-sky-700 ml-1.5">/ 250 Team Goal</span>
          </div>
          <p className="text-[11px] text-sky-600 mt-1">
            {todayCalls.length >= 250 ? '🎉 Daily goal achieved!' : `${250 - todayCalls.length} calls remaining`}
          </p>
        </div>

        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Connected Calls</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-950 font-mono">
              {connectedCallsToday.length}
            </span>
            <span className="text-xs text-emerald-700 ml-1.5">({connectRate}%)</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            Productive conversations
          </p>
        </div>

        <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">Site Visits Booked</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-950 font-mono">
              {siteVisitsBookedToday}
            </span>
            <span className="text-xs text-purple-700 ml-1.5">visits</span>
          </div>
          <p className="text-[11px] text-purple-600 mt-1">
            Scheduled directly from calls
          </p>
        </div>

        <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Avg Duration</span>
            <Timer className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-indigo-950 font-mono">
              {formatCallDuration(avgConnectedDurationSec)}
            </span>
          </div>
          <p className="text-[11px] text-indigo-600 mt-1">
            Per connected conversation
          </p>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">All-Time Calls</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {calls.length}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">logged</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Housing Worlds lead records
          </p>
        </div>
      </div>

      {/* Salesperson Daily 50-Calls Benchmark Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>Sales Executives Calling Quota (50 Calls / Day)</span>
              <span className="text-xs font-normal text-slate-500">
                Today's live progress
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Click any executive card below to instantly filter their calling history.
            </p>
          </div>

          {selectedExecutive !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedExecutive('all')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold self-start sm:self-auto cursor-pointer"
            >
              Reset Executive Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {executiveStats.map((exec) => {
            const isSelected = selectedExecutive === exec.name;
            return (
              <div
                key={exec.name}
                onClick={() =>
                  setSelectedExecutive((prev) => (prev === exec.name ? 'all' : exec.name))
                }
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-200'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {exec.name}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      exec.callsToday >= 50
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {exec.callsToday}/50
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      exec.callsToday >= 50
                        ? 'bg-emerald-500'
                        : exec.callsToday >= 30
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${exec.progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>{exec.connectedToday} Connected</span>
                  {exec.visitsScheduled > 0 && (
                    <span className="font-semibold text-purple-700">
                      {exec.visitsScheduled} Visit{exec.visitsScheduled > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call History Table & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, mobile, project, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Selector */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
            </select>

            {/* Salesperson Selector */}
            <select
              value={selectedExecutive}
              onChange={(e) => setSelectedExecutive(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Executives</option>
              {activeCallers.map((tm) => (
                <option key={tm} value={tm}>
                  {tm}
                </option>
              ))}
            </select>

            {/* Outcome Filter */}
            <select
              value={selectedOutcomeFilter}
              onChange={(e) => setSelectedOutcomeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Outcomes</option>
              <option value="connected">Connected Only</option>
              <option value="site_visit">Site Visit Scheduled</option>
              <option value="not_connected">Ringing / Unanswered</option>
            </select>

            {/* Call Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Types</option>
              <option value="Outgoing">Outgoing</option>
              <option value="Incoming">Incoming</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Client / Mobile</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Executive</th>
                <th className="py-3 px-4">Call Outcome</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Discussion Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-700">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <PhoneCall className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No call logs found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try resetting your filters or log a new call for your real estate leads.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedExecutive('all');
                        setSelectedDateRange('all');
                        setSelectedOutcomeFilter('all');
                        setSelectedTypeFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const outcomeCfg = getOutcomeConfig(call.outcome);
                  const linkedLead = findLead(call);

                  return (
                    <tr
                      key={call.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs">
                          {fmt(call.timestamp)}
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {call.callType === 'Outgoing' && <PhoneForwarded className="w-3 h-3 text-sky-600" />}
                          {call.callType === 'Incoming' && <PhoneIncoming className="w-3 h-3 text-emerald-600" />}
                          {call.callType === 'Follow-up' && <Clock className="w-3 h-3 text-indigo-600" />}
                          {call.callType}
                        </span>
                      </td>

                      {/* Client & Mobile */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {call.leadName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-slate-500">
                            +91 {call.mobile}
                          </span>
                          <button
                            type="button"
                            onClick={() => makePhoneCall(call.mobile)}
                            className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            title="Call this client"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openWhatsApp(call.mobile)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                            title="Open WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {call.project ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {call.project}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Executive */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {call.salesperson}
                        </span>
                      </td>

                      {/* Outcome Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs border ${outcomeCfg.badgeBg} ${outcomeCfg.border} ${outcomeCfg.badgeText}`}
                        >
                          {call.outcome}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            call.durationSeconds > 0
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatCallDuration(call.durationSeconds)}
                        </span>
                      </td>

                      {/* Discussion Notes */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {call.notes || 'No remarks added.'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {linkedLead && (
                            <button
                              type="button"
                              onClick={() => onViewLeadDetail(linkedLead)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Lead Profile"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenLogModal(linkedLead || null)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Log Follow-up Call"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteCall(call.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Call Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong>{filteredCalls.length}</strong> of{' '}
            <strong>{calls.length}</strong> total call logs
          </span>
          <span className="text-slate-400 text-[11px]">
            Tip: Calls auto-sync remarks & status to corresponding lead files.
          </span>
        </div>
      </div>
    </div>
  );
};
