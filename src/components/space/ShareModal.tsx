"use client";

import React, { useState } from "react";
import { Copy, Check, X, Share2, Users } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  spaceId: string;
  spaceTitle: string;
  onClose: () => void;
}

export function ShareModal({ isOpen, spaceId, spaceTitle, onClose }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const url = typeof window !== "undefined" ? window.location.href : `/space/${spaceId}`;

  const copyToClipboard = async (text: string, isLink: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Share2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Share &quot;{spaceTitle}&quot;
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Anyone with this link can collaborate in real-time
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Direct Space URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate border border-zinc-200 dark:border-zinc-700">
                {url}
              </div>
              <button
                onClick={() => copyToClipboard(url, true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shrink-0"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Space Room ID
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                {spaceId}
              </div>
              <button
                onClick={() => copyToClipboard(spaceId, false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors shrink-0"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode ? "Copied!" : "Copy ID"}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 flex items-start gap-2.5">
            <Users className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              <strong>Live Collaboration:</strong> Anyone visiting will join instantly with their own colored cursor and live presence. No login or signup required.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
