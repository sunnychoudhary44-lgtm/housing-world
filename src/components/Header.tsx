import React from 'react';
import {
  Download,
  RefreshCw,
  MessageSquare,
  Plus,
  Database,
  Cloud,
  CheckCircle2,
  PhoneCall,
  Crown,
  User,
  LogOut,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Lead, AuthUser } from '../types';
import { exportLeadsToCSV } from '../utils/formatters';

interface HeaderProps {
  leads: Lead[];
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onAddNewLead: () => void;
  onOpenWhatsAppTemplates: () => void;
  onResetDemoData: () => void;
  onOpenLogCallModal?: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  leads,
  currentUser,
  onLogout,
  onAddNewLead,
  onOpenWhatsAppTemplates,
  onResetDemoData,
  onOpenLogCallModal,
  isCloudConnected = true,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title & Storage & Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-inner font-bold select-none shrink-0">
            🏠
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Housing Worlds <span className="text-blue-400 font-medium text-sm sm:text-base">— Lead CRM</span>
              </h1>

              {/* Role Badge */}
              {currentUser && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {isAdmin ? <Crown className="w-3 h-3 text-amber-400" /> : <User className="w-3 h-3 text-blue-400" />}
                  <span>{isAdmin ? 'Admin (All Access)' : `User: ${currentUser.name}`}</span>
                </span>
              )}

              {isCloudConnected ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cloud Active</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full">
                  <Database className="w-3 h-3 text-amber-400" /> Offline Buffer
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 flex items-center flex-wrap gap-1.5 mt-0.5">
              <Cloud className="w-3 h-3 text-sky-400 shrink-0" />
              <span>Google Firebase Firestore</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold">
                {isAdmin ? `${leads.length} Total Leads (All Users)` : `${leads.length} My Assigned Leads`}
              </span>
              {currentUser && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400 font-mono text-[11px]">+91 {currentUser.mobile}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Header Action Buttons & User Profile */}
        <div className="flex items-center flex-wrap gap-2">
          {currentUser && onLogout && (
            <button
              id="header-btn-logout"
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-rose-950/50 hover:border-rose-700 hover:text-rose-300 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title={`Switch account or logout from ${currentUser.name}`}
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Logout / Switch</span>
            </button>
          )}

          <button
            id="header-btn-whatsapp-templates"
            type="button"
            onClick={onOpenWhatsAppTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer"
            title="WhatsApp Message Templates (Hindi & English)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">WA Templates</span>
          </button>

          <button
            id="header-btn-export-csv"
            type="button"
            onClick={() => exportLeadsToCSV(leads)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Download leads as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {isAdmin && (
            <button
              id="header-btn-reset-demo"
              type="button"
              onClick={() => {
                if (window.confirm('Reset leads to sample real estate data? Your current edits will be replaced.')) {
                  onResetDemoData();
                }
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset to default demo data (Admin only)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenLogCallModal && (
            <button
              id="header-btn-log-call"
              type="button"
              onClick={onOpenLogCallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-sky-500/20 active:scale-95"
              title="Log a phone call record"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>
          )}

          <button
            id="header-btn-add-lead"
            type="button"
            onClick={onAddNewLead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>
    </header>
  );
};
