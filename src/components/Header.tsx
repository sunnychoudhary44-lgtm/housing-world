import React from 'react';
import { Download, RefreshCw, MessageSquare, Plus, Database, CheckCircle2 } from 'lucide-react';
import { Lead } from '../types';
import { exportLeadsToCSV } from '../utils/formatters';

interface HeaderProps {
  leads: Lead[];
  onAddNewLead: () => void;
  onOpenWhatsAppTemplates: () => void;
  onResetDemoData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  leads,
  onAddNewLead,
  onOpenWhatsAppTemplates,
  onResetDemoData,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title & Storage Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-inner font-bold select-none shrink-0">
            🏠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Housing Worlds <span className="text-blue-400 font-medium text-sm sm:text-base">— Lead CRM</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-saved
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Database className="w-3 h-3 text-slate-400" />
              <span>Local Demo • Data browser में save होगा</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold">{leads.length} Total Leads</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="header-btn-whatsapp-templates"
            type="button"
            onClick={onOpenWhatsAppTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer"
            title="WhatsApp Message Templates (Hindi & English)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WA Templates</span>
          </button>

          <button
            id="header-btn-export-csv"
            type="button"
            onClick={() => exportLeadsToCSV(leads)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Download all leads as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="header-btn-reset-demo"
            type="button"
            onClick={() => {
              if (window.confirm('Reset leads to sample real estate data? Your current edits will be replaced.')) {
                onResetDemoData();
              }
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset to default demo data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

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
