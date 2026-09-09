import React from 'react';
import { Lead } from '../types';
import {
  TrendingUp,
  Award,
  Users2,
  UserX,
  PieChart,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { parseGaj } from '../utils/formatters';

interface ReportsViewProps {
  leads: Lead[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ leads }) => {
  const totalLeads = leads.length;

  const bookings = leads.filter(
    (l) => l.status === 'Booking' || l.status === 'Closed'
  ).length;

  const conversionRate = totalLeads
    ? Math.round((bookings / totalLeads) * 100)
    : 0;

  const activeLeads = leads.filter(
    (l) => !['Closed', 'Lost'].includes(l.status)
  ).length;

  const lostLeads = leads.filter((l) => l.status === 'Lost').length;

  // Source performance breakdown
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.source || 'Other';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);

  // Project performance breakdown
  const projectCounts: Record<string, { count: number; bookedGaj: number }> = {};
  leads.forEach((l) => {
    const proj = l.project?.trim() || 'General Inquiry';
    if (!projectCounts[proj]) {
      projectCounts[proj] = { count: 0, bookedGaj: 0 };
    }
    projectCounts[proj].count += 1;
    if (['Booking', 'Closed'].includes(l.status)) {
      projectCounts[proj].bookedGaj += parseGaj(l.size);
    }
  });

  const sortedProjects = Object.entries(projectCounts).sort(
    (a, b) => b[1].count - a[1].count
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Reports & Pipeline Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key conversion metrics, source attribution, and project-wise distribution.
          </p>
        </div>
      </div>

      {/* 4 Cards matching user's exact specification: Conversion, Bookings, Active Leads, Lost */}
      <div id="reportCards" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Conversion */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Conversion Rate
            </small>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">{conversionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Bookings / Total Leads</p>
        </div>

        {/* Bookings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Bookings & Closed
            </small>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1">{bookings}</div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Tokens & full registries</p>
        </div>

        {/* Active Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Active Leads
            </small>
            <Users2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-900 mt-1">{activeLeads}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">In active discussion stages</p>
        </div>

        {/* Lost */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <small className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Lost
            </small>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">{lostLeads}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dropped or budget mismatch</p>
        </div>
      </div>

      {/* Two-Column Breakdown: Lead Source Performance & Project Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Source Performance Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Lead Source Performance
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {sortedSources.length} Channels
            </span>
          </div>

          <div id="sourceReport" className="space-y-3.5">
            {sortedSources.length > 0 ? (
              sortedSources.map(([srcName, count]) => {
                const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={srcName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                      <span className="text-slate-800 font-semibold">{srcName}</span>
                      <span className="text-slate-500">
                        <strong className="text-slate-900">{count}</strong> leads ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No source data available</p>
            )}
          </div>
        </div>

        {/* Project Performance Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Project-Wise Demand
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {sortedProjects.length} Projects
            </span>
          </div>

          <div className="space-y-3.5">
            {sortedProjects.length > 0 ? (
              sortedProjects.map(([projName, info]) => {
                const pct = totalLeads ? Math.round((info.count / totalLeads) * 100) : 0;
                return (
                  <div key={projName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                      <span className="text-slate-800 font-semibold">{projName}</span>
                      <span className="text-slate-500 text-xs">
                        <strong className="text-slate-900">{info.count}</strong> inquiries{' '}
                        {info.bookedGaj > 0 && (
                          <span className="text-emerald-600 font-bold ml-1">
                            • {info.bookedGaj} Gaj Booked
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No project data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
