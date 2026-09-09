import React, { useState, useEffect } from 'react';
import { ActivePage, Lead, LeadStatus } from './types';
import { INITIAL_LEADS } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { LeadFormView } from './components/LeadFormView';
import { FollowupsView } from './components/FollowupsView';
import { TeamView } from './components/TeamView';
import { ReportsView } from './components/ReportsView';
import { WhatsAppTemplatesModal } from './components/WhatsAppTemplatesModal';
import { LeadDetailModal } from './components/LeadDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CheckCircle2, Info } from 'lucide-react';

const STORAGE_KEY = 'hwcrm_leads';

export default function App() {
  // Load initial leads from localStorage with fallback to INITIAL_LEADS
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved leads from localStorage', e);
    }
    return INITIAL_LEADS;
  });

  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);

  // Modals state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);

  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [deleteTargetLead, setDeleteTargetLead] = useState<Lead | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch (err) {
      console.error('Failed to save leads to localStorage', err);
    }
  }, [leads]);

  // Lead Save handler (Add or Update)
  const handleSaveLead = (leadData: Omit<Lead, 'id'> & { id?: number }) => {
    if (leadData.id) {
      // Update existing
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadData.id
            ? {
                ...l,
                ...leadData,
                updatedAt: new Date().toISOString(),
              }
            : l
        )
      );
      showToast(`Lead "${leadData.name}" updated successfully!`);
    } else {
      // Add new
      const newLead: Lead = {
        ...leadData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      setLeads((prev) => [newLead, ...prev]);
      showToast(`Lead "${leadData.name}" saved successfully!`);
    }

    setEditingLeadId(null);
    setActivePage('leads');
  };

  // Status quick update
  const handleUpdateLeadStatus = (id: number, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    showToast(`Status updated to "${newStatus}"`);
  };

  // Quick reschedule (+X days)
  const handleQuickReschedule = (id: number, daysToAdd: number) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const baseDate = l.followup ? new Date(l.followup) : new Date();
          const targetDate = new Date(
            baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
          );
          return {
            ...l,
            followup: targetDate.toISOString().slice(0, 16),
            status: l.status === 'Lost' ? 'Follow-up' : l.status,
          };
        }
        return l;
      })
    );
    showToast(`Follow-up rescheduled by +${daysToAdd} day(s)`);
  };

  // Mark Contacted
  const handleMarkContacted = (id: number) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const timestamp = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          const updatedRemarks = l.remarks
            ? `${l.remarks}\n[${timestamp}] Contacted client.`
            : `[${timestamp}] Contacted client.`;
          return {
            ...l,
            status: 'Contacted',
            remarks: updatedRemarks,
          };
        }
        return l;
      })
    );
    showToast('Lead marked as Contacted');
  };

  // Delete lead
  const handleConfirmDelete = () => {
    if (deleteTargetLead) {
      setLeads((prev) => prev.filter((l) => l.id !== deleteTargetLead.id));
      showToast(`Lead "${deleteTargetLead.name}" removed.`);
      setDeleteTargetLead(null);
      if (detailLead?.id === deleteTargetLead.id) {
        setDetailLead(null);
      }
    }
  };

  // Reset to default sample real estate leads
  const handleResetDemoData = () => {
    setLeads(INITIAL_LEADS);
    showToast('CRM data reset to sample real estate records');
  };

  // Start editing a lead
  const handleStartEdit = (id: number) => {
    setEditingLeadId(id);
    setActivePage('add');
  };

  const editingLead = editingLeadId
    ? leads.find((l) => l.id === editingLeadId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        leads={leads}
        onAddNewLead={() => {
          setEditingLeadId(null);
          setActivePage('add');
        }}
        onOpenWhatsAppTemplates={() => {
          setWhatsAppLead(null);
          setIsWhatsAppModalOpen(true);
        }}
        onResetDemoData={handleResetDemoData}
      />

      {/* App Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar Nav */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => {
            if (page === 'add') {
              setEditingLeadId(null);
            }
            setActivePage(page);
          }}
          leads={leads}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              leads={leads}
              onNavigate={(page) => setActivePage(page)}
              onEditLead={handleStartEdit}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
            />
          )}

          {activePage === 'leads' && (
            <LeadsView
              leads={leads}
              onAddNewLead={() => {
                setEditingLeadId(null);
                setActivePage('add');
              }}
              onEditLead={handleStartEdit}
              onDeleteLead={(id) => {
                const target = leads.find((l) => l.id === id);
                if (target) setDeleteTargetLead(target);
              }}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
            />
          )}

          {activePage === 'add' && (
            <LeadFormView
              editLeadData={editingLead}
              onSaveLead={handleSaveLead}
              onCancel={() => {
                setEditingLeadId(null);
                setActivePage('leads');
              }}
            />
          )}

          {activePage === 'followups' && (
            <FollowupsView
              leads={leads}
              onEditLead={handleStartEdit}
              onQuickReschedule={handleQuickReschedule}
              onMarkContacted={handleMarkContacted}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
            />
          )}

          {activePage === 'team' && <TeamView leads={leads} />}

          {activePage === 'reports' && <ReportsView leads={leads} />}
        </main>
      </div>

      {/* WhatsApp Message Templates Modal */}
      <WhatsAppTemplatesModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        selectedLead={whatsAppLead}
      />

      {/* Lead Detail View Modal */}
      <LeadDetailModal
        lead={detailLead}
        isOpen={Boolean(detailLead)}
        onClose={() => setDetailLead(null)}
        onEdit={handleStartEdit}
        onDelete={(id) => {
          const target = leads.find((l) => l.id === id);
          if (target) setDeleteTargetLead(target);
        }}
        onOpenWhatsAppTemplates={(lead) => {
          setWhatsAppLead(lead);
          setIsWhatsAppModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        lead={deleteTargetLead}
        isOpen={Boolean(deleteTargetLead)}
        onClose={() => setDeleteTargetLead(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
