import React, { useState, useMemo } from 'react';
import {
  Deal,
  DealStage,
  Lead,
  Project,
  AuthUser,
} from '../types';
import { formatINR } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import {
  Kanban,
  ListFilter,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  ArrowLeft,
  Phone,
  MessageSquare,
  Building2,
  Calendar,
  User,
  ChevronRight,
  Sparkles,
  Flame,
  AlertCircle,
  FileCheck2,
  SlidersHorizontal,
  X,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface SalesPipelineViewProps {
  deals: Deal[];
  leads: Lead[];
  projects: Project[];
  currentUser?: AuthUser | null;
  isAdmin: boolean;
  onSaveDeal: (deal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
  onNavigate?: (page: any) => void;
  onOpenLogModal?: (lead?: Lead) => void;
  onViewLeadDetail?: (lead: Lead) => void;
}

export const STAGES_CONFIG: Array<{
  stage: DealStage;
  label: string;
  hindiLabel: string;
  color: string;
  badgeBg: string;
  borderClass: string;
  headerBg: string;
}> = [
  {
    stage: 'Discovery',
    label: 'Discovery & Need',
    hindiLabel: 'प्रारंभिक खोज',
    color: 'text-sky-700',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    borderClass: 'border-sky-400',
    headerBg: 'bg-sky-50',
  },
  {
    stage: 'Site Visit Scheduled',
    label: 'Site Visit Scheduled',
    hindiLabel: 'साइट विज़िट तय',
    color: 'text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    borderClass: 'border-indigo-400',
    headerBg: 'bg-indigo-50',
  },
  {
    stage: 'Site Visit Completed',
    label: 'Site Visit Done',
    hindiLabel: 'विज़िट सम्पन्न',
    color: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    borderClass: 'border-purple-400',
    headerBg: 'bg-purple-50',
  },
  {
    stage: 'Negotiation & Proposal',
    label: 'Negotiation & Quote',
    hindiLabel: 'मोलभाव व कोटेशन',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    borderClass: 'border-amber-400',
    headerBg: 'bg-amber-50',
  },
  {
    stage: 'Token Received',
    label: 'Token / Bayana Paid',
    hindiLabel: 'टोकन प्राप्त',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderClass: 'border-emerald-400',
    headerBg: 'bg-emerald-50',
  },
  {
    stage: 'Agreement Signed',
    label: 'ATS / BBA Signed',
    hindiLabel: 'एग्रीमेंट हस्ताक्षरित',
    color: 'text-teal-700',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    borderClass: 'border-teal-400',
    headerBg: 'bg-teal-50',
  },
  {
    stage: 'Closed Won',
    label: 'Closed Won (Registry)',
    hindiLabel: 'सौदा पक्का (रजिस्ट्री)',
    color: 'text-emerald-900',
    badgeBg: 'bg-emerald-200 text-emerald-900 border-emerald-400 font-bold',
    borderClass: 'border-emerald-600',
    headerBg: 'bg-emerald-100/70',
  },
  {
    stage: 'Closed Lost',
    label: 'Closed Lost',
    hindiLabel: 'सौदा छूटा (Lost)',
    color: 'text-slate-600',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    borderClass: 'border-slate-400',
    headerBg: 'bg-slate-100/60',
  },
];

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({
  deals,
  leads,
  projects,
  currentUser,
  isAdmin,
  onSaveDeal,
  onDeleteDeal,
  onNavigate,
  onOpenLogModal,
  onViewLeadDetail,
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Form Fields
  const [formLeadId, setFormLeadId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formClientMobile, setFormClientMobile] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formUnitNumber, setFormUnitNumber] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formDealValue, setFormDealValue] = useState<number>(2500000);
  const [formTokenAmount, setFormTokenAmount] = useState<number>(100000);
  const [formExpectedDate, setFormExpectedDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [formStage, setFormStage] = useState<DealStage>('Discovery');
  const [formProbability, setFormProbability] = useState<number>(50);
  const [formPriority, setFormPriority] = useState<'Hot' | 'High' | 'Normal'>('High');
  const [formSalesperson, setFormSalesperson] = useState(currentUser?.name || 'Sunny Choudhary');
  const [formBrokerName, setFormBrokerName] = useState('');
  const [formBrokerCommission, setFormBrokerCommission] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');

  // Extract all unique salespersons from deals and leads
  const allSalespersons = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => d.salesperson && set.add(d.salesperson));
    leads.forEach((l) => l.salesperson && set.add(l.salesperson));
    if (currentUser?.name) set.add(currentUser.name);
    return Array.from(set).sort();
  }, [deals, leads, currentUser]);

  // Extract unique project names
  const allProjectNames = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.name));
    deals.forEach((d) => d.projectName && set.add(d.projectName));
    leads.forEach((l) => l.project && set.add(l.project));
    return Array.from(set).sort();
  }, [projects, deals, leads]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      // Role filtering if not admin
      if (!isAdmin && currentUser?.name) {
        if (d.salesperson?.toLowerCase() !== currentUser.name.toLowerCase()) {
          return false;
        }
      }

      if (selectedExecutive !== 'all' && d.salesperson !== selectedExecutive) {
        return false;
      }
      if (selectedProject !== 'all' && d.projectName !== selectedProject) {
        return false;
      }
      if (selectedPriority !== 'all' && d.priority !== selectedPriority) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = d.title.toLowerCase().includes(query);
        const matchClient = d.clientName.toLowerCase().includes(query);
        const matchMobile = d.clientMobile.includes(query);
        const matchNumber = d.dealNumber.toLowerCase().includes(query);
        const matchProject = d.projectName.toLowerCase().includes(query);
        if (!matchTitle && !matchClient && !matchMobile && !matchNumber && !matchProject) {
          return false;
        }
      }
      return true;
    });
  }, [deals, isAdmin, currentUser, selectedExecutive, selectedProject, selectedPriority, searchTerm]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalPipelineValue = filteredDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);
    const activeDeals = filteredDeals.filter(
      (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
    );
    const activeValue = activeDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);
    const wonDeals = filteredDeals.filter((d) => d.stage === 'Closed Won');
    const wonValue = wonDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);
    const tokenCollected = filteredDeals.reduce((sum, d) => sum + (d.tokenAmountPaid || 0), 0);

    const weightedForecast = activeDeals.reduce(
      (sum, d) => sum + (d.dealValue * (d.probability || 50)) / 100,
      0
    );

    const totalClosed = filteredDeals.filter(
      (d) => d.stage === 'Closed Won' || d.stage === 'Closed Lost'
    ).length;
    const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

    return {
      totalDealsCount: filteredDeals.length,
      totalPipelineValue,
      activeDealsCount: activeDeals.length,
      activeValue,
      wonDealsCount: wonDeals.length,
      wonValue,
      tokenCollected,
      weightedForecast,
      winRate,
    };
  }, [filteredDeals]);

  // Stage change handler
  const handleStageChange = (deal: Deal, newStage: DealStage) => {
    const updated: Deal = {
      ...deal,
      stage: newStage,
      probability:
        newStage === 'Closed Won'
          ? 100
          : newStage === 'Closed Lost'
          ? 0
          : newStage === 'Token Received'
          ? 85
          : newStage === 'Agreement Signed'
          ? 95
          : deal.probability,
      updatedAt: new Date().toISOString(),
    };
    onSaveDeal(updated);
  };

  // Move forward / backward
  const handleMoveStage = (deal: Deal, direction: 'forward' | 'backward') => {
    const currentIndex = STAGES_CONFIG.findIndex((s) => s.stage === deal.stage);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < STAGES_CONFIG.length) {
      handleStageChange(deal, STAGES_CONFIG[targetIndex].stage);
    }
  };

  // Open modal for new or editing deal
  const openNewDealModal = (prefillLead?: Lead) => {
    setEditingDeal(null);
    if (prefillLead) {
      setFormLeadId(String(prefillLead.id));
      setFormTitle(`${prefillLead.project} - Deal for ${prefillLead.name}`);
      setFormClientName(prefillLead.name);
      setFormClientMobile(prefillLead.mobile);
      setFormClientEmail('');
      setFormProjectName(prefillLead.project);
      setFormUnitNumber(prefillLead.unitBooked || '');
      setFormSize(prefillLead.size || '150 Gaj');
      setFormDealValue(prefillLead.totalDealValue || 2500000);
      setFormTokenAmount(prefillLead.paymentReceived || 100000);
      setFormStage(prefillLead.status === 'Booking' ? 'Token Received' : 'Discovery');
      setFormProbability(prefillLead.priority === 'Hot' ? 75 : 50);
      setFormPriority(prefillLead.priority);
      setFormSalesperson(prefillLead.salesperson || currentUser?.name || 'Sunny Choudhary');
      setFormBrokerName(prefillLead.brokerName || '');
    } else {
      setFormLeadId('');
      setFormTitle('');
      setFormClientName('');
      setFormClientMobile('');
      setFormClientEmail('');
      setFormProjectName(allProjectNames[0] || 'Govardhan Enclave');
      setFormUnitNumber('');
      setFormSize('150 Gaj');
      setFormDealValue(2500000);
      setFormTokenAmount(100000);
      setFormStage('Discovery');
      setFormProbability(50);
      setFormPriority('High');
      setFormSalesperson(currentUser?.name || 'Sunny Choudhary');
      setFormBrokerName('');
    }
    setFormBrokerCommission(0);
    setFormNotes('');
    setFormExpectedDate(
      new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    );
    setIsModalOpen(true);
  };

  const openEditDealModal = (deal: Deal) => {
    setEditingDeal(deal);
    setFormLeadId(deal.leadId ? String(deal.leadId) : '');
    setFormTitle(deal.title);
    setFormClientName(deal.clientName);
    setFormClientMobile(deal.clientMobile);
    setFormClientEmail(deal.clientEmail || '');
    setFormProjectName(deal.projectName);
    setFormUnitNumber(deal.unitNumber || '');
    setFormSize(deal.size || '');
    setFormDealValue(deal.dealValue);
    setFormTokenAmount(deal.tokenAmountPaid || 0);
    setFormExpectedDate(deal.expectedCloseDate || '');
    setFormStage(deal.stage);
    setFormProbability(deal.probability);
    setFormPriority(deal.priority);
    setFormSalesperson(deal.salesperson);
    setFormBrokerName(deal.brokerName || '');
    setFormBrokerCommission(deal.brokerCommission || 0);
    setFormNotes(deal.notes || '');
    setIsModalOpen(true);
  };

  // When lead is picked from dropdown in form
  const handleLeadSelectInForm = (leadIdStr: string) => {
    setFormLeadId(leadIdStr);
    if (!leadIdStr) return;
    const selected = leads.find((l) => String(l.id) === leadIdStr);
    if (selected) {
      setFormClientName(selected.name);
      setFormClientMobile(selected.mobile);
      setFormProjectName(selected.project);
      setFormSize(selected.size || formSize);
      if (selected.totalDealValue) setFormDealValue(selected.totalDealValue);
      if (selected.paymentReceived) setFormTokenAmount(selected.paymentReceived);
      if (!formTitle || formTitle.startsWith('Deal for')) {
        setFormTitle(`${selected.project} - ${selected.name}`);
      }
      setFormSalesperson(selected.salesperson || formSalesperson);
      setFormPriority(selected.priority);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName || !formClientMobile || !formProjectName) {
      alert('Please enter Client Name, Mobile, and Project.');
      return;
    }

    const finalDeal: Deal = {
      id: editingDeal ? editingDeal.id : `deal-${Date.now()}`,
      dealNumber: editingDeal
        ? editingDeal.dealNumber
        : `DL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: formTitle || `${formProjectName} - ${formClientName}`,
      leadId: formLeadId ? Number(formLeadId) : undefined,
      clientName: formClientName.trim(),
      clientMobile: formClientMobile.trim(),
      clientEmail: formClientEmail.trim() || undefined,
      projectName: formProjectName.trim(),
      unitNumber: formUnitNumber.trim() || undefined,
      size: formSize.trim() || undefined,
      dealValue: Number(formDealValue) || 0,
      tokenAmountPaid: Number(formTokenAmount) || 0,
      expectedCloseDate: formExpectedDate,
      stage: formStage,
      probability: Number(formProbability) || 50,
      priority: formPriority,
      salesperson: formSalesperson,
      brokerName: formBrokerName.trim() || undefined,
      brokerCommission: Number(formBrokerCommission) || 0,
      notes: formNotes.trim() || undefined,
      createdAt: editingDeal ? editingDeal.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveDeal(finalDeal);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Kanban className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {t('pipelineTitle', 'Sales Pipeline & Deal Management')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t(
                    'pipelineSubtitle',
                    'Track deals across sales stages, stage conversion probability, and token advance receipts.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>

            {/* Add Deal Button */}
            <button
              type="button"
              onClick={() => openNewDealModal()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createDeal', '+ Create New Deal')}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Ribbons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5 mt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Deals Value
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {formatINR(metrics.totalPipelineValue, true)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {metrics.totalDealsCount} Total Pipeline Deals
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100">
            <div className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider">
              Active In-Flight
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-sky-900 mt-0.5">
              {formatINR(metrics.activeValue, true)}
            </div>
            <div className="text-[11px] text-sky-700 mt-0.5">
              {metrics.activeDealsCount} in progress deals
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Won Revenue
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-900 mt-0.5">
              {formatINR(metrics.wonValue, true)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              {metrics.wonDealsCount} deals closed & won
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
              Token Advance
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-amber-900 mt-0.5">
              {formatINR(metrics.tokenCollected, true)}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              Advance collected in cash/cheque
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider">
              Weighted Forecast
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-purple-900 mt-0.5">
              {formatINR(metrics.weightedForecast, true)}
            </div>
            <div className="text-[11px] text-purple-700 mt-0.5">
              Win Rate: <span className="font-bold">{metrics.winRate}%</span>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deal name, client, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isAdmin && (
            <select
              value={selectedExecutive}
              onChange={(e) => setSelectedExecutive(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Sales Executives ({allSalespersons.length})</option>
              {allSalespersons.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Projects</option>
            {allProjectNames.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Hot">🔥 Hot Priority</option>
            <option value="High">⚡ High Priority</option>
            <option value="Normal">Normal Priority</option>
          </select>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1280px]">
            {STAGES_CONFIG.map(({ stage, label, hindiLabel, color, badgeBg, borderClass, headerBg }) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === stage);
              const stageValue = stageDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0);

              return (
                <div
                  key={stage}
                  className="flex-1 min-w-[280px] max-w-[320px] bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col h-[740px]"
                >
                  {/* Stage Header */}
                  <div className={`p-3.5 rounded-t-2xl border-b border-slate-200 ${headerBg}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {label}
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {stageDeals.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{hindiLabel}</span>
                      <span className="font-bold text-slate-800">{formatINR(stageValue, true)}</span>
                    </div>
                  </div>

                  {/* Deals Scrollable Container */}
                  <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                    {stageDeals.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-xl text-slate-400">
                        <span className="text-xs">No deals in this stage</span>
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const isHot = deal.priority === 'Hot';
                        return (
                          <div
                            key={deal.id}
                            className={`bg-white rounded-xl p-3 border shadow-2xs hover:shadow-md transition-all relative ${
                              isHot ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                            }`}
                          >
                            {/* Card Top: Deal Number & Priority */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {deal.dealNumber}
                              </span>
                              <div className="flex items-center gap-1">
                                {deal.priority === 'Hot' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                    <Flame className="w-3 h-3 text-amber-600" />
                                    <span>Hot</span>
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {deal.probability}% win
                                </span>
                              </div>
                            </div>

                            {/* Title & Client */}
                            <div
                              onClick={() => openEditDealModal(deal)}
                              className="font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                              title={deal.title}
                            >
                              {deal.title}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">
                                {deal.clientName}
                              </span>
                            </div>

                            {/* Project & Unit / Size */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {deal.projectName} {deal.size ? `• ${deal.size}` : ''}
                              </span>
                            </div>

                            {/* Value & Token Info */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                  Deal Value
                                </div>
                                <div className="text-xs sm:text-sm font-extrabold text-blue-700">
                                  {formatINR(deal.dealValue, true)}
                                </div>
                              </div>
                              {deal.tokenAmountPaid > 0 && (
                                <div className="text-right">
                                  <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
                                    Token Recd
                                  </div>
                                  <div className="text-xs font-bold text-emerald-700">
                                    {formatINR(deal.tokenAmountPaid, true)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Salesperson & Expected Date */}
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="truncate max-w-[120px]">
                                👤 {deal.salesperson}
                              </span>
                              <span>📅 {deal.expectedCloseDate}</span>
                            </div>

                            {/* Quick Action Navigation Bar */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Call Client"
                                  onClick={() => {
                                    window.open(`tel:${deal.clientMobile}`, '_self');
                                  }}
                                  className="p-1 rounded-md text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="WhatsApp"
                                  onClick={() => {
                                    window.open(
                                      `https://wa.me/91${deal.clientMobile}?text=${encodeURIComponent(
                                        `Namaste ${deal.clientName} ji, regarding your interest in ${deal.projectName} (${deal.title})...`
                                      )}`,
                                      '_blank'
                                    );
                                  }}
                                  className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Stage Movement Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Move to Previous Stage"
                                  onClick={() => handleMoveStage(deal, 'backward')}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Advance to Next Stage"
                                  onClick={() => handleMoveStage(deal, 'forward')}
                                  className="p-1 px-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md flex items-center gap-0.5 transition-colors"
                                >
                                  <span>Next</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE / LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Deal Details</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Project & Size</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Deal Value</th>
                  <th className="px-4 py-3 text-right">Token Paid</th>
                  <th className="px-4 py-3">Executive</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No deals match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const stageObj = STAGES_CONFIG.find((s) => s.stage === deal.stage);
                    return (
                      <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{deal.title}</span>
                            {deal.priority === 'Hot' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                🔥 Hot
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {deal.dealNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{deal.clientName}</div>
                          <div className="text-xs text-slate-500">{deal.clientMobile}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{deal.projectName}</div>
                          <div className="text-xs text-slate-500">
                            {deal.unitNumber ? `${deal.unitNumber} • ` : ''}
                            {deal.size}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={deal.stage}
                            onChange={(e) => handleStageChange(deal, e.target.value as DealStage)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer ${
                              stageObj?.badgeBg || 'bg-slate-100'
                            }`}
                          >
                            {STAGES_CONFIG.map((s) => (
                              <option key={s.stage} value={s.stage}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-blue-700">
                          {formatINR(deal.dealValue)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          {deal.tokenAmountPaid > 0 ? formatINR(deal.tokenAmountPaid) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div>{deal.salesperson}</div>
                          <div className="text-[10px] text-slate-400">{deal.expectedCloseDate}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditDealModal(deal)}
                              className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete deal "${deal.title}"?`)) {
                                  onDeleteDeal(deal.id);
                                }
                              }}
                              className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Kanban className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingDeal ? 'Edit Deal & Pipeline Stage' : 'Create New Real Estate Deal'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Link with lead, define agreed property deal value, advance token, and timeline.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              {/* Optional: Pick from existing leads */}
              {!editingDeal && (
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Optionally Pick Existing Lead to Auto-fill:
                  </label>
                  <select
                    value={formLeadId}
                    onChange={(e) => handleLeadSelectInForm(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Create from scratch (No existing lead) --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.name} ({l.project} • {l.budget} • {l.salesperson})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deal Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Govardhan Enclave - Plot #42"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Name *
                  </label>
                  <select
                    required
                    value={formProjectName}
                    onChange={(e) => setFormProjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allProjectNames.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Buyer's full name"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formClientMobile}
                    onChange={(e) => setFormClientMobile(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit / Plot Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot #42 or Tower B - 1204"
                    value={formUnitNumber}
                    onChange={(e) => setFormUnitNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plot / Flat Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 150 Gaj, 3 BHK (1850 sq.ft)"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agreed Deal Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={formDealValue}
                    onChange={(e) => setFormDealValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    = {formatINR(formDealValue)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Token / Advance Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={formTokenAmount}
                    onChange={(e) => setFormTokenAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    = {formatINR(formTokenAmount)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sales Pipeline Stage *
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as DealStage)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {STAGES_CONFIG.map((s) => (
                      <option key={s.stage} value={s.stage}>
                        {s.label} ({s.hindiLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Win Probability (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formProbability}
                    onChange={(e) => setFormProbability(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as 'Hot' | 'High' | 'Normal')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Hot">🔥 Hot Intent</option>
                    <option value="High">⚡ High Priority</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Salesperson *
                  </label>
                  <select
                    value={formSalesperson}
                    onChange={(e) => setFormSalesperson(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {allSalespersons.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formExpectedDate}
                    onChange={(e) => setFormExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Broker / CP Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Channel partner firm"
                    value={formBrokerName}
                    onChange={(e) => setFormBrokerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal Notes / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="Special pricing concessions, payment terms, or registry notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
