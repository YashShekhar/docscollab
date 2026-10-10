"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  ArrowRight,
  Trash2,
  Sparkles,
  Zap,
  ShieldAlert,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Space } from "@/lib/spaceStore";
import { getStoredUser, LocalUser } from "@/lib/user";
import { DestroyConfirmModal } from "@/components/space/DestroyConfirmModal";

export default function HomePage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<(Space & { activeCollaboratorsCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinInput, setJoinInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [spaceToDestroy, setSpaceToDestroy] = useState<Space | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const res = await fetch("/api/spaces");
      if (res.ok) {
        const data = await res.json();
        setSpaces(data.spaces || []);
      }
    } catch (err) {
      console.error("Failed to fetch spaces:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSpaceTitle.trim() || "Untitled Document",
          creatorName: currentUser?.name || "Collaborator",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        router.push(`/space/${data.space.id}`);
      }
    } catch (err) {
      console.error("Failed to create space:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const input = joinInput.trim();
    if (!input) return;

    // Handle full URL or plain space ID
    let targetId = input;
    if (input.includes("/space/")) {
      const parts = input.split("/space/");
      targetId = parts[parts.length - 1].split("?")[0].split("#")[0];
    }

    if (targetId) {
      router.push(`/space/${targetId}`);
    }
  };

  const handleCopyLink = async (spaceId: string) => {
    const url = `${window.location.origin}/space/${spaceId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(spaceId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleConfirmDestroy = async () => {
    if (!spaceToDestroy) return;

    try {
      const res = await fetch(`/api/spaces/${spaceToDestroy.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSpaces((prev) => prev.filter((s) => s.id !== spaceToDestroy.id));
        setSpaceToDestroy(null);
      }
    } catch (err) {
      console.error("Failed to destroy space:", err);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                DocsCollab
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                Real-Time
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 py-1 pl-1.5 pr-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[11px] font-bold"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span>{currentUser.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-10">
        {/* Hero Section */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Instant Collaborative Spaces
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Create, Collaborate & Destroy Spaces in Real-Time
            </h1>
            <p className="text-base sm:text-lg text-blue-100 font-normal leading-relaxed">
              As simple as a clean text editor. Multiple people can join the same space simultaneously with live syncing, collaborative cursors, and instant space destruction.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg hover:bg-blue-50 active:bg-blue-100 transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                Create New Space
              </button>
            </div>
          </div>
        </div>

        {/* Join or Quick Action Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Join Space Form */}
          <div className="md:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Join an Existing Space
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Enter a Space Room ID or paste a shared URL to jump straight into editing:
            </p>

            <form onSubmit={handleJoinSpace} className="flex gap-2">
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="e.g. welcome-space or https://.../space/welcome-space"
                className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shrink-0"
              >
                <span>Join Space</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick Lifecycle Info */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Space Destruction
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Anyone with access can destroy a space when the meeting or session ends. Destroying immediately purges data and ejects all active collaborators.
            </p>
          </div>
        </div>

        {/* Active Spaces List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Active Spaces
              </h2>
              <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {spaces.length}
              </span>
            </div>

            <button
              onClick={fetchSpaces}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : spaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/50 dark:bg-zinc-900/50">
              <FileText className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                No active spaces
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Create a new space to start collaborating with your team!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Space
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:shadow-md transition-all hover:border-blue-400 dark:hover:border-blue-600 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {space.title}
                        </h3>
                      </div>

                      {/* Active Collaborators count */}
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{space.activeCollaboratorsCount} online</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {space.plainText || "Empty document"}
                    </p>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-3 mt-2 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-zinc-500">#{space.id}</span>
                      <span className="text-[10px] text-zinc-400">{formatDate(space.updatedAt)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(space.id)}
                        title="Copy space link"
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        {copiedId === space.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Destroy Space */}
                      <button
                        type="button"
                        onClick={() => setSpaceToDestroy(space)}
                        title="Destroy this space"
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Open Space */}
                      <button
                        type="button"
                        onClick={() => router.push(`/space/${space.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Create a New Space
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Set a document title or leave blank for an auto-generated title.
            </p>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newSpaceTitle}
                  onChange={(e) => setNewSpaceTitle(e.target.value)}
                  placeholder="e.g. Marketing Strategy 2026"
                  maxLength={60}
                  autoFocus
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating Space...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Launch Space
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destroy Confirmation Modal */}
      {spaceToDestroy && (
        <DestroyConfirmModal
          isOpen={true}
          spaceTitle={spaceToDestroy.title}
          onClose={() => setSpaceToDestroy(null)}
          onConfirm={handleConfirmDestroy}
        />
      )}
    </div>
  );
}
