import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Lead } from '../types';

interface DeleteConfirmModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">Delete Lead?</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Are you sure you want to remove <strong>{lead.name}</strong> (+91 {lead.mobile})?
            This will remove the lead and all its follow-up records.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
