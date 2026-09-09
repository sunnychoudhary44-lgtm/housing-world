import React from 'react';
import {
  Users,
  Calendar,
  AlertOctagon,
  Flame,
  MapPin,
  CheckCircle,
  PhoneCall,
  Compass,
  ArrowUpRight,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { ActivePage, Lead } from '../types';
import { fmt, openWhatsApp, makePhoneCall, getFollowupTiming } from '../utils/formatters';

interface DashboardViewProps {
  leads: Lead[];
  onNavigate: (page: ActivePage) => void;
  onEditLead: (id: number) => void;
  onViewLeadDetail: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  onNavigate,
  onEditLead,
  onViewLeadDetail,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 16);

  const total = leads.length;
  const hot = leads.filter((l) => l.priority === 'Hot').length;

  const todayFollowups = leads.filter(
    (l) => l.followup && l.followup.slice(0, 10) === todayStr
  ).length;

  const overdue = leads.filter(
    (l) =>
      l.followup &&
      l.followup < nowIso &&
      !['Booking', 'Closed', 'Lost'].includes(l.status)
  ).length;

  const siteVisits = leads.filter((l) => l.status === 'Site Visit').length;
  const bookingsClosed = leads.filter(
    (l) => l.status === 'Booking' || l.status === 'Closed'
  ).length;

  // Metric card definitions
  const statCards = [
    {
      id: 'stat-total-leads',
      label: 'Total Leads',
      value: total,
      sub: 'All recorded inquiries',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/80 border-blue-200/60',
      textColor: 'text-blue-900',
      onClick: () => onNavigate('leads'),
    },
    {
      id: 'stat-today-followups',
      label: 'Today Follow-ups',
      value: todayFollowups,
      sub: 'Scheduled for today',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/80 border-indigo-200/60',
      textColor: 'text-indigo-900',
      onClick: () => onNavigate('followups'),
    },
    {
      id: 'stat-overdue',
      label: 'Overdue',
      value: overdue,
      sub: overdue > 0 ? 'Requires immediate action' : 'All caught up!',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600" />,
      bg: overdue > 0 ? 'bg-rose-50/90 border-rose-300' : 'bg-slate-50 border-slate-200',
      textColor: overdue > 0 ? 'text-rose-700 font-extrabold' : 'text-slate-800',
      onClick: () => onNavigate('followups'),
    },
    {
      id: 'stat-hot-leads',
      label: 'Hot Leads',
      value: hot,
      sub: 'High purchase intent',
      icon: <Flame className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/80 border-amber-200/70',
      textColor: 'text-amber-900',
      onClick: () => onNavigate('leads'),
    },
    {
      id: 'stat-site-visits',
      label: 'Site Visits',
      value: siteVisits,
      sub: 'On-ground plot visits',
      icon: <MapPin className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50/80 border-purple-200/70',
      textColor: 'text-purple-900',
      onClick: () => onNavigate('leads'),
    },
    {
      id: 'stat-bookings',
      label: 'Bookings/Closed',
      value: bookingsClosed,
      sub: 'Tokens & registered plots',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/80 border-emerald-200/70',
      textColor: 'text-emerald-900',
      onClick: () => onNavigate('reports'),
    },
    {
      id: 'stat-calls-target',
      label: '50 Calls Target',
      value: '50 / day',
      sub: 'Per executive benchmark',
      icon: <PhoneCall className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50/80 border-sky-200/70',
      textColor: 'text-sky-900',
      onClick: () => onNavigate('team'),
    },
    {
      id: 'stat-visits-target',
      label: '2 Site Visits Target',
      value: '2 / day',
      sub: 'Daily weekend push',
      icon: <Compass className="w-5 h-5 text-teal-600" />,
      bg: 'bg-teal-50/80 border-teal-200/70',
      textColor: 'text-teal-900',
      onClick: () => onNavigate('team'),
    },
  ];

  const recentLeads = [...leads].slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Sales & Operations Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Housing Worlds live activity, pipeline health, and real-time lead performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('add')}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            + New Lead Entry
          </button>
          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1"
          >
            <span>View All Leads</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 8 Primary Cards Grid (4 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div id="cards" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((c) => (
          <div
            key={c.id}
            id={c.id}
            onClick={c.onClick}
            className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${c.bg}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <small className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {c.label}
              </small>
              <div className="p-1.5 rounded-lg bg-white/80 shadow-xs">{c.icon}</div>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${c.textColor}`}>
              {c.value}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Leads</h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            See all ({leads.length}) &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody id="recent" className="divide-y divide-slate-100 text-slate-700">
              {recentLeads.length > 0 ? (
                recentLeads.map((l) => {
                  const timing = getFollowupTiming(l.followup, l.status);
                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onViewLeadDetail(l)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{l.name}</span>
                          {l.priority === 'Hot' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {l.mobile} {l.size ? `• ${l.size}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {l.project || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            l.status === 'Booking' || l.status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : l.status === 'Site Visit'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : l.status === 'Negotiation'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : l.status === 'Lost'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs ${
                            timing === 'overdue'
                              ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded'
                              : timing === 'today'
                              ? 'text-amber-700 font-semibold'
                              : 'text-slate-600'
                          }`}
                        >
                          {fmt(l.followup)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {l.salesperson || 'Unassigned'}
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                l.mobile,
                                `नमस्ते ${l.name} जी, Housing Worlds से ${l.salesperson || 'टीम'}। ${l.project ? `प्रोजेक्ट ${l.project}` : ''} के बारे में बातचीत करने हेतु संपर्क किया।`
                              )
                            }
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => makePhoneCall(l.mobile)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                            title="Call customer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditLead(l.id)}
                            className="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No recent leads found. Click "+ Add Lead" to create your first inquiry.
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
