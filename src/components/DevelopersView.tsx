import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Percent,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { Developer, Project, AuthUser } from '../types';

interface DevelopersViewProps {
  developers: Developer[];
  projects: Project[];
  currentUser?: AuthUser | null;
  onSaveDeveloper: (developer: Developer) => Promise<void>;
  onDeleteDeveloper: (devId: string) => Promise<void>;
  onViewProjectsForDeveloper: (devId: string, devName: string) => void;
}

export const DevelopersView: React.FC<DevelopersViewProps> = ({
  developers,
  projects,
  currentUser,
  onSaveDeveloper,
  onDeleteDeveloper,
  onViewProjectsForDeveloper,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Under Review'>('All');
  const [mandateFilter, setMandateFilter] = useState<string>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formRera, setFormRera] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formOffice, setFormOffice] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Under Review' | 'Inactive'>('Active');
  const [formMandate, setFormMandate] = useState<
    'Exclusive Mandate' | 'Preferred Partner' | 'Open Brokerage'
  >('Preferred Partner');
  const [formCommission, setFormCommission] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const openAddModal = () => {
    setEditingDev(null);
    setFormName('');
    setFormBrand('');
    setFormRera('');
    setFormPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormOffice('');
    setFormGstin('');
    setFormStatus('Active');
    setFormMandate('Preferred Partner');
    setFormCommission('2.5% on residential, 3.5% on commercial');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (dev: Developer) => {
    setEditingDev(dev);
    setFormName(dev.name);
    setFormBrand(dev.brandName || '');
    setFormRera(dev.reraNumber || '');
    setFormPerson(dev.contactPerson);
    setFormPhone(dev.contactPhone);
    setFormEmail(dev.contactEmail || '');
    setFormOffice(dev.headOffice);
    setFormGstin(dev.gstin || '');
    setFormStatus(dev.status);
    setFormMandate(dev.mandateType);
    setFormCommission(dev.commissionTerms || '');
    setFormNotes(dev.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const devToSave: Developer = {
        id: editingDev ? editingDev.id : `dev-${Date.now()}`,
        name: formName.trim(),
        brandName: formBrand.trim() || undefined,
        reraNumber: formRera.trim() || undefined,
        contactPerson: formPerson.trim() || 'Sales Representative',
        contactPhone: formPhone.trim(),
        contactEmail: formEmail.trim() || undefined,
        headOffice: formOffice.trim() || 'NCR, India',
        gstin: formGstin.trim() || undefined,
        status: formStatus,
        mandateType: formMandate,
        commissionTerms: formCommission.trim() || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: editingDev ? editingDev.createdAt : new Date().toISOString(),
      };

      await onSaveDeveloper(devToSave);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save developer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (devId: string) => {
    try {
      await onDeleteDeveloper(devId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete developer:', err);
    }
  };

  // Filtered developers
  const filteredDevs = useMemo(() => {
    return developers.filter((dev) => {
      const matchesSearch =
        searchTerm === '' ||
        dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dev.brandName && dev.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dev.reraNumber && dev.reraNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dev.headOffice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || dev.status === statusFilter;
      const matchesMandate = mandateFilter === 'All' || dev.mandateType === mandateFilter;

      return matchesSearch && matchesStatus && matchesMandate;
    });
  }, [developers, searchTerm, statusFilter, mandateFilter]);

  // Aggregate stats
  const totalProjectsCount = projects.length;
  const activeDevsCount = developers.filter((d) => d.status === 'Active').length;
  const exclusiveMandates = developers.filter((d) => d.mandateType === 'Exclusive Mandate').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner - Housing World Real Estate Style */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Housing World Developer CRM • Builders & Promoters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Real-Estate Developers
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Tier-1 real estate builders, commercial terms, RERA compliance, and project portfolio
              agreements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Developer</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Total Developers</div>
            <div className="text-xl font-bold text-white mt-0.5">{developers.length}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Active Partners</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{activeDevsCount}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Total Live Projects</div>
            <div className="text-xl font-bold text-sky-400 mt-0.5">{totalProjectsCount}</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="text-slate-400 text-[11px] font-medium">Exclusive Mandates</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{exclusiveMandates}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search developer, brand, RERA, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
          </select>

          <select
            value={mandateFilter}
            onChange={(e) => setMandateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Mandates</option>
            <option value="Exclusive Mandate">Exclusive Mandate</option>
            <option value="Preferred Partner">Preferred Partner</option>
            <option value="Open Brokerage">Open Brokerage</option>
          </select>
        </div>
      </div>

      {/* Developers Grid */}
      {filteredDevs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Koi developer nahi mila</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Search terms change karein ya naya Real-Estate Builder add karein.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Add New Developer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDevs.map((dev) => {
            const devProjects = projects.filter(
              (p) => p.developerId === dev.id || p.developerName === dev.name
            );
            const totalUnits = devProjects.reduce((acc, p) => acc + (p.totalUnits || 0), 0);
            const soldUnits = devProjects.reduce((acc, p) => acc + (p.soldUnits || 0), 0);

            return (
              <div
                key={dev.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Developer Top Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-sm">
                        {dev.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {dev.name}
                        </h3>
                        {dev.brandName && (
                          <div className="text-xs text-slate-500 font-medium">{dev.brandName}</div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        dev.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {dev.status}
                    </span>
                  </div>

                  {/* RERA and Mandate badge */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      {dev.reraNumber || 'RERA Registered'}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                        dev.mandateType === 'Exclusive Mandate'
                          ? 'bg-purple-100 text-purple-700'
                          : dev.mandateType === 'Preferred Partner'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {dev.mandateType}
                    </span>
                  </div>
                </div>

                {/* Developer Info Body */}
                <div className="p-5 space-y-3 text-xs flex-1">
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{dev.headOffice}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-indigo-600" />
                      <a
                        href={`tel:${dev.contactPhone}`}
                        className="hover:underline font-medium text-slate-800"
                      >
                        {dev.contactPhone}
                      </a>
                    </div>
                    {dev.contactEmail && (
                      <a
                        href={`mailto:${dev.contactEmail}`}
                        className="text-slate-400 hover:text-indigo-600 transition"
                        title={dev.contactEmail}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Percent className="w-3 h-3 text-indigo-600" />
                      <span>Commission / Brokerage Terms:</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {dev.commissionTerms || 'Standard 2.5% Base'}
                    </div>
                  </div>

                  {/* Mapped Projects summary */}
                  <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-indigo-900 font-medium">Mapped Projects</div>
                      <div className="text-sm font-bold text-indigo-950 mt-0.5">
                        {devProjects.length} Project(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-indigo-900 font-medium">Total Inventory</div>
                      <div className="text-xs font-bold text-indigo-950 mt-0.5">
                        {soldUnits} / {totalUnits} Sold
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onViewProjectsForDeveloper(dev.id, dev.name)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <span>View Projects</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(dev)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition"
                      title="Edit Developer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(dev.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                        title="Delete Developer"
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

      {/* Add / Edit Developer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {editingDev ? 'Edit Developer Profile' : 'Add New Real-Estate Developer'}
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

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Developer Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLF Limited, Godrej Properties"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Marketing Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DLF Homes, Godrej"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RERA Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HRERA-PKL-GGM-102-2021"
                    value={formRera}
                    onChange={(e) => setFormRera(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (GST Number)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06AAACD1234F1Z8"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person / Sales Liaison *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arunav Sengupta (VP Sales)"
                    value={formPerson}
                    onChange={(e) => setFormPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98101 22334"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. sales@dlf.in"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandate Relationship Type
                  </label>
                  <select
                    value={formMandate}
                    onChange={(e) => setFormMandate(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Exclusive Mandate">Exclusive Mandate (Sole Marketing)</option>
                    <option value="Preferred Partner">Preferred Partner (Tier 1 CP)</option>
                    <option value="Open Brokerage">Open Brokerage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head Office / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber City, Sector 25, Gurugram"
                  value={formOffice}
                  onChange={(e) => setFormOffice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreed Commission / Brokerage Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3.0% Base + 0.5% Kicker on >3 Bookings"
                  value={formCommission}
                  onChange={(e) => setFormCommission(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Escrow bank, key contact timings..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingDev
                    ? 'Update Developer'
                    : 'Save & Register Developer'}
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
            <h3 className="font-bold text-slate-900 text-base">Delete Developer?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kya aap is developer record ko delete karna chahte hain? Mapped projects par iska
              effect ho sakta hai.
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
                onClick={() => handleDelete(deleteConfirmId)}
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
