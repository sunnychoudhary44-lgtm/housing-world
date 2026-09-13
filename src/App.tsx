import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivePage,
  Lead,
  LeadStatus,
  CallLog,
  CallOutcome,
  CallType,
  AuthUser,
  Developer,
  Project,
  ProjectUnit,
  Broker,
  SiteVisit,
  CostSheet,
  TokenAgreement,
  Deal,
  CrmTask,
} from './types';
import {
  INITIAL_LEADS,
  INITIAL_CALLS,
  SAMPLE_DEMO_LEADS,
  SAMPLE_DEMO_CALLS,
  DEFAULT_USERS,
} from './data/initialData';
import {
  INITIAL_DEVELOPERS,
  INITIAL_PROJECTS,
  INITIAL_UNITS,
  INITIAL_BROKERS,
  INITIAL_SITE_VISITS,
  INITIAL_COST_SHEETS,
  INITIAL_TOKENS_AGREEMENTS,
  INITIAL_DEALS,
  INITIAL_TASKS,
} from './data/realEstateData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { LeadFormView } from './components/LeadFormView';
import { FollowupsView } from './components/FollowupsView';
import { TeamView } from './components/TeamView';
import { ReportsView } from './components/ReportsView';
import { CallTrackerView } from './components/CallTrackerView';
import { BrokersView } from './components/BrokersView';
import { SiteVisitsView } from './components/SiteVisitsView';
import { CostSheetView } from './components/CostSheetView';
import { TokensAgreementsView } from './components/TokensAgreementsView';
import { SalesPipelineView } from './components/SalesPipelineView';
import { TasksView } from './components/TasksView';
import { CommunicationHubView } from './components/CommunicationHubView';
import { WhatsAppTemplatesModal } from './components/WhatsAppTemplatesModal';
import { LeadDetailModal } from './components/LeadDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LogCallModal } from './components/LogCallModal';
import { LoginView } from './components/LoginView';
import {
  subscribeToLeads,
  subscribeToCalls,
  subscribeToUsers,
  saveLeadToCloud,
  bulkSaveLeadsToCloud,
  deleteLeadFromCloud,
  saveCallToCloud,
  deleteCallFromCloud,
  clearAllDataFromCloud,
  resetFirestoreWithDemo,
  subscribeToDevelopers,
  saveDeveloperToCloud,
  deleteDeveloperFromCloud,
  subscribeToProjects,
  saveProjectToCloud,
  deleteProjectFromCloud,
  subscribeToBrokers,
  saveBrokerToCloud,
  deleteBrokerFromCloud,
  subscribeToUnits,
  saveUnitToCloud,
  deleteUnitFromCloud,
  subscribeToSiteVisits,
  saveSiteVisitToCloud,
  deleteSiteVisitFromCloud,
  subscribeToCostSheets,
  saveCostSheetToCloud,
  deleteCostSheetFromCloud,
  subscribeToTokensAgreements,
  saveTokenAgreementToCloud,
  deleteTokenAgreementFromCloud,
  subscribeToDeals,
  saveDealToCloud,
  deleteDealFromCloud,
  subscribeToTasks,
  saveTaskToCloud,
  deleteTaskFromCloud,
  seedRealEstateIfEmpty,
  seedDealsAndTasksIfEmpty,
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

  // Load initial leads - starts completely clean for production use
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out old sample mock leads (101 to 112) so production starts clean
          const realLeads = parsed.filter((l: Lead) => l.id < 101 || l.id > 112);
          if (realLeads.length > 0) {
            return realLeads;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse saved leads from localStorage', e);
    }
    return [];
  });

  // Load initial call logs - starts completely clean for production use
  const [calls, setCalls] = useState<CallLog[]>(() => {
    try {
      const saved = localStorage.getItem(CALLS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realCalls = parsed.filter((c: CallLog) => !c.id.startsWith('call-'));
          if (realCalls.length > 0) {
            return realCalls;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse saved calls from localStorage', e);
    }
    return [];
  });

  // Dynamic registered team users loaded from Firestore
  const [users, setUsers] = useState<AuthUser[]>([]);

  // Real Estate Suite State (Sell.Do)
  const [developers, setDevelopers] = useState<Developer[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_developers');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_DEVELOPERS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_projects');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_PROJECTS;
  });

  const [units, setUnits] = useState<ProjectUnit[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_units');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_UNITS;
  });

  const [brokers, setBrokers] = useState<Broker[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_brokers');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_BROKERS;
  });

  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_site_visits');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SITE_VISITS;
  });

  const [costSheets, setCostSheets] = useState<CostSheet[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_cost_sheets');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_COST_SHEETS;
  });

  const [tokensAgreements, setTokensAgreements] = useState<TokenAgreement[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_tokens_agreements');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TOKENS_AGREEMENTS;
  });

  // CRM 5 Pillars: Deals (Sales Pipeline & Deal Management)
  const [deals, setDeals] = useState<Deal[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_deals');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_DEALS;
  });

  // CRM 5 Pillars: Tasks (Task Management)
  const [tasks, setTasks] = useState<CrmTask[]>(() => {
    try {
      const s = localStorage.getItem('hwcrm_tasks');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TASKS;
  });

  const [developerFilterForProjects, setDeveloperFilterForProjects] = useState<string>('');

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [leadFormInitialMode, setLeadFormInitialMode] = useState<'manual' | 'excel'>('manual');
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

  // Setup Firestore real-time listeners (Clean production sync)
  useEffect(() => {
    // Real-time synchronization for leads collection
    const unsubscribeLeads = subscribeToLeads(
      (cloudLeads) => {
        setLeads(cloudLeads || []);
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
        setCalls(cloudCalls || []);
      },
      (err) => {
        console.warn('Firestore calls subscription note:', err);
      }
    );

    // Real-time synchronization for registered users collection
    const unsubscribeUsers = subscribeToUsers(
      (cloudUsers) => {
        setUsers(cloudUsers || []);
      },
      (err) => {
        console.warn('Firestore users subscription note:', err);
      }
    );

    // Real-time synchronization for Developers
    const unsubscribeDevelopers = subscribeToDevelopers(
      (cloudDevs) => {
        if (cloudDevs && cloudDevs.length > 0) {
          setDevelopers(cloudDevs);
          try {
            localStorage.setItem('hwcrm_developers', JSON.stringify(cloudDevs));
          } catch (e) {}
        }
      },
      (err) => console.warn('Developers subscription note:', err)
    );

    // Real-time synchronization for Projects
    const unsubscribeProjects = subscribeToProjects(
      (cloudProjects) => {
        if (cloudProjects && cloudProjects.length > 0) {
          setProjects(cloudProjects);
          try {
            localStorage.setItem('hwcrm_projects', JSON.stringify(cloudProjects));
          } catch (e) {}
        }
      },
      (err) => console.warn('Projects subscription note:', err)
    );

    // Real-time synchronization for Units
    const unsubscribeUnits = subscribeToUnits(
      (cloudUnits) => {
        if (cloudUnits && cloudUnits.length > 0) {
          setUnits(cloudUnits);
          try {
            localStorage.setItem('hwcrm_units', JSON.stringify(cloudUnits));
          } catch (e) {}
        }
      },
      (err) => console.warn('Units subscription note:', err)
    );

    // Real-time synchronization for Brokers
    const unsubscribeBrokers = subscribeToBrokers(
      (cloudBrokers) => {
        if (cloudBrokers && cloudBrokers.length > 0) {
          setBrokers(cloudBrokers);
          try {
            localStorage.setItem('hwcrm_brokers', JSON.stringify(cloudBrokers));
          } catch (e) {}
        }
      },
      (err) => console.warn('Brokers subscription note:', err)
    );

    // Real-time synchronization for Site Visits
    const unsubscribeSiteVisits = subscribeToSiteVisits(
      (cloudVisits) => {
        if (cloudVisits && cloudVisits.length > 0) {
          setSiteVisits(cloudVisits);
          try {
            localStorage.setItem('hwcrm_site_visits', JSON.stringify(cloudVisits));
          } catch (e) {}
        }
      },
      (err) => console.warn('Site Visits subscription note:', err)
    );

    // Real-time synchronization for Cost Sheets
    const unsubscribeCostSheets = subscribeToCostSheets(
      (cloudSheets) => {
        if (cloudSheets && cloudSheets.length > 0) {
          setCostSheets(cloudSheets);
          try {
            localStorage.setItem('hwcrm_cost_sheets', JSON.stringify(cloudSheets));
          } catch (e) {}
        }
      },
      (err) => console.warn('Cost Sheets subscription note:', err)
    );

    // Real-time synchronization for Tokens & Agreements
    const unsubscribeTokensAgreements = subscribeToTokensAgreements(
      (cloudTokens) => {
        if (cloudTokens && cloudTokens.length > 0) {
          setTokensAgreements(cloudTokens);
          try {
            localStorage.setItem('hwcrm_tokens_agreements', JSON.stringify(cloudTokens));
          } catch (e) {}
        }
      },
      (err) => console.warn('Tokens & Agreements subscription note:', err)
    );

    // Real-time synchronization for Deals (CRM Pillar 1)
    const unsubscribeDeals = subscribeToDeals(
      (cloudDeals) => {
        if (cloudDeals && cloudDeals.length > 0) {
          setDeals(cloudDeals);
          try {
            localStorage.setItem('hwcrm_deals', JSON.stringify(cloudDeals));
          } catch (e) {}
        }
      },
      (err) => console.warn('Deals subscription note:', err)
    );

    // Real-time synchronization for Tasks (CRM Pillar 4)
    const unsubscribeTasks = subscribeToTasks(
      (cloudTasks) => {
        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
          try {
            localStorage.setItem('hwcrm_tasks', JSON.stringify(cloudTasks));
          } catch (e) {}
        }
      },
      (err) => console.warn('Tasks subscription note:', err)
    );

    // Initialize initial seed data if collections are newly initialized
    seedRealEstateIfEmpty(
      INITIAL_DEVELOPERS,
      INITIAL_PROJECTS,
      INITIAL_UNITS,
      INITIAL_BROKERS,
      INITIAL_SITE_VISITS,
      INITIAL_COST_SHEETS,
      INITIAL_TOKENS_AGREEMENTS
    );

    seedDealsAndTasksIfEmpty(INITIAL_DEALS, INITIAL_TASKS);

    return () => {
      unsubscribeLeads();
      unsubscribeCalls();
      unsubscribeUsers();
      unsubscribeDevelopers();
      unsubscribeProjects();
      unsubscribeUnits();
      unsubscribeBrokers();
      unsubscribeSiteVisits();
      unsubscribeCostSheets();
      unsubscribeTokensAgreements();
      unsubscribeDeals();
      unsubscribeTasks();
    };
  }, []);

  // Compute live team members list dynamically across users collection and existing leads
  const teamMembers = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.name && u.name.trim()) set.add(u.name.trim());
    });
    leads.forEach((l) => {
      if (l.salesperson && l.salesperson.trim()) set.add(l.salesperson.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [users, leads]);

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

  // Role-based tokens & agreements isolation
  // Admin: sees all records across the company
  // User: sees tokens & agreements closed by their name
  const visibleTokensAgreements = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return tokensAgreements;
    const userNameLower = (currentUser.name || '').trim().toLowerCase();
    return tokensAgreements.filter((t) => {
      if (!t.executiveName) return false;
      return t.executiveName.trim().toLowerCase() === userNameLower;
    });
  }, [tokensAgreements, currentUser]);

  // Role-based site visits isolation
  // Admin: sees all site visits across the company
  // User: sees visits where they are the assigned sales executive or telecaller
  const visibleSiteVisits = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return siteVisits;
    const userNameLower = (currentUser.name || '').trim().toLowerCase();
    return siteVisits.filter((v) => {
      if (!v.salesExecutive && !v.telecaller) return false;
      return (
        (v.salesExecutive && v.salesExecutive.trim().toLowerCase() === userNameLower) ||
        (v.telecaller && v.telecaller.trim().toLowerCase() === userNameLower)
      );
    });
  }, [siteVisits, currentUser]);

  // CRM 5 Pillars: Deals isolation (Admin: all deals; User: their assigned deals or unassigned)
  const visibleDeals = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return deals;
    const userNameLower = (currentUser.name || '').trim().toLowerCase();
    return deals.filter((d) => {
      if (!d.assignedTo) return true;
      return d.assignedTo.trim().toLowerCase() === userNameLower;
    });
  }, [deals, currentUser]);

  // CRM 5 Pillars: Tasks isolation (Admin: all tasks; User: their assigned tasks or unassigned)
  const visibleTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return tasks;
    const userNameLower = (currentUser.name || '').trim().toLowerCase();
    return tasks.filter((t) => {
      if (!t.assignedTo) return true;
      return t.assignedTo.trim().toLowerCase() === userNameLower;
    });
  }, [tasks, currentUser]);

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

  // Bulk Lead Import handler (from Excel sheet)
  const handleBulkImportLeads = (newLeadsList: Lead[]) => {
    if (!newLeadsList || newLeadsList.length === 0) return;

    // Prepend imported leads to local state
    setLeads((prev) => [...newLeadsList, ...prev]);

    // Save batch to cloud firestore
    bulkSaveLeadsToCloud(newLeadsList).catch((err) =>
      console.error('Cloud bulk save failed for imported leads:', err)
    );

    showToast(`${newLeadsList.length} लीड्स एक्सेल शीट से सफलतापूर्वक इम्पोर्ट हुईं!`);
    setLeadFormInitialMode('manual');
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

  // Completely clear all leads and calls (clean slate for production usage)
  const handleClearAllData = async () => {
    try {
      setLeads([]);
      setCalls([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CALLS_STORAGE_KEY);
      await clearAllDataFromCloud();
      showToast('डेटाबेस पूरी तरह साफ़ हो गया है — अब आप अपनी असली लीड्स जोड़ सकते हैं!');
    } catch (err) {
      console.error('Failed to clear database', err);
      showToast('डेटा साफ़ करने में त्रुटि आई। कृपया इंटरनेट कनेक्शन जांचें।');
    }
  };

  // Optional: Load sample real estate demo data if requested
  const handleResetDemoData = () => {
    setLeads(SAMPLE_DEMO_LEADS);
    setCalls(SAMPLE_DEMO_CALLS);
    resetFirestoreWithDemo(SAMPLE_DEMO_LEADS, SAMPLE_DEMO_CALLS).catch(console.error);
    showToast('सैंपल डेमो डेटा लोड और सिंक हो गया है');
  };

  // Real Estate: Developers handlers
  const handleSaveDeveloper = (devData: Omit<Developer, 'id'> & { id?: string }) => {
    const devId = devData.id || `dev-${Date.now()}`;
    const fullDev: Developer = {
      ...devData,
      id: devId,
      createdAt: devData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDevelopers((prev) => {
      const idx = prev.findIndex((d) => d.id === devId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullDev;
        return next;
      }
      return [fullDev, ...prev];
    });
    saveDeveloperToCloud(fullDev).catch(console.error);
    showToast(`Developer "${fullDev.name}" saved!`);
  };

  const handleDeleteDeveloper = (id: string) => {
    setDevelopers((prev) => prev.filter((d) => d.id !== id));
    deleteDeveloperFromCloud(id).catch(console.error);
    showToast('Developer record removed.');
  };

  // Real Estate: Projects handlers
  const handleSaveProject = (projectData: Omit<Project, 'id'> & { id?: string }) => {
    const projId = projectData.id || `proj-${Date.now()}`;
    const fullProj: Project = {
      ...projectData,
      id: projId,
      createdAt: projectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === projId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullProj;
        return next;
      }
      return [fullProj, ...prev];
    });
    saveProjectToCloud(fullProj).catch(console.error);
    showToast(`Project "${fullProj.name}" saved!`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    deleteProjectFromCloud(id).catch(console.error);
    showToast('Project removed.');
  };

  // Real Estate: Project Units handlers
  const handleSaveUnit = (unitData: Omit<ProjectUnit, 'id'> & { id?: string }) => {
    const unitId = unitData.id || `unit-${Date.now()}`;
    const fullUnit: ProjectUnit = {
      ...unitData,
      id: unitId,
      updatedAt: new Date().toISOString(),
    };
    setUnits((prev) => {
      const idx = prev.findIndex((u) => u.id === unitId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullUnit;
        return next;
      }
      return [fullUnit, ...prev];
    });
    saveUnitToCloud(fullUnit).catch(console.error);
    showToast(`Unit "${fullUnit.unitNumber}" updated (${fullUnit.status})`);
  };

  const handleDeleteUnit = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
    deleteUnitFromCloud(id).catch(console.error);
    showToast('Unit removed from project inventory.');
  };

  // Real Estate: Brokers / Channel Partners handlers
  const handleSaveBroker = (brokerData: Omit<Broker, 'id'> & { id?: string }) => {
    const brokerId = brokerData.id || `cp-${Date.now()}`;
    const fullBroker: Broker = {
      ...brokerData,
      id: brokerId,
      createdAt: brokerData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBrokers((prev) => {
      const idx = prev.findIndex((b) => b.id === brokerId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullBroker;
        return next;
      }
      return [fullBroker, ...prev];
    });
    saveBrokerToCloud(fullBroker).catch(console.error);
    showToast(`Channel Partner "${fullBroker.firmName}" saved!`);
  };

  const handleDeleteBroker = (id: string) => {
    setBrokers((prev) => prev.filter((b) => b.id !== id));
    deleteBrokerFromCloud(id).catch(console.error);
    showToast('Channel Partner removed.');
  };

  // Real Estate: Site Visits handlers
  const handleSaveSiteVisit = (visitData: Omit<SiteVisit, 'id'> & { id?: string }) => {
    const visitId = visitData.id || `sv-${Date.now()}`;
    const fullVisit: SiteVisit = {
      ...visitData,
      id: visitId,
      createdAt: visitData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSiteVisits((prev) => {
      const idx = prev.findIndex((v) => v.id === visitId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullVisit;
        return next;
      }
      return [fullVisit, ...prev];
    });
    saveSiteVisitToCloud(fullVisit).catch(console.error);
    showToast(`Site visit for "${fullVisit.leadName}" scheduled/updated!`);
  };

  const handleDeleteSiteVisit = (id: string) => {
    setSiteVisits((prev) => prev.filter((v) => v.id !== id));
    deleteSiteVisitFromCloud(id).catch(console.error);
    showToast('Site visit record removed.');
  };

  // Real Estate: Cost Sheets handlers
  const handleSaveCostSheet = (sheetData: Omit<CostSheet, 'id'> & { id?: string }) => {
    const sheetId = sheetData.id || `cs-${Date.now()}`;
    const fullSheet: CostSheet = {
      ...sheetData,
      id: sheetId,
      createdAt: sheetData.createdAt || new Date().toISOString(),
    };
    setCostSheets((prev) => {
      const idx = prev.findIndex((s) => s.id === sheetId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullSheet;
        return next;
      }
      return [fullSheet, ...prev];
    });
    saveCostSheetToCloud(fullSheet).catch(console.error);
    showToast(`Quotation for "${fullSheet.projectName}" generated & saved!`);
  };

  const handleDeleteCostSheet = (id: string) => {
    setCostSheets((prev) => prev.filter((s) => s.id !== id));
    deleteCostSheetFromCloud(id).catch(console.error);
    showToast('Cost sheet quotation removed.');
  };

  // Real Estate: Tokens & Agreements handlers
  const handleSaveTokenAgreement = (recordData: Omit<TokenAgreement, 'id'> & { id?: string }) => {
    const recordId = recordData.id || `tk-${Date.now()}`;
    const fullRecord: TokenAgreement = {
      ...recordData,
      id: recordId,
      createdAt: recordData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTokensAgreements((prev) => {
      const idx = prev.findIndex((r) => r.id === recordId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullRecord;
        return next;
      }
      return [fullRecord, ...prev];
    });
    saveTokenAgreementToCloud(fullRecord).catch(console.error);
    showToast(`टोकन / एग्रीमेंट रसीद "${fullRecord.receiptNumber}" सुरक्षित की गई!`);
  };

  const handleDeleteTokenAgreement = (id: string) => {
    setTokensAgreements((prev) => prev.filter((r) => r.id !== id));
    deleteTokenAgreementFromCloud(id).catch(console.error);
    showToast('टोकन / एग्रीमेंट रिकॉर्ड हटा दिया गया।');
  };

  // CRM 5 Pillars: Deals handlers
  const handleSaveDeal = (deal: Deal) => {
    setDeals((prev) => {
      const idx = prev.findIndex((d) => d.id === deal.id);
      let next: Deal[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = deal;
      } else {
        next = [deal, ...prev];
      }
      try {
        localStorage.setItem('hwcrm_deals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    saveDealToCloud(deal).catch(console.error);
    showToast(`Deal "${deal.title}" updated successfully!`);
  };

  const handleDeleteDeal = (dealId: string) => {
    setDeals((prev) => {
      const next = prev.filter((d) => d.id !== dealId);
      try {
        localStorage.setItem('hwcrm_deals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    deleteDealFromCloud(dealId).catch(console.error);
    showToast('Deal record deleted.');
  };

  // CRM 5 Pillars: Tasks handlers
  const handleSaveTask = (task: CrmTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      let next: CrmTask[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = task;
      } else {
        next = [task, ...prev];
      }
      try {
        localStorage.setItem('hwcrm_tasks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    saveTaskToCloud(task).catch(console.error);
    showToast(`Task "${task.title}" saved!`);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      try {
        localStorage.setItem('hwcrm_tasks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    deleteTaskFromCloud(taskId).catch(console.error);
    showToast('Task removed.');
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id === taskId) {
          const isDone = t.status === 'Completed';
          const updated: CrmTask = {
            ...t,
            status: isDone ? 'Pending' : 'Completed',
            completedAt: isDone ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveTaskToCloud(updated).catch(console.error);
          return updated;
        }
        return t;
      });
      try {
        localStorage.setItem('hwcrm_tasks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast('Task status updated.');
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
          setLeadFormInitialMode('manual');
          setActivePage('add');
        }}
        onOpenWhatsAppTemplates={() => {
          setWhatsAppLead(null);
          setIsWhatsAppModalOpen(true);
        }}
        onClearAllData={handleClearAllData}
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
              setLeadFormInitialMode('manual');
            }
            setActivePage(page);
          }}
          leads={visibleLeads}
          calls={visibleCalls}
          dealsCount={visibleDeals.length}
          tasksCount={visibleTasks.filter((t) => t.status !== 'Completed').length}
          currentUser={currentUser}
          brokersCount={brokers.length}
          siteVisitsCount={siteVisits.length}
          costSheetsCount={costSheets.length}
          tokensAgreementsCount={visibleTokensAgreements.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              leads={visibleLeads}
              calls={visibleCalls}
              siteVisits={visibleSiteVisits}
              tokensAgreements={visibleTokensAgreements}
              deals={visibleDeals}
              tasks={visibleTasks}
              currentUser={currentUser}
              users={users}
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
              teamMembers={teamMembers}
              initialSalespersonFilter={salespersonFilterForLeads}
              onClearSalespersonFilter={() => setSalespersonFilterForLeads('')}
              onAddNewLead={() => {
                setEditingLeadId(null);
                setLeadFormInitialMode('manual');
                setActivePage('add');
              }}
              onImportExcel={() => {
                setEditingLeadId(null);
                setLeadFormInitialMode('excel');
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
              existingLeads={leads}
              teamMembers={teamMembers}
              initialMode={leadFormInitialMode}
              projects={projects}
              developers={developers}
              brokers={brokers}
              onSaveLead={handleSaveLead}
              onBulkImportLeads={handleBulkImportLeads}
              onCancel={() => {
                setEditingLeadId(null);
                setLeadFormInitialMode('manual');
                setActivePage('leads');
              }}
            />
          )}

          {activePage === 'calls' && (
            <CallTrackerView
              leads={visibleLeads}
              calls={visibleCalls}
              teamMembers={teamMembers}
              onOpenLogModal={handleOpenLogCallModal}
              onDeleteCall={handleDeleteCall}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
              onNavigate={(page) => setActivePage(page)}
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

          {/* Real Estate Suite: Tokens & Agreements */}
          {activePage === 'tokens_agreements' && (
            <TokensAgreementsView
              tokensAgreements={tokensAgreements}
              projects={projects}
              leads={visibleLeads}
              currentUser={currentUser || DEFAULT_USERS[0]}
              isAdmin={isAdmin}
              users={users}
              onSaveRecord={handleSaveTokenAgreement}
              onDeleteRecord={handleDeleteTokenAgreement}
            />
          )}

          {/* Sell.Do Real Estate Suite: Brokers & Channel Partners */}
          {activePage === 'brokers' && (
            <BrokersView
              brokers={brokers}
              leads={visibleLeads}
              isAdmin={isAdmin}
              onSaveBroker={handleSaveBroker}
              onDeleteBroker={handleDeleteBroker}
            />
          )}

          {/* Sell.Do Real Estate Suite: Site Visits Hub */}
          {activePage === 'site_visits' && (
            <SiteVisitsView
              siteVisits={siteVisits}
              projects={projects}
              leads={visibleLeads}
              currentUser={currentUser || DEFAULT_USERS[0]}
              isAdmin={isAdmin}
              onSaveSiteVisit={handleSaveSiteVisit}
              onDeleteSiteVisit={handleDeleteSiteVisit}
              onUpdateLeadStatus={handleUpdateLeadStatus}
            />
          )}

          {/* Sell.Do Real Estate Suite: Cost Sheets & Quotations */}
          {activePage === 'cost_sheets' && (
            <CostSheetView
              costSheets={costSheets}
              projects={projects}
              leads={visibleLeads}
              currentUser={currentUser || DEFAULT_USERS[0]}
              isAdmin={isAdmin}
              onSaveCostSheet={handleSaveCostSheet}
              onDeleteCostSheet={handleDeleteCostSheet}
            />
          )}

          {/* CRM Pillar 1: Sales Pipeline & Deals */}
          {activePage === 'pipeline' && (
            <SalesPipelineView
              deals={visibleDeals}
              leads={visibleLeads}
              projects={projects}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onSaveDeal={handleSaveDeal}
              onDeleteDeal={handleDeleteDeal}
              onNavigate={(page) => setActivePage(page)}
              onOpenLogModal={handleOpenLogCallModal}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
            />
          )}

          {/* CRM Pillar 3: Communication & Activity Center */}
          {activePage === 'communication' && (
            <CommunicationHubView
              calls={visibleCalls}
              leads={visibleLeads}
              siteVisits={visibleSiteVisits}
              tokensAgreements={visibleTokensAgreements}
              tasks={visibleTasks}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onOpenLogModal={handleOpenLogCallModal}
              onDeleteCall={handleDeleteCall}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {/* CRM Pillar 4: Task Management */}
          {activePage === 'tasks' && (
            <TasksView
              tasks={visibleTasks}
              leads={visibleLeads}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onOpenLogModal={handleOpenLogCallModal}
              onViewLeadDetail={(lead) => setDetailLead(lead)}
            />
          )}

          {/* CRM Pillar 5: User & Team Management */}
          {activePage === 'team' && <TeamView leads={leads} currentUser={currentUser} users={users} />}

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
        teamMembers={teamMembers}
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
