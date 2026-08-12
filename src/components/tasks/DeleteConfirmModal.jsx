import React from 'react';
import { Button } from '../ui/Button';
import { X, Trash2 } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, taskTitle = '' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-bg-card border border-border-card w-full max-w-sm rounded-xl p-6 relative shadow-2xl glass-panel space-y-4 text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3 text-rose-400">
          <Trash2 className="w-6 h-6 flex-shrink-0" />
          <h3 className="text-lg font-bold font-display">Delete Task?</h3>
        </div>

        {/* Alert text */}
        <p className="text-sm text-text-muted leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-text-primary">"{taskTitle}"</span>? This action cannot be undone.
        </p>

        {/* Buttons Action Row */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="border border-border-card hover:bg-zinc-800/10 px-4 rounded-lg text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20 px-4 rounded-lg text-xs font-semibold"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
