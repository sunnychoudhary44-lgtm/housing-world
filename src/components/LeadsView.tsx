import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  MessageCircle,
  PhoneCall,
  Edit2,
  Trash2,
  Calendar,
  X,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { STATUSES, TEAM_MEMBERS } from '../data/initialData';
import { fmt, openWhatsApp, makePhoneCall, getFollowupTiming } from '../utils/formatters';

interface LeadsViewProps {
  leads: Lead[];
  onAddNewLead: () => void;
  onEditLead: (id: number) => void;
  onDeleteLead: (id: number) => void;
  onUpdateLeadStatus: (id: number, newStatus: LeadStatus) => void;
  onViewLeadDetail: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onAddNewLead,
  onEditLead,
  onDeleteLead,
  onUpdateLeadStatus,
  onViewLeadDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Extract unique projects for project filter
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.project && l.project.trim()) set.add(l.project.trim());
    });
    return Array.from(set);
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return leads.filter((l) => {
      // Search matches name, mobile, project, source, salesperson, remarks
      if (q) {
        const combined = `${l.name} ${l.mobile} ${l.project} ${l.source} ${l.salesperson} ${l.remarks || ''}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      if (statusFilter && l.status !== statusFilter) return false;
      if (salespersonFilter && l.salesperson !== salespersonFilter) return false;
      if (priorityFilter && l.priority !== priorityFilter) return false;
      if (projectFilter && l.project !== projectFilter) return false;
      return true;
    });
  }, [leads, searchTerm, statusFilter, salespersonFilter, priorityFilter, projectFilter]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(statusFilter) ||
    Boolean(salespersonFilter) ||
    Boolean(priorityFilter) ||
    Boolean(projectFilter);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSalespersonFilter('');
    setPriorityFilter('');
    setProjectFilter('');
  };

  return (
    <div className="space-y-4">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Lead Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter, assign, update follow-ups, and connect via WhatsApp or Phone call.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-leads-add-primary"
            type="button"
            onClick={onAddNewLead}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-blue-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name / Mobile / Project / Salesperson..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter leads by status"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer text-slate-700 font-medium"
            >
              <option value="">All Statuses ({leads.length})</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st} ({leads.filter((l) => l.status === st).length})
                </option>
              ))}
            </select>

            {/* Salesperson Filter */}
            <select
              id="salespersonFilter"
              value={salespersonFilter}
              onChange={(e) => setSalespersonFilter(e.target.value)}
              aria-label="Filter leads by salesperson"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer text-slate-700 font-medium hidden sm:block"
            >
              <option value="">All Sales Team</option>
              {TEAM_MEMBERS.map((tm) => (
                <option key={tm} value={tm}>
                  {tm}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              id="priorityFilter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter leads by priority"
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer text-slate-700 font-medium hidden md:block"
            >
              <option value="">All Priority</option>
              <option value="Hot">🔥 Hot</option>
              <option value="High">⚡ High</option>
              <option value="Normal">Normal</option>
            </select>

            {/* Project Filter */}
            {uniqueProjects.length > 0 && (
              <select
                id="projectFilter"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                aria-label="Filter leads by project"
                className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer text-slate-700 font-medium hidden lg:block"
              >
                <option value="">All Projects</option>
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Clear all active filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter Info Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-900 font-semibold">{filteredLeads.length}</strong> of{' '}
            <strong className="text-slate-900 font-semibold">{leads.length}</strong> leads
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Hot
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Booking/Closed
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Site Visit
            </span>
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Name & Priority</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="leadRows" className="divide-y divide-slate-100 text-slate-700">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((l) => {
                  const timing = getFollowupTiming(l.followup, l.status);
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                      onClick={() => onViewLeadDetail(l)}
                    >
                      {/* Name & Priority */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {l.name}
                          </span>
                          {l.priority === 'Hot' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded">
                              HOT 🔥
                            </span>
                          )}
                          {l.priority === 'High' && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                              HIGH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {l.budget ? `${l.budget}` : ''} {l.size ? `• ${l.size}` : ''}
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-800 text-xs font-medium">
                          +91 {l.mobile}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {l.project || '—'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {l.source}
                        </span>
                      </td>

                      {/* Status with inline quick switcher */}
                      <td
                        className="py-3 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={l.status}
                          onChange={(e) =>
                            onUpdateLeadStatus(l.id, e.target.value as LeadStatus)
                          }
                          aria-label={`Change status for lead ${l.name}`}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border outline-none cursor-pointer ${
                            l.status === 'Booking' || l.status === 'Closed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : l.status === 'Site Visit'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : l.status === 'Negotiation'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : l.status === 'Follow-up'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : l.status === 'Lost'
                              ? 'bg-slate-100 text-slate-600 border-slate-300'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span
                            className={`text-xs ${
                              timing === 'overdue'
                                ? 'text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                                : timing === 'today'
                                ? 'text-amber-700 font-semibold'
                                : 'text-slate-600'
                            }`}
                          >
                            {fmt(l.followup)}
                          </span>
                        </div>
                      </td>

                      {/* Salesperson */}
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {l.salesperson ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              {l.salesperson.slice(0, 1)}
                            </span>
                            <span>{l.salesperson}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions: Edit, WhatsApp, Call, Delete */}
                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                l.mobile,
                                `नमस्ते ${l.name} जी, Housing Worlds से ${l.salesperson || 'टीम'}। ${l.project ? `प्रोजेक्ट ${l.project}` : ''} के संदर्भ में संपर्क किया।`
                              )
                            }
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => makePhoneCall(l.mobile)}
                            className="p-1.5 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title="Call Phone"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditLead(l.id)}
                            className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteLead(l.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <SlidersHorizontal className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No leads found matching your criteria</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try modifying search query or clearing status filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
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
