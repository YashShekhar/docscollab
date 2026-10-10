"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  Space,
  Collaborator,
  LocalUser,
  CursorPosition,
  CollaboratorCursor,
} from "@docscollab/types";

interface DestroyInfo {
  destroyedBy: string;
}

export function useSocket(spaceId: string, user: LocalUser | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [spaceData, setSpaceData] = useState<Space | null>(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [destroyInfo, setDestroyInfo] = useState<DestroyInfo | null>(null);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CollaboratorCursor>>({});
  const [remoteTyping, setRemoteTyping] = useState<Record<string, boolean>>({});

  // Handlers for remote content and title changes
  const onRemoteContentChangeRef = useRef<((content: string) => void) | null>(null);
  const onRemoteTitleChangeRef = useRef<((title: string) => void) | null>(null);

  useEffect(() => {
    if (!spaceId || !user) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-space", { spaceId, user });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(
      "space-init",
      ({ space, collaborators }: { space: Space | null; collaborators: Collaborator[] }) => {
        if (space) {
          setSpaceData(space);
        }
        if (collaborators) {
          setCollaborators(collaborators);
        }
      }
    );

    socket.on("collaborator-joined", ({ collaborators }: { collaborators: Collaborator[] }) => {
      setCollaborators(collaborators);
    });

    socket.on(
      "collaborator-left",
      ({ userId, collaborators }: { userId: string; collaborators: Collaborator[] }) => {
        setCollaborators(collaborators);
        setRemoteCursors((prev) => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
        setRemoteTyping((prev) => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }
    );

    socket.on("content-update", ({ content, senderId }: { content: string; senderId: string }) => {
      if (senderId !== user.id && onRemoteContentChangeRef.current) {
        onRemoteContentChangeRef.current(content);
      }
    });

    socket.on("title-update", ({ title, senderId }: { title: string; senderId: string }) => {
      if (senderId !== user.id) {
        if (onRemoteTitleChangeRef.current) {
          onRemoteTitleChangeRef.current(title);
        }
        setSpaceData((prev) => (prev ? { ...prev, title } : null));
      }
    });

    socket.on("cursor-update", ({ userId, cursor, name, color }: CollaboratorCursor) => {
      if (userId !== user.id) {
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { userId, cursor, name, color },
        }));
      }
    });

    socket.on("typing-update", ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId !== user.id) {
        setRemoteTyping((prev) => ({
          ...prev,
          [userId]: isTyping,
        }));
      }
    });

    socket.on("space-destroyed", ({ destroyedBy }: { destroyedBy: string }) => {
      setIsDestroyed(true);
      setDestroyInfo({ destroyedBy });
    });

    return () => {
      socket.emit("leave-space", { spaceId, userId: user.id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [spaceId, user]);

  const sendContentChange = useCallback(
    (content: string, plainText?: string) => {
      if (socketRef.current && socketRef.current.connected && user) {
        socketRef.current.emit("content-change", {
          spaceId,
          content,
          plainText,
          senderId: user.id,
          version: Date.now(),
        });
      }
    },
    [spaceId, user]
  );

  const sendTitleChange = useCallback(
    (title: string) => {
      if (socketRef.current && socketRef.current.connected && user) {
        socketRef.current.emit("title-change", {
          spaceId,
          title,
          senderId: user.id,
        });
      }
    },
    [spaceId, user]
  );

  const sendCursorMove = useCallback(
    (cursor: CursorPosition) => {
      if (socketRef.current && socketRef.current.connected && user) {
        socketRef.current.emit("cursor-move", {
          spaceId,
          userId: user.id,
          cursor,
          name: user.name,
          color: user.color,
        });
      }
    },
    [spaceId, user]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (socketRef.current && socketRef.current.connected && user) {
        socketRef.current.emit("typing-indicator", {
          spaceId,
          userId: user.id,
          isTyping,
        });
      }
    },
    [spaceId, user]
  );

  const requestDestroySpace = useCallback(() => {
    if (socketRef.current && user) {
      socketRef.current.emit("destroy-space", {
        spaceId,
        userId: user.id,
        userName: user.name,
      });
    }
  }, [spaceId, user]);

  return {
    isConnected,
    collaborators,
    spaceData,
    isDestroyed,
    destroyInfo,
    remoteCursors,
    remoteTyping,
    sendContentChange,
    sendTitleChange,
    sendCursorMove,
    sendTypingIndicator,
    requestDestroySpace,
    registerContentChangeHandler: (fn: (content: string) => void) => {
      onRemoteContentChangeRef.current = fn;
    },
    registerTitleChangeHandler: (fn: (title: string) => void) => {
      onRemoteTitleChangeRef.current = fn;
    },
  };
}
