"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { LocalUser, saveStoredUser } from "@/lib/user";

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: LocalUser;
  onClose: () => void;
  onUpdate: (updated: LocalUser) => void;
}

const PALETTE = [
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#D97706",
  "#059669",
  "#0D9488",
  "#0284C7",
  "#4F46E5",
  "#9333EA",
  "#E11D48",
];

export function UserProfileModal({
  isOpen,
  currentUser,
  onClose,
  onUpdate,
}: UserProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LocalUser = {
      ...currentUser,
      name: name.trim() || "Anonymous",
      color,
    };
    saveStoredUser(updated);
    onUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm shadow-sm"
            style={{ backgroundColor: color }}
          >
            {name.trim() ? name.trim().charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Collaborator Profile
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Change how others see you in this space
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Your name"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Avatar & Cursor Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-white scale-105"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
