"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Share2, Trash2, ChevronLeft } from "lucide-react";
import { Collaborator, LocalUser } from "@docscollab/types";
import { ShareModal } from "./ShareModal";
import { DestroyConfirmModal } from "./DestroyConfirmModal";
import { UserProfileModal } from "./UserProfileModal";

interface SpaceHeaderProps {
  spaceId: string;
  initialTitle: string;
  isConnected: boolean;
  collaborators: Collaborator[];
  currentUser: LocalUser;
  onTitleChange: (newTitle: string) => void;
  onDestroySpace: () => Promise<void> | void;
  onUpdateCurrentUser: (user: LocalUser) => void;
  registerTitleChangeHandler: (fn: (title: string) => void) => void;
}

export function SpaceHeader({
  spaceId,
  initialTitle,
  isConnected,
  collaborators,
  currentUser,
  onTitleChange,
  onDestroySpace,
  onUpdateCurrentUser,
  registerTitleChangeHandler,
}: SpaceHeaderProps) {
  const [title, setTitle] = useState(initialTitle || "Untitled Document");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDestroyOpen, setIsDestroyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    registerTitleChangeHandler((remoteTitle: string) => {
      setTitle(remoteTitle);
    });
  }, [registerTitleChangeHandler]);

  const handleTitleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsEditingTitle(false);
    const trimmed = title.trim() || "Untitled Document";
    setTitle(trimmed);
    setSaveStatus("saving");
    onTitleChange(trimmed);
    setTimeout(() => setSaveStatus("saved"), 500);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 print:hidden">
      {/* Left: Back button + Doc Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
          title="Back to All Spaces"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 shadow-sm">
          <FileText className="h-5 w-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleTitleSubmit()}
                  autoFocus
                  maxLength={60}
                  className="rounded border border-blue-500 bg-white dark:bg-zinc-800 px-2 py-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </form>
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename document"
                className="cursor-pointer truncate text-base font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1.5 py-0.5 transition-colors"
              >
                {title}
              </h1>
            )}

            {/* Save / sync status badge */}
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {isConnected ? (saveStatus === "saved" ? "Saved" : "Saving...") : "Reconnecting..."}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="font-mono text-[11px]">#{spaceId}</span>
          </div>
        </div>
      </div>

      {/* Right: Collaborators + Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Collaborators Avatar Stack */}
        <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden py-1">
          {collaborators.slice(0, 5).map((collab) => {
            const isSelf = collab.id === currentUser.id;
            const initial = collab.name ? collab.name.charAt(0).toUpperCase() : "U";

            return (
              <div
                key={collab.id}
                title={`${collab.name}${isSelf ? " (You)" : ""}`}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold border-2 border-white dark:border-zinc-900 shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer"
                style={{ backgroundColor: collab.color || "#2563EB" }}
                onClick={() => isSelf && setIsProfileOpen(true)}
              >
                {initial}
                {collab.isTyping && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            );
          })}

          {collaborators.length > 5 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border-2 border-white dark:border-zinc-900">
              +{collaborators.length - 5}
            </div>
          )}
        </div>

        {/* User Identity Pill (Click to change name/color) */}
        <button
          onClick={() => setIsProfileOpen(true)}
          title="Customize your name and avatar"
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-1 pl-1 pr-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
        >
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
          </div>
          <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentUser.name}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => setIsShareOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-2xs"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Destroy Space Button */}
        <button
          onClick={() => setIsDestroyOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors shadow-2xs"
          title="Permanently destroy this space for all collaborators"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Destroy Space</span>
        </button>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={isShareOpen}
        spaceId={spaceId}
        spaceTitle={title}
        onClose={() => setIsShareOpen(false)}
      />

      <DestroyConfirmModal
        isOpen={isDestroyOpen}
        spaceTitle={title}
        onClose={() => setIsDestroyOpen(false)}
        onConfirm={onDestroySpace}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={onUpdateCurrentUser}
      />
    </header>
  );
}
