import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarClock,
  Briefcase,
  BarChart3,
  Flame,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react';
import { ActivePage, Lead, CallLog, AuthUser } from '../types';
import { getFollowupTiming } from '../utils/formatters';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  leads: Lead[];
  calls?: CallLog[];
  currentUser?: AuthUser | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  leads,
  calls = [],
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Compute counts
  const totalLeads = leads.length;
  const overdueCount = leads.filter(
    (l) => getFollowupTiming(l.followup, l.status) === 'overdue'
  ).length;
  const hotCount = leads.filter((l) => l.priority === 'Hot').length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCallsCount = calls.filter(
    (c) => c.timestamp.slice(0, 10) === todayStr
  ).length;

  const navItems: Array<{
    id: ActivePage;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: isAdmin ? 'Dashboard' : 'My Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'leads',
      label: isAdmin ? 'All Leads' : 'My Leads',
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: totalLeads,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'add',
      label: 'Add Lead',
      icon: <UserPlus className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'calls',
      label: isAdmin ? 'Call Tracker' : 'My Calls',
      icon: <PhoneCall className="w-4 h-4 shrink-0" />,
      badge: todayCallsCount > 0 ? todayCallsCount : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold',
    },
    {
      id: 'followups',
      label: isAdmin ? 'Follow-ups' : 'My Follow-ups',
      icon: <CalendarClock className="w-4 h-4 shrink-0" />,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold',
    },
    {
      id: 'team',
      label: isAdmin ? 'Team & Targets' : 'My Quota & Target',
      icon: <Briefcase className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'reports',
      label: isAdmin ? 'Reports (All)' : 'My Reports',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <aside className="w-full lg:w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Navigation List */}
      <nav className="p-3 space-y-1 overflow-x-auto flex lg:flex-col gap-1 sm:gap-1.5 lg:gap-0">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ml-2 ${
                    isActive ? 'bg-blue-700 text-blue-100 font-bold' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Summary Box at sidebar bottom on larger screens */}
      <div className="hidden lg:block mt-auto p-4 m-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
        <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
          <span>Priority Pulse</span>
          {hotCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60">
              <Flame className="w-3 h-3 text-rose-400" /> {hotCount} Hot
            </span>
          )}
        </div>

        {overdueCount > 0 ? (
          <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>{overdueCount} follow-up(s)</strong> overdue! Check{' '}
              <button
                type="button"
                onClick={() => onSelectPage('followups')}
                className="underline hover:text-amber-200 cursor-pointer"
              >
                Follow-ups
              </button>
              .
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">
            Sabhi follow-ups up-to-date hain. New leads generate karne ke liye campaigns review karein.
          </p>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Target Mode</span>
          <span className="text-blue-400 font-medium">50 Calls / Day</span>
        </div>
      </div>
    </aside>
  );
};
