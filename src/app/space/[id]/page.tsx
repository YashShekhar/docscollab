"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { SpaceHeader } from "@/components/space/SpaceHeader";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import { SpaceDestroyedAlert } from "@/components/space/SpaceDestroyedAlert";
import { LocalUser, getStoredUser } from "@/lib/user";
import { Space } from "@/lib/spaceStore";
import { Loader2, AlertCircle, Plus, Home } from "lucide-react";
import Link from "next/link";

export default function SpacePage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [initialData, setInitialData] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  // Load user profile from localStorage
  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
  }, []);

  // Fetch initial space data
  useEffect(() => {
    if (!spaceId) return;

    async function fetchSpace() {
      try {
        setLoading(true);
        const res = await fetch(`/api/spaces/${spaceId}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load space");

        const data = await res.json();
        setInitialData(data.space);
        setNotFound(false);
      } catch (err) {
        console.error("Error loading space:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSpace();
  }, [spaceId]);

  const {
    isConnected,
    collaborators,
    spaceData,
    isDestroyed,
    destroyInfo,
    remoteTyping,
    sendContentChange,
    sendTitleChange,
    sendTypingIndicator,
    requestDestroySpace,
    registerContentChangeHandler,
    registerTitleChangeHandler,
  } = useSocket(spaceId, currentUser);

  // Handle auto-creating this space if not found
  const handleCreateSpace = async () => {
    if (!spaceId) return;
    setIsCreatingSpace(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Space ${spaceId}`,
          creatorName: currentUser?.name || "Collaborator",
        }),
      });
      if (res.ok) {
        const { space } = await res.json();
        router.push(`/space/${space.id}`);
      }
    } catch (err) {
      console.error("Failed to create space:", err);
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleDestroy = useCallback(async () => {
    // Tell socket server to notify all users and wipe space
    requestDestroySpace();
    // Also call REST endpoint to guarantee deletion
    try {
      await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
    } catch {
      // Ignore
    }
  }, [requestDestroySpace, spaceId]);

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Entering space #{spaceId}...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Space Not Found
          </h2>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            The space <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">#{spaceId}</span> does not exist or may have already been destroyed.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={handleCreateSpace}
              disabled={isCreatingSpace}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isCreatingSpace ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Space with this ID
                </>
              )}
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Return to All Spaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveTitle = spaceData?.title || initialData?.title || "Untitled Document";
  const effectiveContent = spaceData?.content || initialData?.content || "";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Real-time Header */}
      <SpaceHeader
        spaceId={spaceId}
        initialTitle={effectiveTitle}
        isConnected={isConnected}
        collaborators={collaborators}
        currentUser={currentUser}
        onTitleChange={sendTitleChange}
        onDestroySpace={handleDestroy}
        onUpdateCurrentUser={setCurrentUser}
        registerTitleChangeHandler={registerTitleChangeHandler}
      />

      {/* Real-time TipTap Collaborative Document Canvas */}
      <CollaborativeEditor
        initialContent={effectiveContent}
        documentTitle={effectiveTitle}
        onContentChange={sendContentChange}
        onTyping={sendTypingIndicator}
        registerContentChangeHandler={registerContentChangeHandler}
        remoteTyping={remoteTyping}
        collaborators={collaborators}
        currentUserId={currentUser.id}
      />

      {/* Destruction Alert Modal (if another collaborator destroys this space) */}
      {isDestroyed && (
        <SpaceDestroyedAlert destroyedBy={destroyInfo?.destroyedBy} />
      )}
    </div>
  );
}
