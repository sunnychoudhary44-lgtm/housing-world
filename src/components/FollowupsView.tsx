import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  MessageCircle,
  PhoneCall,
  CalendarCheck,
  CheckCircle,
  RotateCw,
  Edit2,
  CalendarPlus,
} from 'lucide-react';
import { Lead } from '../types';
import { fmt, openWhatsApp, makePhoneCall, getFollowupTiming } from '../utils/formatters';

interface FollowupsViewProps {
  leads: Lead[];
  onEditLead: (id: number) => void;
  onQuickReschedule: (id: number, daysToAdd: number) => void;
  onMarkContacted: (id: number) => void;
  onViewLeadDetail: (lead: Lead) => void;
}

export const FollowupsView: React.FC<FollowupsViewProps> = ({
  leads,
  onEditLead,
  onQuickReschedule,
  onMarkContacted,
  onViewLeadDetail,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowIso = now.toISOString().slice(0, 16);

  // Counters matching prompt
  const todayCount = leads.filter(
    (l) => l.followup && l.followup.slice(0, 10) === todayStr
  ).length;

  const overdueCount = leads.filter(
    (l) =>
      l.followup &&
      l.followup < nowIso &&
      !['Booking', 'Closed', 'Lost'].includes(l.status)
  ).length;

  const upcomingCount = leads.filter(
    (l) => l.followup && new Date(l.followup) > now
  ).length;

  // Sorted leads with follow-up
  const followLeads = useMemo(() => {
    const list = leads.filter((l) => l.followup && l.followup.trim() !== '');

    // Sort chronologically
    list.sort((a, b) => a.followup.localeCompare(b.followup));

    if (filterTab === 'overdue') {
      return list.filter((l) => getFollowupTiming(l.followup, l.status) === 'overdue');
    }
    if (filterTab === 'today') {
      return list.filter(
        (l) =>
          l.followup.slice(0, 10) === todayStr ||
          getFollowupTiming(l.followup, l.status) === 'today'
      );
    }
    if (filterTab === 'upcoming') {
      return list.filter((l) => getFollowupTiming(l.followup, l.status) === 'upcoming');
    }
    return list;
  }, [leads, filterTab, todayStr]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Follow-ups Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Never miss a call or client commitment. Track overdue, today's visits, and upcoming meetings.
          </p>
        </div>
      </div>

      {/* Follow-up Metric Cards (Today, Overdue, Upcoming) */}
      <div id="followCards" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Today */}
        <div
          onClick={() => setFilterTab(filterTab === 'today' ? 'all' : 'today')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'today'
              ? 'ring-2 ring-blue-500 bg-blue-50/70 border-blue-300'
              : 'bg-white hover:bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today
            </small>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-900 mt-1">{todayCount}</div>
          <p className="text-xs text-slate-400 mt-1">Due today for calls or visits</p>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setFilterTab(filterTab === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'overdue'
              ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-300'
              : overdueCount > 0
              ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/50'
              : 'bg-white border-slate-200 hover:bg-slate-50/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Overdue
            </small>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div
            className={`text-3xl font-extrabold mt-1 ${
              overdueCount > 0 ? 'text-rose-600' : 'text-slate-700'
            }`}
          >
            {overdueCount}
          </div>
          <p className="text-xs text-rose-600/80 mt-1">
            {overdueCount > 0 ? 'Action required immediately' : 'Zero overdue calls'}
          </p>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setFilterTab(filterTab === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filterTab === 'upcoming'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-300'
              : 'bg-white hover:bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming
            </small>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-900 mt-1">{upcomingCount}</div>
          <p className="text-xs text-slate-400 mt-1">Scheduled in coming days</p>
        </div>
      </div>

      {/* Filter Tabs & Quick Actions */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          All Follow-ups ({leads.filter((l) => l.followup).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('overdue')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === 'overdue'
              ? 'bg-rose-600 text-white'
              : 'text-rose-700 hover:bg-rose-100/60'
          }`}
        >
          Overdue ({overdueCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('today')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === 'today'
              ? 'bg-blue-600 text-white'
              : 'text-blue-700 hover:bg-blue-100/60'
          }`}
        >
          Today ({todayCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('upcoming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filterTab === 'upcoming'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-700 hover:bg-emerald-100/60'
          }`}
        >
          Upcoming ({upcomingCount})
        </button>
      </div>

      {/* Follow-ups Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Follow-up Date & Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4 text-center">Quick Action</th>
              </tr>
            </thead>
            <tbody id="followRows" className="divide-y divide-slate-100 text-slate-700">
              {followLeads.length > 0 ? (
                followLeads.map((l) => {
                  const timing = getFollowupTiming(l.followup, l.status);
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => onViewLeadDetail(l)}
                    >
                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-blue-600">{l.name}</span>
                          {l.priority === 'Hot' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1 py-0.5 rounded">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5 truncate max-w-xs">
                          {l.project ? `Proj: ${l.project}` : ''}{' '}
                          {l.remarks ? `• ${l.remarks}` : ''}
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-800 text-xs">
                        +91 {l.mobile}
                      </td>

                      {/* Follow-up Timing */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            timing === 'overdue'
                              ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                              : timing === 'today'
                              ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{fmt(l.followup)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {l.status}
                        </span>
                      </td>

                      {/* Salesperson */}
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {l.salesperson || 'Unassigned'}
                      </td>

                      {/* Action buttons matching user's spec: WhatsApp, Update, plus quick reschedule */}
                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                l.mobile,
                                `नमस्ते ${l.name} जी, Housing Worlds से ${l.salesperson || 'टीम'}। आज हमारे फॉलो-अप के अनुसार आपसे चर्चा करनी थी।`
                              )
                            }
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-700" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditLead(l.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Update Lead or Follow-up"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Update</span>
                          </button>

                          {/* Quick Reschedule: +1 day */}
                          <button
                            type="button"
                            onClick={() => onQuickReschedule(l.id, 1)}
                            className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            title="Push follow-up by +1 day"
                          >
                            +1 Day
                          </button>

                          {/* Mark contacted */}
                          <button
                            type="button"
                            onClick={() => onMarkContacted(l.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Mark Contacted"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="font-medium text-slate-600">No follow-ups in this view</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All leads for this tab have been addressed or rescheduled.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
