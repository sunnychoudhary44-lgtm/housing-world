import React, { useState, useEffect } from 'react';
import { Lead, LeadPriority, LeadSource, LeadStatus, AuthUser } from '../types';
import {
  STATUSES,
  SOURCES,
  TEAM_MEMBERS,
  COMMON_PROJECTS,
  COMMON_SIZES,
} from '../data/initialData';
import { Sparkles, ArrowLeft, Save, RotateCcw, AlertCircle, Lock, User } from 'lucide-react';

interface LeadFormViewProps {
  editLeadData?: Lead | null;
  currentUser?: AuthUser | null;
  onSaveLead: (lead: Omit<Lead, 'id'> & { id?: number }) => void;
  onCancel: () => void;
}

export const LeadFormView: React.FC<LeadFormViewProps> = ({
  editLeadData,
  currentUser,
  onSaveLead,
  onCancel,
}) => {
  const isEditing = Boolean(editLeadData && editLeadData.id);
  const isUserRole = currentUser?.role === 'user';

  // Form states matching original CRM fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [project, setProject] = useState('');
  const [source, setSource] = useState<LeadSource>('Facebook');
  const [budget, setBudget] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [salesperson, setSalesperson] = useState(
    isUserRole && currentUser?.name ? currentUser.name : ''
  );
  const [followup, setFollowup] = useState('');
  const [priority, setPriority] = useState<LeadPriority>('Normal');
  const [remarks, setRemarks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editLeadData) {
      setName(editLeadData.name || '');
      setMobile(editLeadData.mobile || '');
      setProject(editLeadData.project || '');
      setSource(editLeadData.source || 'Facebook');
      setBudget(editLeadData.budget || '');
      setSize(editLeadData.size || '');
      setStatus(editLeadData.status || 'New');
      setSalesperson(
        editLeadData.salesperson || (isUserRole && currentUser?.name ? currentUser.name : '')
      );
      setFollowup(editLeadData.followup ? editLeadData.followup.slice(0, 16) : '');
      setPriority(editLeadData.priority || 'Normal');
      setRemarks(editLeadData.remarks || '');
    } else {
      resetForm();
    }
  }, [editLeadData, currentUser]);

  const resetForm = () => {
    setName('');
    setMobile('');
    setProject('');
    setSource('Facebook');
    setBudget('');
    setSize('');
    setStatus('New');
    setSalesperson(isUserRole && currentUser?.name ? currentUser.name : '');
    setFollowup('');
    setPriority('Normal');
    setRemarks('');
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanPhone = mobile.replace(/\D/g, '');

    if (!cleanName) {
      setErrorMessage('Please enter lead name.');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    onSaveLead({
      id: editLeadData?.id,
      name: cleanName,
      mobile: cleanPhone.slice(-10),
      project: project.trim(),
      source,
      budget: budget.trim(),
      size: size.trim(),
      status,
      salesperson,
      followup,
      priority,
      remarks: remarks.trim(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 id="formTitle" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? 'Edit Lead Details' : 'Add New Lead'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isEditing
                ? `Updating lead record #${editLeadData?.id} for Housing Worlds CRM.`
                : 'Enter customer requirements, budget, plot size, and assign salesperson.'}
            </p>
          </div>
        </div>

        {isEditing && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
            Editing Mode
          </span>
        )}
      </div>

      {/* Error alert if validation fails */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <form id="leadForm" onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" id="editId" value={editLeadData?.id || ''} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Lead Name */}
            <div className="field">
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rameshwar Sharma"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all"
              />
            </div>

            {/* Mobile */}
            <div className="field">
              <label htmlFor="mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  +91
                </span>
                <input
                  id="mobile"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none font-mono transition-all"
                />
              </div>
            </div>

            {/* Project */}
            <div className="field">
              <label htmlFor="project" className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name
              </label>
              <input
                id="project"
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Nekpur / Gounchi / Govardhan..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all"
              />
              {/* Quick suggestions chips */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COMMON_PROJECTS.slice(0, 4).map((cp) => (
                  <button
                    key={cp}
                    type="button"
                    onClick={() => setProject(cp)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
                  >
                    + {cp}
                  </button>
                ))}
              </div>
            </div>

            {/* Lead Source */}
            <div className="field">
              <label htmlFor="source" className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all cursor-pointer font-medium"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div className="field">
              <label htmlFor="budget" className="block text-xs font-semibold text-slate-700 mb-1">
                Approx Budget
              </label>
              <input
                id="budget"
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="₹12,00,000"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all"
              />
            </div>

            {/* Plot Size */}
            <div className="field">
              <label htmlFor="size" className="block text-xs font-semibold text-slate-700 mb-1">
                Plot Size (Gaj)
              </label>
              <input
                id="size"
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 100 Gaj"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COMMON_SIZES.slice(0, 5).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors"
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="field">
              <label htmlFor="status" className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all cursor-pointer font-medium"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Salesperson */}
            <div className="field">
              <label htmlFor="salesperson" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Assigned Salesperson</span>
                {isUserRole && (
                  <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Locked to your account
                  </span>
                )}
              </label>

              {isUserRole ? (
                <div className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{currentUser?.name || salesperson || 'User'}</span>
                  <span className="ml-auto text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                    Self
                  </span>
                </div>
              ) : (
                <select
                  id="salesperson"
                  value={salesperson}
                  onChange={(e) => setSalesperson(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="">Unassigned</option>
                  {TEAM_MEMBERS.map((tm) => (
                    <option key={tm} value={tm}>
                      {tm}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Next Follow-up */}
            <div className="field">
              <label htmlFor="followup" className="block text-xs font-semibold text-slate-700 mb-1">
                Next Follow-up Date & Time
              </label>
              <input
                id="followup"
                type="datetime-local"
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all"
              />
            </div>

            {/* Priority */}
            <div className="field">
              <label htmlFor="priority" className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all cursor-pointer font-medium"
              >
                <option value="Normal">Normal</option>
                <option value="Hot">🔥 Hot (Immediate Intent)</option>
                <option value="High">⚡ High (Active Buyer)</option>
              </select>
            </div>

            {/* Remarks (Full width) */}
            <div className="field sm:col-span-2">
              <label htmlFor="remarks" className="block text-xs font-semibold text-slate-700 mb-1">
                Remarks & Notes
              </label>
              <textarea
                id="remarks"
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Client requirements, payment terms discussed, site visit schedule, token amount details..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all resize-y"
              ></textarea>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update Lead' : 'Save Lead'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
