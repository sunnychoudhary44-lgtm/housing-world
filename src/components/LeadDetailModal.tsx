import React from 'react';
import {
  X,
  Phone,
  PhoneCall,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Tag,
  Coins,
  Maximize2,
  Edit2,
  Trash2,
  Clock,
  FileText,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';
import { Lead, CallLog } from '../types';
import {
  fmt,
  openWhatsApp,
  makePhoneCall,
  getFollowupTiming,
  formatCallDuration,
  formatINR,
  getLeadPaymentReceived,
} from '../utils/formatters';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onOpenWhatsAppTemplates: (lead: Lead) => void;
  onOpenLogModal?: (lead: Lead) => void;
  calls?: CallLog[];
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onOpenWhatsAppTemplates,
  onOpenLogModal,
  calls = [],
}) => {
  if (!isOpen || !lead) return null;

  const timing = getFollowupTiming(lead.followup, lead.status);

  // Calls for this lead
  const leadCalls = calls.filter(
    (c) => c.leadId === lead.id || c.mobile === lead.mobile
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              {lead.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{lead.name}</h3>
                {lead.priority === 'Hot' && (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                    HOT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono">+91 {lead.mobile}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => makePhoneCall(lead.mobile)}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-semibold text-xs flex flex-col items-center justify-center gap-1 border border-blue-200 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Call</span>
            </button>

            {onOpenLogModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogModal(lead);
                }}
                className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100/80 text-sky-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 border border-sky-200 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-sky-600" />
                <span>Log Call</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                openWhatsApp(
                  lead.mobile,
                  `नमस्ते ${lead.name} जी, Housing Worlds से ${lead.salesperson || 'टीम'}। ${lead.project ? `प्रोजेक्ट ${lead.project}` : ''} के बारे में बातचीत करने हेतु संपर्क किया।`
                )
              }
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWhatsAppTemplates(lead);
              }}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 border border-indigo-200 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Templates</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(lead.id);
              }}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs flex flex-col items-center justify-center gap-1 border border-slate-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-slate-600" />
              <span>Edit Lead</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Tag className="w-3 h-3" /> Status
              </span>
              <div className="font-bold text-slate-900 mt-1">{lead.status}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Project
              </span>
              <div className="font-bold text-slate-900 mt-1">{lead.project || '—'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Coins className="w-3 h-3" /> Budget
              </span>
              <div className="font-bold text-slate-900 mt-1">{lead.budget || '—'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Maximize2 className="w-3 h-3" /> Plot Size
              </span>
              <div className="font-bold text-slate-900 mt-1">{lead.size || '—'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <User className="w-3 h-3" /> Salesperson
              </span>
              <div className="font-bold text-slate-900 mt-1">
                {lead.salesperson || 'Unassigned'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Next Follow-up
              </span>
              <div
                className={`font-bold mt-1 ${
                  timing === 'overdue'
                    ? 'text-rose-600'
                    : timing === 'today'
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                {fmt(lead.followup)}
              </div>
            </div>
          </div>

          {/* Payment & Target Contribution Card */}
          {(() => {
            const paymentAmt = getLeadPaymentReceived(lead);
            if (
              paymentAmt > 0 ||
              lead.totalDealValue ||
              lead.status === 'Booking' ||
              lead.status === 'Closed'
            ) {
              return (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        पेमेंट व टोकन कलेक्शन
                      </div>
                      <div className="text-base sm:text-lg font-black text-emerald-950">
                        {formatINR(paymentAmt)}{' '}
                        <span className="text-xs font-semibold text-slate-500">
                          {lead.totalDealValue ? `/ डील वैल्यू ${formatINR(lead.totalDealValue)}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      टारगेट में शामिल
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                      {lead.salesperson ? `${lead.salesperson} के टारगेट में काउंटेड` : 'सेल्स टीम टारगेट'}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Remarks Section */}
          <div>
            <span className="text-xs font-semibold text-slate-600 mb-1 block">
              Remarks & Discussion History
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed min-h-[70px]">
              {lead.remarks || 'No remarks recorded for this customer yet.'}
            </div>
          </div>

          {/* Call Tracker History for this Lead */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                <span>Call Logs History ({leadCalls.length})</span>
              </span>
              {onOpenLogModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogModal(lead);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                >
                  + Add Call
                </button>
              )}
            </div>

            {leadCalls.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leadCalls.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {c.outcome}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {fmt(c.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>Caller: <strong>{c.salesperson}</strong></span>
                      <span>Duration: <strong>{formatCallDuration(c.durationSeconds)}</strong></span>
                      <span>Type: {c.callType}</span>
                    </div>
                    {c.notes && (
                      <p className="text-slate-700 text-xs pt-1 border-t border-slate-200/60 mt-1">
                        {c.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                No phone calls logged for this customer yet.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(lead.id);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Lead</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
