import React, { useState, useEffect, useMemo } from 'react';
import { ActivePage, Lead, LeadStatus, CallLog, CallOutcome, CallType, AuthUser } from './types';
import { INITIAL_LEADS, INITIAL_CALLS, DEFAULT_USERS } from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { LeadFormView } from './components/LeadFormView';
import { FollowupsView } from './components/FollowupsView';
import { TeamView } from './components/TeamView';
import { ReportsView } from './components/ReportsView';
import { CallTrackerView } from './components/CallTrackerView';
import { WhatsAppTemplatesModal } from './components/WhatsAppTemplatesModal';
import { LeadDetailModal } from './components/LeadDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LogCallModal } from './components/LogCallModal';
import { LoginView } from './components/LoginView';
import {
  subscribeToLeads,
  subscribeToCalls,
  saveLeadToCloud,
  deleteLeadFromCloud,
  saveCallToCloud,
  deleteCallFromCloud,
  seedIfEmpty,
  resetFirestoreWithDemo,
} from './services/crmFirestore';
import { CheckCircle2, Info, Crown, Lock, User, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'hwcrm_leads';
const CALLS_STORAGE_KEY = 'hwcrm_calls';
const AUTH_STORAGE_KEY = 'hwcrm_auth_user';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mobile && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse current user from localStorage', e);
    }
    // Default to admin for instant test preview if needed, or prompt login
    return DEFAULT_USERS[0]; // Sunny Choudhary (Admin)
  });
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

  // Load initial call logs from localStorage with fallback to INITIAL_CALLS
  const [calls, setCalls] = useState<CallLog[]>(() => {
    try {
      const saved = localStorage.getItem(CALLS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved calls from localStorage', e);
    }
    return INITIAL_CALLS;
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [salespersonFilterForLeads, setSalespersonFilterForLeads] = useState<string>('');

  // Modals state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);

  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [deleteTargetLead, setDeleteTargetLead] = useState<Lead | null>(null);

  // Call Tracker Modal state
  const [isLogCallModalOpen, setIsLogCallModalOpen] = useState(false);
  const [callTargetLead, setCallTargetLead] = useState<Lead | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Setup Firestore real-time listeners and initial database seed
  useEffect(() => {
    // Attempt initial database seed if empty
    seedIfEmpty(INITIAL_LEADS, INITIAL_CALLS).catch((err) => {
      console.warn('Firestore initial seed note:', err);
    });

    // Real-time synchronization for leads collection
    const unsubscribeLeads = subscribeToLeads(
      (cloudLeads) => {
        if (cloudLeads && cloudLeads.length > 0) {
          setLeads(cloudLeads);
        }
        setIsCloudConnected(true);
      },
      (err) => {
        console.warn('Firestore leads subscription note:', err);
        setIsCloudConnected(false);
      }
    );

    // Real-time synchronization for calls collection
    const unsubscribeCalls = subscribeToCalls(
      (cloudCalls) => {
        if (cloudCalls && cloudCalls.length > 0) {
          setCalls(cloudCalls);
        }
      },
      (err) => {
        console.warn('Firestore calls subscription note:', err);
      }
    );

    return () => {
      unsubscribeLeads();
      unsubscribeCalls();
    };
  }, []);

  // Sync leads to localStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch (err) {
      console.error('Failed to save leads to localStorage', err);
    }
  }, [leads]);

  // Sync calls to localStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(CALLS_STORAGE_KEY, JSON.stringify(calls));
    } catch (err) {
      console.error('Failed to save calls to localStorage', err);
    }
  }, [calls]);

  // Open Log Call modal
  const handleOpenLogCallModal = (lead?: Lead | null) => {
    setCallTargetLead(lead || null);
    setIsLogCallModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save auth to localStorage', err);
    }
    showToast(`लॉगिन सफल: ${user.name} (${user.role === 'admin' ? '👑 Admin' : '👤 User'})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to remove auth', err);
    }
    showToast('सफलतापूर्वक लॉगआउट हो गया।');
  };

  const isAdmin = currentUser?.role === 'admin';

  // Role-based data isolation
  // Admin: sees all leads across the entire team
  // User: strictly sees leads assigned to their name (salesperson matches user name)
  const visibleLeads = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return leads;
    const userNameLower = (currentUser.name || '').trim().toLowerCase();
    return leads.filter((l) => {
      if (!l.salesperson) return false;
      return l.salesperson.trim().toLowerCase() === userNameLower;
    });
  }, [leads, currentUser]);

  // Role-based calls isolation
  // Admin: sees all calls logged across the entire team
  // User: strictly sees calls logged by their name
  const visibleCalls = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return calls;
    const userNameLower = (currentUser.name || '').trim().toLowerCase();
    return calls.filter((c) => {
      if (!c.salesperson) return false;
      return c.salesperson.trim().toLowerCase() === userNameLower;
    });
  }, [calls, currentUser]);

  // Lead Save handler (Add or Update)
  const handleSaveLead = (leadData: Omit<Lead, 'id'> & { id?: number }) => {
    // If user role, force salesperson to current user name so user owns the lead
    const assignedSalesperson =
      currentUser?.role === 'user' && currentUser?.name
        ? currentUser.name
        : leadData.salesperson;

    if (leadData.id) {
      // Update existing
      const updatedLead: Lead = {
        ...(leads.find((l) => l.id === leadData.id) || ({} as Lead)),
        ...leadData,
        salesperson: assignedSalesperson,
        id: leadData.id,
        updatedAt: new Date().toISOString(),
      };

      setLeads((prev) =>
        prev.map((l) => (l.id === leadData.id ? updatedLead : l))
      );
      saveLeadToCloud(updatedLead).catch((err) =>
        console.error('Cloud save failed for updated lead:', err)
      );
      showToast(`Lead "${leadData.name}" updated successfully!`);
    } else {
      // Add new
      const newLead: Lead = {
        ...leadData,
        salesperson: assignedSalesperson,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      setLeads((prev) => [newLead, ...prev]);
      saveLeadToCloud(newLead).catch((err) =>
        console.error('Cloud save failed for new lead:', err)
      );
      showToast(`Lead "${leadData.name}" saved to Cloud!`);
    }

    setEditingLeadId(null);
    setActivePage('leads');
  };

  // Call Save handler (from LogCallModal)
  const handleSaveCall = (
    callData: Omit<CallLog, 'id' | 'timestamp'>,
    autoUpdateLeadStatus: boolean,
    newLeadStatus?: LeadStatus,
    updateFollowupDate?: boolean,
    newFollowupDate?: string
  ) => {
    const callerName =
      currentUser?.role === 'user' && currentUser?.name
        ? currentUser.name
        : callData.salesperson;

    const newCall: CallLog = {
      ...callData,
      salesperson: callerName,
      id: `call-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setCalls((prev) => [newCall, ...prev]);
    saveCallToCloud(newCall).catch((err) =>
      console.error('Cloud save failed for call log:', err)
    );

    // If auto-sync lead status / follow-up is requested
    if (callData.leadId || callData.mobile) {
      setLeads((prevLeads) =>
        prevLeads.map((lead) => {
          const isMatch =
            (callData.leadId && lead.id === callData.leadId) ||
            (!callData.leadId && lead.mobile === callData.mobile);

          if (!isMatch) return lead;

          let updatedLead = { ...lead };

          if (autoUpdateLeadStatus && newLeadStatus) {
            updatedLead.status = newLeadStatus;
          }

          if (updateFollowupDate && newFollowupDate) {
            updatedLead.followup = newFollowupDate;
          }

          // Append call note to remarks
          const timeLabel = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          const noteText = `[Call: ${callData.outcome} - ${callData.salesperson} on ${timeLabel}] ${
            callData.notes || 'Logged via Call Tracker'
          }`;

          updatedLead.remarks = updatedLead.remarks
            ? `${updatedLead.remarks}\n${noteText}`
            : noteText;

          saveLeadToCloud(updatedLead).catch((err) =>
            console.error('Cloud update lead on call failed:', err)
          );

          return updatedLead;
        })
      );
    }

    showToast(`Call logged: ${callData.leadName || callData.mobile} (${callData.outcome})`);
  };

  // Delete Call log handler
  const handleDeleteCall = (id: string) => {
    setCalls((prev) => prev.filter((c) => c.id !== id));
    deleteCallFromCloud(id).catch((err) =>
      console.error('Cloud delete call log failed:', err)
    );
    showToast('Call log entry removed.');
  };

  // Status quick update
  const handleUpdateLeadStatus = (id: number, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updated = { ...l, status: newStatus };
          saveLeadToCloud(updated).catch(console.error);
          return updated;
        }
        return l;
      })
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
          const updated = {
            ...l,
            followup: targetDate.toISOString().slice(0, 16),
            status: l.status === 'Lost' ? 'Follow-up' : l.status,
          };
          saveLeadToCloud(updated).catch(console.error);
          return updated;
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
          const updated = {
            ...l,
            status: 'Contacted' as LeadStatus,
            remarks: updatedRemarks,
          };
          saveLeadToCloud(updated).catch(console.error);
          return updated;
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
      deleteLeadFromCloud(deleteTargetLead.id).catch((err) =>
        console.error('Cloud delete lead failed:', err)
      );
      showToast(`Lead "${deleteTargetLead.name}" removed from Cloud.`);
      setDeleteTargetLead(null);
      if (detailLead?.id === deleteTargetLead.id) {
        setDetailLead(null);
      }
    }
  };

  // Reset to default sample real estate leads and calls
  const handleResetDemoData = () => {
    setLeads(INITIAL_LEADS);
    setCalls(INITIAL_CALLS);
    resetFirestoreWithDemo(INITIAL_LEADS, INITIAL_CALLS).catch(console.error);
    showToast('CRM data reset and synced to Firebase Cloud Firestore');
  };

  // Start editing a lead
  const handleStartEdit = (id: number) => {
    setEditingLeadId(id);
    setActivePage('add');
  };

  const editingLead = editingLeadId
    ? leads.find((l) => l.id === editingLeadId) || null
    : null;

  // If not logged in, show Login Screen (Mobile + OTP)
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

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
        leads={visibleLeads}
        currentUser={currentUser}
        onLogout={handleLogout}
        onAddNewLead={() => {
          setEditingLeadId(null);
          setActivePage('add');
        }}
        onOpenWhatsAppTemplates={() => {
          setWhatsAppLead(null);
          setIsWhatsAppModalOpen(true);
        }}
        onResetDemoData={handleResetDemoData}
        onOpenLogCallModal={() => handleOpenLogCallModal()}
        isCloudConnected={isCloudConnected}
      />

      {/* Role-Based Access Notification Banner */}
      <div
        className={`px-4 sm:px-6 py-2.5 text-xs border-b flex items-center justify-between flex-wrap gap-2 transition-colors ${
          isAdmin
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-950'
            : 'bg-blue-500/10 border-blue-500/20 text-blue-950'
        }`}
      >
        <div className="flex items-center gap-2 font-medium flex-wrap">
          {isAdmin ? (
            <>
              <Crown className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>👑 एडमिन मोड (Director Access):</strong> आप{' '}
                <strong className="text-amber-900">{currentUser.name}</strong> के रूप में लॉग इन
                हैं। पूरी कंपनी की कुल <strong>{leads.length} लीड्स</strong> और{' '}
                <strong>{calls.length} कॉल्स</strong> आपको दिखाई दे रही हैं।
              </span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>🔒 यूज़र मोड (Private Access):</strong> आप{' '}
                <strong className="text-blue-900">{currentUser.name}</strong> के रूप में लॉग इन
                हैं। आप केवल अपनी खुद की <strong>{visibleLeads.length} लीड्स</strong> और{' '}
                <strong>{visibleCalls.length} कॉल्स</strong> देख सकते हैं। अन्य यूज़र्स का डेटा
                सुरक्षित है।
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleLogout}
            className={`font-semibold underline hover:opacity-80 cursor-pointer ${
              isAdmin ? 'text-amber-800' : 'text-blue-800'
            }`}
          >
            Switch / Logout
          </button>
        </div>
      </div>

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
          leads={visibleLeads}
          calls={visibleCalls}
          currentUser={currentUser}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              leads={visibleLeads}
              calls={visibleCalls}
              currentUser={currentUser}
              onNavigate={(page) => {
                if (page !== 'leads') {
                  setSalespersonFilterForLeads('');
                }
                setActivePage(page);
              }}
              onEditLead={handleStartEdit}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
              onOpenLogModal={handleOpenLogCallModal}
              onSelectTeamMemberForLeads={(memberName) => {
                setSalespersonFilterForLeads(memberName);
                setActivePage('leads');
              }}
            />
          )}

          {activePage === 'leads' && (
            <LeadsView
              leads={visibleLeads}
              initialSalespersonFilter={salespersonFilterForLeads}
              onClearSalespersonFilter={() => setSalespersonFilterForLeads('')}
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
              onOpenLogModal={handleOpenLogCallModal}
            />
          )}

          {activePage === 'add' && (
            <LeadFormView
              editLeadData={editingLead}
              currentUser={currentUser}
              onSaveLead={handleSaveLead}
              onCancel={() => {
                setEditingLeadId(null);
                setActivePage('leads');
              }}
            />
          )}

          {activePage === 'calls' && (
            <CallTrackerView
              leads={visibleLeads}
              calls={visibleCalls}
              onOpenLogModal={handleOpenLogCallModal}
              onDeleteCall={handleDeleteCall}
            />
          )}

          {activePage === 'followups' && (
            <FollowupsView
              leads={visibleLeads}
              onEditLead={handleStartEdit}
              onQuickReschedule={handleQuickReschedule}
              onMarkContacted={handleMarkContacted}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
              onOpenLogModal={handleOpenLogCallModal}
            />
          )}

          {activePage === 'team' && <TeamView leads={leads} currentUser={currentUser} />}

          {activePage === 'reports' && <ReportsView leads={visibleLeads} />}
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
        onOpenLogModal={handleOpenLogCallModal}
        calls={visibleCalls}
      />

      {/* Log Call Modal */}
      <LogCallModal
        isOpen={isLogCallModalOpen}
        onClose={() => setIsLogCallModalOpen(false)}
        onSaveCall={handleSaveCall}
        initialLead={callTargetLead}
        leads={visibleLeads}
        currentUser={currentUser}
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
