import React, { useState, useMemo } from 'react';
import {
  Users2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  IndianRupee,
  Briefcase,
  Share2,
  ExternalLink,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  FileCheck,
  UserCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Broker, BrokerPayout, Lead, Project, AuthUser } from '../types';

interface BrokersViewProps {
  brokers: Broker[];
  leads: Lead[];
  projects: Project[];
  currentUser?: AuthUser | null;
  onSaveBroker: (broker: Broker) => Promise<void>;
  onDeleteBroker: (brokerId: string) => Promise<void>;
  onSelectBrokerLeads?: (brokerName: string) => void;
}

export const BrokersView: React.FC<BrokersViewProps> = ({
  brokers,
  leads,
  projects,
  currentUser,
  onSaveBroker,
  onDeleteBroker,
  onSelectBrokerLeads,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Under Verification'>('All');

  // Add / Edit Broker Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [operatingAreas, setOperatingAreas] = useState('');
  const [reraBrokerId, setReraBrokerId] = useState('');
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [tier, setTier] = useState<Broker['tier']>('Gold');
  const [commissionRate, setCommissionRate] = useState<number>(2.5);
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [status, setStatus] = useState<Broker['status']>('Active');
  const [notes, setNotes] = useState('');

  // Payout Modal
  const [payoutBroker, setPayoutBroker] = useState<Broker | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(100000);
  const [payoutProjName, setPayoutProjName] = useState<string>('');
  const [payoutUnitNum, setPayoutUnitNum] = useState<string>('');
  const [payoutRemarks, setPayoutRemarks] = useState<string>('');

  // Delete modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Format INR
  const fmtInr = (num: number) => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const openAddModal = () => {
    setEditingBroker(null);
    setFirmName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setCity('Gurugram');
    setOperatingAreas('Golf Course Ext, Dwarka Expressway, Sohna Road');
    setReraBrokerId('');
    setGstin('');
    setPanNumber('');
    setTier('Gold');
    setCommissionRate(2.5);
    setBankAccount('');
    setBankIfsc('');
    setStatus('Active');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Broker) => {
    setEditingBroker(b);
    setFirmName(b.firmName);
    setContactPerson(b.contactPerson);
    setPhone(b.phone);
    setEmail(b.email || '');
    setCity(b.city);
    setOperatingAreas(b.operatingAreas ? b.operatingAreas.join(', ') : '');
    setReraBrokerId(b.reraBrokerId || '');
    setGstin(b.gstin || '');
    setPanNumber(b.panNumber || '');
    setTier(b.tier);
    setCommissionRate(b.agreedCommissionPercent ?? b.commissionRatePercent ?? 2.0);
    const bankObj = typeof b.bankDetails === 'object' && b.bankDetails !== null ? b.bankDetails : null;
    setBankAccount(bankObj?.accountNumber || (typeof b.bankDetails === 'string' ? b.bankDetails : '') || b.bankAccountDetails || '');
    setBankIfsc(bankObj?.ifsc || '');
    setStatus(b.status);
    setNotes(b.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveBrokerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !phone.trim()) return;

    const brokerToSave: Broker = {
      id: editingBroker ? editingBroker.id : `broker-${Date.now()}`,
      firmName: firmName.trim(),
      contactPerson: contactPerson.trim() || firmName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim() || 'NCR',
      operatingAreas: operatingAreas.split(',').map((s) => s.trim()).filter(Boolean),
      reraBrokerId: reraBrokerId.trim() || undefined,
      gstin: gstin.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      tier,
      agreedCommissionPercent: Number(commissionRate) || 2.0,
      totalLeadsSourced: editingBroker ? editingBroker.totalLeadsSourced : 0,
      totalDealsClosed: editingBroker ? editingBroker.totalDealsClosed : 0,
      totalBrokerageEarned: editingBroker ? editingBroker.totalBrokerageEarned : 0,
      totalBrokeragePaid: editingBroker ? editingBroker.totalBrokeragePaid : 0,
      pendingBrokerage: editingBroker ? editingBroker.pendingBrokerage : 0,
      status,
      bankDetails: bankAccount.trim()
        ? {
            accountNumber: bankAccount.trim(),
            ifsc: bankIfsc.trim() || 'HDFC0000123',
            bankName: 'HDFC Bank',
          }
        : undefined,
      notes: notes.trim() || undefined,
      createdAt: editingBroker ? editingBroker.createdAt : new Date().toISOString(),
    };

    await onSaveBroker(brokerToSave);
    setIsModalOpen(false);
  };

  // Record payout submission
  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutBroker || payoutAmount <= 0) return;

    const newPayout: BrokerPayout = {
      id: `pay-${Date.now()}`,
      brokerId: payoutBroker.id,
      brokerName: payoutBroker.firmName,
      amount: payoutAmount,
      leadId: 0,
      leadName: 'Direct Deal',
      projectName: payoutProjName || 'Project Commission',
      unitNumber: payoutUnitNum || 'Unit',
      dealValue: payoutAmount * 40, // standard assumption
      commissionRate: payoutBroker.agreedCommissionPercent,
      commissionAmount: payoutAmount,
      paidAmount: payoutAmount,
      status: 'Paid',
      paymentDate: new Date().toISOString(),
      transactionRef: `NEFT${Math.floor(10000000 + Math.random() * 90000000)}`,
      remarks: payoutRemarks || 'Commission disbursed via RTGS',
    };

    const updatedBroker: Broker = {
      ...payoutBroker,
      totalBrokeragePaid: (payoutBroker.totalBrokeragePaid || 0) + payoutAmount,
      pendingBrokerage: Math.max(0, (payoutBroker.pendingBrokerage || 0) - payoutAmount),
    };

    await onSaveBroker(updatedBroker);
    setPayoutBroker(null);
    setPayoutRemarks('');
  };

  // Filtered brokers
  const filteredBrokers = useMemo(() => {
    return brokers.filter((b) => {
      const matchesSearch =
        searchTerm === '' ||
        b.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone.includes(searchTerm) ||
        (b.reraBrokerId && b.reraBrokerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        b.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTier = tierFilter === 'All' || b.tier === tierFilter;
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [brokers, searchTerm, tierFilter, statusFilter]);

  // Aggregate stats
  const totalBrokers = brokers.length;
  const platinumBrokers = brokers.filter((b) => b.tier === 'Platinum').length;
  const totalLeadsSourced = brokers.reduce((acc, b) => acc + (b.totalLeadsSourced || 0), 0);
  const totalBrokerageDisbursed = brokers.reduce((acc, b) => acc + (b.totalBrokeragePaid || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner - Sell.Do Real Estate Style */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Users2 className="w-4 h-4" />
              <span>Sell.Do Channel Partner Network • ब्रोकर्स एवं डिस्ट्रीब्यूटर्स</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Brokers & Channel Partners
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              RERA accredited channel partner firms, tiered commissions (Platinum, Gold, Silver),
              lead sourcing attribution, and brokerage payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Broker</span>
            </button>
          </div>
        </div>

        {/* Global CP Network KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Registered CPs</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalBrokers}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Platinum Tier Partners</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{platinumBrokers}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Total Leads Sourced</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">{totalLeadsSourced}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Brokerage Disbursed</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {fmtInr(totalBrokerageDisbursed)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search broker firm, contact, phone, RERA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Tiers</option>
            <option value="Platinum">Platinum Tier (3.0%+)</option>
            <option value="Gold">Gold Tier (2.5%)</option>
            <option value="Silver">Silver Tier (2.0%)</option>
            <option value="Associate">Associate Tier (1.5%)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Verification">Under Verification</option>
          </select>
        </div>
      </div>

      {/* Brokers Grid */}
      {filteredBrokers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Koi Channel Partner nahi mila</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Search filters adjust karein ya naya Broker / Channel Partner register karein.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
          >
            Register New Broker
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBrokers.map((broker) => {
            // Sourced leads count from actual leads list
            const brokerLeads = leads.filter(
              (l) => l.brokerId === broker.id || (l.brokerName && l.brokerName.toLowerCase().includes(broker.firmName.toLowerCase()))
            );
            const actualLeadCount = Math.max(broker.totalLeadsSourced || 0, brokerLeads.length);

            return (
              <div
                key={broker.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-sm">
                        {broker.firmName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {broker.firmName}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">
                          Proprietor: {broker.contactPerson}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        broker.tier === 'Platinum'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : broker.tier === 'Gold'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {broker.tier} CP
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {broker.reraBrokerId && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {broker.reraBrokerId}
                      </span>
                    )}
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                      {broker.agreedCommissionPercent}% Commission
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3.5 text-xs flex-1">
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {broker.city}
                      {broker.operatingAreas && broker.operatingAreas.length > 0 && (
                        <span className="text-slate-400 text-[11px] block">
                          Areas: {broker.operatingAreas.join(', ')}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Phone and WhatsApp */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <a href={`tel:${broker.phone}`} className="hover:underline">
                        {broker.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Namaste ${broker.contactPerson} ji! We have fresh project inventory and brochures from Housing Worlds CRM. Let's discuss hot investor units.`;
                          window.open(
                            `https://wa.me/${broker.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`,
                            '_blank'
                          );
                        }}
                        className="text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded font-medium flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Financial & Deal Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sourced Leads</span>
                      <strong className="text-slate-800 text-sm">{actualLeadCount}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Deals Closed</span>
                      <strong className="text-emerald-700 text-sm">
                        {broker.totalDealsClosed || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Brokerage Paid</span>
                      <strong className="text-slate-800 text-xs">
                        {fmtInr(broker.totalBrokeragePaid || 0)}
                      </strong>
                    </div>
                  </div>

                  {/* Pending Brokerage Alert */}
                  {(broker.pendingBrokerage || 0) > 0 && (
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-amber-800 font-medium block">
                          Unpaid / Due Brokerage:
                        </span>
                        <strong className="text-amber-950 font-bold">
                          {fmtInr(broker.pendingBrokerage)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPayoutBroker(broker);
                          setPayoutAmount(broker.pendingBrokerage);
                          setPayoutProjName(projects[0]?.name || '');
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                      >
                        Disburse
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutBroker(broker);
                      setPayoutAmount(50000);
                      setPayoutProjName(projects[0]?.name || '');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay Commission</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(broker)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition"
                      title="Edit Broker"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(broker.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                        title="Delete Broker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* RECORD PAYOUT MODAL */}
      {/* ========================================================= */}
      {payoutBroker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">
                Record Brokerage Payout • {payoutBroker.firmName}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Agreed Rate: <strong>{payoutBroker.agreedCommissionPercent}%</strong>. Payout will be
              recorded to the Channel Partner ledger and updated in real time.
            </p>

            <form onSubmit={handleRecordPayout} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Disbursed Payout Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                <select
                  value={payoutProjName}
                  onChange={(e) => setPayoutProjName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.developerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit / Flat / Booking Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tower A - Flat 402"
                  value={payoutUnitNum}
                  onChange={(e) => setPayoutUnitNum(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Notes / RTGS Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. RTGS HDFC-98218128 on 2026-09-11"
                  value={payoutRemarks}
                  onChange={(e) => setPayoutRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayoutBroker(null)}
                  className="px-3 py-1.5 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT BROKER MODAL */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  {editingBroker ? 'Edit Channel Partner' : 'Register New Channel Partner / Broker'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={handleSaveBrokerSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Broker Firm / Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prime Square Realty Advisors"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proprietor / Key Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Batra"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98111 22334"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="vikram@primesquare.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Channel Partner Tier
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Platinum">Platinum Tier (Top Performer)</option>
                    <option value="Gold">Gold Tier</option>
                    <option value="Silver">Silver Tier</option>
                    <option value="Associate">Associate Tier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agreed Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RERA Broker License No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HRERA-PKL-REA-142-2022"
                    value={reraBrokerId}
                    onChange={(e) => setReraBrokerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="06ABCDE1234F1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating City
                  </label>
                  <input
                    type="text"
                    placeholder="Gurugram, Noida, Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Micro-Markets (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Golf Course Ext, Sohna Road, New Gurugram"
                    value={operatingAreas}
                    onChange={(e) => setOperatingAreas(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Account (For RTGS Payouts)
                  </label>
                  <input
                    type="text"
                    placeholder="50200029381283"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC0000123"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status & Approval
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Active">Active (Verified & Approved)</option>
                  <option value="Under Verification">Under Verification (Documents Pending)</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  {editingBroker ? 'Update Partner' : 'Save Channel Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Broker Record?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kya aap is Channel Partner ko delete karna chahte hain?
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteBroker(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
