"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DestroyConfirmModalProps {
  isOpen: boolean;
  spaceTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DestroyConfirmModal({
  isOpen,
  spaceTitle,
  onClose,
  onConfirm,
}: DestroyConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/40"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Destroy this Space?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Action cannot be undone</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            You are about to permanently destroy{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              &quot;{spaceTitle}&quot;
            </span>
            .
          </p>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">
            ⚠️ <strong>Instant Disconnect:</strong> All collaborators currently in this room will be
            ejected, and the document contents will be wiped immediately.
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Destroying...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Yes, Destroy Space
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
