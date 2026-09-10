import React from 'react';
import { Lead, AuthUser } from '../types';
import { TEAM_MEMBERS, TEAM_TARGETS } from '../data/initialData';
import { parseGaj } from '../utils/formatters';
import { Trophy, Target, Users, TrendingUp, Award, CheckCircle2, Lock, Shield } from 'lucide-react';

interface TeamViewProps {
  leads: Lead[];
  currentUser?: AuthUser | null;
}

export const TeamView: React.FC<TeamViewProps> = ({ leads, currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';

  // Filter team members based on role
  const displayedMembers = isAdmin
    ? TEAM_MEMBERS
    : TEAM_MEMBERS.filter((t) => t.toLowerCase() === (currentUser?.name || '').toLowerCase());

  // Compute metrics
  const teamStats = displayedMembers.map((t) => {
    const a = leads.filter((l) => l.salesperson === t);
    const totalLeads = a.length;
    const followups = a.filter((l) => l.status === 'Follow-up').length;
    const siteVisits = a.filter((l) => l.status === 'Site Visit').length;
    const bookings = a.filter((l) => ['Booking', 'Closed'].includes(l.status)).length;
    const targetGaj = TEAM_TARGETS[t] || 50;

    const bookedGaj = a
      .filter((l) => ['Booking', 'Closed'].includes(l.status))
      .reduce((s, l) => s + parseGaj(l.size), 0);

    const percentAchieved =
      targetGaj > 0 ? Math.min(Math.round((bookedGaj / targetGaj) * 100), 100) : 0;

    return {
      name: t,
      leads: totalLeads,
      followups,
      siteVisits,
      bookings,
      targetGaj,
      bookedGaj,
      percentAchieved,
    };
  });

  // Identify top salesperson by booked Gaj (for admin)
  const topPerformer = [...teamStats].sort((a, b) => b.bookedGaj - a.bookedGaj)[0];
  const totalTarget = displayedMembers.reduce((sum, t) => sum + (TEAM_TARGETS[t] || 50), 0);
  const totalBooked = teamStats.reduce((a, b) => a + b.bookedGaj, 0);
  const overallTeamAchieved =
    totalTarget > 0 ? Math.round((totalBooked / totalTarget) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{isAdmin ? 'Sales Team Performance & Targets' : 'My Personal Target & Performance'}</span>
            {!isAdmin && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                🔒 Private Account View
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? 'Real estate plot sales targets in Gaj, site visit counts, and conversion benchmarks across all team members.'
              : `Sales targets in Gaj, site visits, and booking metrics assigned to ${currentUser?.name || 'you'}.`}
          </p>
        </div>

        {!isAdmin && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>अन्य टीम मेंबर्स का डेटा केवल कंपनी एडमिन के लिए सुरक्षित है।</span>
          </div>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total Team Target' : 'My Monthly Target'}
            </span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {totalTarget} <span className="text-sm font-semibold text-slate-500">Gaj</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? 'Combined monthly sales quota' : 'Assigned plot sales quota'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total Booked & Closed' : 'My Booked & Closed'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
            {totalBooked} <span className="text-sm font-semibold text-emerald-600">Gaj</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${overallTeamAchieved}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-emerald-700">{overallTeamAchieved}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-amber-50 to-orange-50/70 p-4 rounded-xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              {isAdmin ? 'Leaderboard Star' : 'Status & Quota'}
            </span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-950 mt-1">
            {isAdmin ? (topPerformer ? topPerformer.name : '—') : `${overallTeamAchieved}% Achieved`}
          </div>
          <p className="text-xs text-amber-800/80 mt-1">
            {isAdmin
              ? topPerformer
                ? `${topPerformer.bookedGaj} Gaj booked (${topPerformer.percentAchieved}% of quota)`
                : 'Target tracking active'
              : `${totalBooked} of ${totalTarget} Gaj booked so far`}
          </p>
        </div>
      </div>

      {/* Main Team Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Executive Scorecard</h3>
          </div>
          <span className="text-xs text-slate-500">Benchmark: 50 Calls / 2 Site Visits daily</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4 text-center">Total Leads</th>
                <th className="py-3 px-4 text-center">Follow-ups</th>
                <th className="py-3 px-4 text-center">Site Visits</th>
                <th className="py-3 px-4 text-center">Bookings</th>
                <th className="py-3 px-4 text-right">Target (Gaj)</th>
                <th className="py-3 px-4 text-right">Booked Gaj</th>
                <th className="py-3 px-4">Quota Progress</th>
              </tr>
            </thead>
            <tbody id="teamRows" className="divide-y divide-slate-100 text-slate-700">
              {teamStats.map((tm) => {
                const isStar = topPerformer && topPerformer.name === tm.name && tm.bookedGaj > 0;
                return (
                  <tr key={tm.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {tm.name.slice(0, 1)}
                      </div>
                      <span>{tm.name}</span>
                      {isStar && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Award className="w-3 h-3 text-amber-600" /> Star
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {tm.leads}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {tm.followups}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                        {tm.siteVisits}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {tm.bookings}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-600">
                      {tm.targetGaj} Gaj
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {tm.bookedGaj} Gaj
                    </td>
                    <td className="py-3.5 px-4 w-44">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {tm.bookedGaj} / {tm.targetGaj}
                          </span>
                          <span
                            className={`font-bold ${
                              tm.percentAchieved >= 80
                                ? 'text-emerald-600'
                                : tm.percentAchieved >= 40
                                ? 'text-blue-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {tm.percentAchieved}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              tm.percentAchieved >= 80
                                ? 'bg-emerald-500'
                                : tm.percentAchieved >= 40
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${tm.percentAchieved}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
