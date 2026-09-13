import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check, Send, Sparkles } from 'lucide-react';
import { Lead, WhatsAppTemplate } from '../types';
import { WHATSAPP_TEMPLATES } from '../data/initialData';
import { openWhatsApp } from '../utils/formatters';

interface WhatsAppTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead?: Lead | null;
}

export const WhatsAppTemplatesModal: React.FC<WhatsAppTemplatesModalProps> = ({
  isOpen,
  onClose,
  selectedLead,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    WHATSAPP_TEMPLATES[0].id
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTemplate =
    WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    WHATSAPP_TEMPLATES[0];

  // Fill in variables
  const personalizedText = activeTemplate.message
    .replace(/{name}/g, selectedLead?.name || 'Sir/Ma’am')
    .replace(/{project}/g, selectedLead?.project || 'our prime township')
    .replace(/{size}/g, selectedLead?.size || '100 sq.yd')
    .replace(
      /{salesperson}/g,
      selectedLead?.salesperson || 'Housing Worlds Sales Team'
    );

  const handleCopy = () => {
    navigator.clipboard.writeText(personalizedText);
    setCopiedId(activeTemplate.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = () => {
    if (selectedLead?.mobile) {
      openWhatsApp(selectedLead.mobile, personalizedText);
    } else {
      openWhatsApp('', personalizedText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">WhatsApp Sales Templates</h3>
              <p className="text-xs text-slate-300">
                {selectedLead
                  ? `Personalized for ${selectedLead.name} (${selectedLead.mobile})`
                  : 'Pre-written templates for Housing Worlds property sales'}
              </p>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Template Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Message Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHATSAPP_TEMPLATES.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900">{tpl.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{tpl.subtitle || tpl.labelHindi}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Personalized Message Preview
              </label>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-filled lead details
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line font-sans leading-relaxed">
              {personalizedText}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copiedId ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>
                {selectedLead?.mobile
                  ? `Send to +91 ${selectedLead.mobile}`
                  : 'Open in WhatsApp'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
