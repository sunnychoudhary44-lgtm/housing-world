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
  Users2,
  CalendarCheck2,
  Calculator,
  FileCheck2,
  Kanban,
  ListTodo,
  MessageSquare,
  Building,
  HardHat,
} from 'lucide-react';
import { ActivePage, Lead, CallLog, AuthUser, Developer, Project, Broker } from '../types';
import { getFollowupTiming } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  leads: Lead[];
  calls?: CallLog[];
  dealsCount?: number;
  tasksCount?: number;
  currentUser?: AuthUser | null;
  developersCount?: number;
  projectsCount?: number;
  brokersCount?: number;
  siteVisitsCount?: number;
  costSheetsCount?: number;
  tokensAgreementsCount?: number;
  meetingsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  leads,
  calls = [],
  dealsCount = 0,
  tasksCount = 0,
  currentUser,
  developersCount = 0,
  projectsCount = 0,
  brokersCount = 0,
  siteVisitsCount = 0,
  costSheetsCount = 0,
  tokensAgreementsCount = 0,
  meetingsCount = 0,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const { t } = useLanguage();

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

  // The 5 Core CRM Pillars requested by user
  const crmPillarsNav: Array<{
    id: ActivePage;
    label: string;
    pillarNum: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'pipeline',
      label: t('navPipeline', 'Pipeline & Deals'),
      pillarNum: '1',
      icon: <Kanban className="w-4 h-4 shrink-0 text-blue-400" />,
      badge: dealsCount > 0 ? dealsCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold',
    },
    {
      id: 'meetings',
      label: t('navMeetings', 'Meetings & Tracker'),
      pillarNum: 'M',
      icon: <CalendarClock className="w-4 h-4 shrink-0 text-teal-400" />,
      badge: meetingsCount > 0 ? meetingsCount : undefined,
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold',
    },
    {
      id: 'leads',
      label: isAdmin ? t('navAllLeads', 'Lead Management') : t('navMyLeads', 'My Leads'),
      pillarNum: '2',
      icon: <Users className="w-4 h-4 shrink-0 text-sky-400" />,
      badge: totalLeads,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'communication',
      label: t('navCommunicationHub', 'Communication & Activity'),
      pillarNum: '3',
      icon: <PhoneCall className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: todayCallsCount > 0 ? todayCallsCount : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
    },
    {
      id: 'tasks',
      label: t('navTasks', 'Task Management'),
      pillarNum: '4',
      icon: <ListTodo className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: tasksCount > 0 ? tasksCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
    },
    {
      id: 'team',
      label: isAdmin ? t('pillar5Team', 'User & Team Management') : t('navMyQuota', 'My Targets & Quota'),
      pillarNum: '5',
      icon: <Briefcase className="w-4 h-4 shrink-0 text-purple-400" />,
    },
  ];

  const housingWorldNavItems: Array<{
    id: ActivePage;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'tokens_agreements',
      label: t('navTokensAgreements', 'Tokens & Agreements'),
      icon: <FileCheck2 className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: tokensAgreementsCount > 0 ? tokensAgreementsCount : undefined,
      badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/50',
    },
    {
      id: 'site_visits',
      label: t('navSiteVisits', 'Site Visits & Passes'),
      icon: <CalendarCheck2 className="w-4 h-4 shrink-0 text-amber-400" />,
      badge: siteVisitsCount > 0 ? siteVisitsCount : undefined,
      badgeColor: 'bg-amber-950 text-amber-300 border border-amber-700/50',
    },
    {
      id: 'cost_sheets',
      label: t('navCostSheets', 'Cost Sheets & Quotes'),
      icon: <Calculator className="w-4 h-4 shrink-0 text-purple-400" />,
      badge: costSheetsCount > 0 ? costSheetsCount : undefined,
      badgeColor: 'bg-purple-950 text-purple-300 border border-purple-700/50',
    },
    {
      id: 'brokers',
      label: t('navBrokersCPs', 'Brokers & CPs'),
      icon: <Users2 className="w-4 h-4 shrink-0 text-sky-400" />,
      badge: brokersCount > 0 ? brokersCount : undefined,
      badgeColor: 'bg-sky-950 text-sky-300 border border-sky-700/50',
    },
    {
      id: 'projects',
      label: t('navProjects', 'Projects & Inventory'),
      icon: <Building className="w-4 h-4 shrink-0 text-teal-400" />,
      badge: projectsCount > 0 ? projectsCount : undefined,
      badgeColor: 'bg-teal-950 text-teal-300 border border-teal-700/50',
    },
    {
      id: 'developers',
      label: t('navDevelopers', 'Developers & Mandates'),
      icon: <HardHat className="w-4 h-4 shrink-0 text-orange-400" />,
      badge: developersCount > 0 ? developersCount : undefined,
      badgeColor: 'bg-orange-950 text-orange-300 border border-orange-700/50',
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Navigation List */}
      <nav className="p-3 space-y-3 overflow-x-auto flex lg:flex-col gap-1 sm:gap-1.5 lg:gap-0">
        {/* Dashboard / Home */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => onSelectPage('dashboard')}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
              activePage === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>{isAdmin ? t('navDashboard', 'Dashboard Overview') : t('navMyDashboard', 'My Dashboard')}</span>
            </div>
          </button>
        </div>

        {/* 5 CRM PILLARS */}
        <div className="pt-2 border-t border-slate-800 w-full space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
            <span>CRM 5 Pillars</span>
            <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800/60">Core</span>
          </div>
          {crmPillarsNav.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                type="button"
                onClick={() => onSelectPage(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-mono font-extrabold px-1 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                    {item.pillarNum}
                  </span>
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ml-1.5 ${
                      isActive ? 'bg-blue-700 text-blue-100 font-bold' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Real Estate Operational Suite */}
        <div className="pt-2 border-t border-slate-800 w-full space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('navRealEstateSuite', 'Real Estate Suite')}
          </div>
          {housingWorldNavItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                type="button"
                onClick={() => onSelectPage(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-900/40'
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
                      isActive ? 'bg-indigo-700 text-white font-bold' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reports & Analytics */}
        <div className="pt-2 border-t border-slate-800 w-full space-y-1">
          <button
            type="button"
            onClick={() => onSelectPage('reports')}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap cursor-pointer ${
              activePage === 'reports'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 shrink-0 text-sky-400" />
              <span>{t('navReports', 'Reports & Analytics')}</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Language Selector + Quick Summary Box in Sidebar Footer */}
      <div className="mt-auto p-3 space-y-3">
        {/* Quick Language Selector in Sidebar */}
        <LanguageSelector variant="sidebar" />

        {/* Priority Pulse on larger screens */}
        <div className="hidden lg:block p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
          <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>{t('navPriorityPulse', 'Priority Pulse')}</span>
            {hotCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60">
                <Flame className="w-3 h-3 text-rose-400" /> {hotCount} {t('hotLeads', 'Hot')}
              </span>
            )}
          </div>

          {overdueCount > 0 ? (
            <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>{overdueCount} {t('navOverdueFollowups', 'follow-up(s) overdue!')}</strong>{' '}
                <button
                  type="button"
                  onClick={() => onSelectPage('tasks')}
                  className="underline hover:text-amber-200 cursor-pointer font-bold"
                >
                  Check Tasks
                </button>
                .
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              {t('navAllUpToDate', 'Sabhi follow-ups up-to-date hain. Real estate inventory & CP network live synced.')}
            </p>
          )}

          <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('navHousingWorldEngine', 'Housing World Engine')}</span>
            <span className="text-indigo-400 font-medium">{t('navReady', 'Ready')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

