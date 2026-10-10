import { Server, Socket } from "socket.io";
import { spaceStore } from "../store/spaceStore";
import { Collaborator, CursorPosition } from "@docscollab/types";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    let currentUser: Collaborator | null = null;

    socket.on(
      "join-space",
      ({
        spaceId,
        user,
      }: {
        spaceId: string;
        user: { id: string; name: string; color: string };
      }) => {
        currentUser = {
          ...user,
          socketId: socket.id,
          joinedAt: Date.now(),
        };

        const roomName = `space:${spaceId}`;
        socket.join(roomName);

        const space = spaceStore.getSpace(spaceId);
        const collaborators = spaceStore.addCollaborator(spaceId, currentUser);

        // Send initial space state and participant list to client
        socket.emit("space-init", {
          space,
          collaborators,
        });

        // Notify others in room
        socket.to(roomName).emit("collaborator-joined", {
          user: currentUser,
          collaborators,
        });
      }
    );

    socket.on(
      "content-change",
      ({
        spaceId,
        content,
        plainText,
        senderId,
        version,
      }: {
        spaceId: string;
        content: string;
        plainText?: string;
        senderId: string;
        version: number;
      }) => {
        spaceStore.updateContent(spaceId, content, plainText);

        socket.to(`space:${spaceId}`).emit("content-update", {
          content,
          plainText,
          senderId,
          version,
          updatedAt: new Date().toISOString(),
        });
      }
    );

    socket.on(
      "title-change",
      ({ spaceId, title, senderId }: { spaceId: string; title: string; senderId: string }) => {
        spaceStore.updateTitle(spaceId, title);

        socket.to(`space:${spaceId}`).emit("title-update", {
          title,
          senderId,
        });
      }
    );

    socket.on(
      "cursor-move",
      ({
        spaceId,
        userId,
        cursor,
        name,
        color,
      }: {
        spaceId: string;
        userId: string;
        cursor: CursorPosition;
        name: string;
        color: string;
      }) => {
        socket.to(`space:${spaceId}`).emit("cursor-update", {
          userId,
          cursor,
          name,
          color,
        });
      }
    );

    socket.on(
      "typing-indicator",
      ({ spaceId, userId, isTyping }: { spaceId: string; userId: string; isTyping: boolean }) => {
        spaceStore.setTyping(spaceId, userId, isTyping);

        socket.to(`space:${spaceId}`).emit("typing-update", {
          userId,
          isTyping,
        });
      }
    );

    socket.on("destroy-space", ({ spaceId, userName }: { spaceId: string; userName: string }) => {
      const destroyed = spaceStore.destroySpace(spaceId);

      if (destroyed) {
        const roomName = `space:${spaceId}`;
        // Broadcast to EVERY participant in the space room
        io.to(roomName).emit("space-destroyed", {
          spaceId,
          destroyedBy: userName || "A collaborator",
        });

        // Eject all sockets from the destroyed room
        io.in(roomName).socketsLeave(roomName);
      }
    });

    socket.on("leave-space", ({ spaceId, userId }: { spaceId: string; userId: string }) => {
      socket.leave(`space:${spaceId}`);
      const remaining = spaceStore.removeCollaborator(spaceId, userId);
      socket.to(`space:${spaceId}`).emit("collaborator-left", {
        userId,
        collaborators: remaining,
      });
    });

    socket.on("disconnect", () => {
      const affected = spaceStore.removeCollaboratorBySocket(socket.id);
      for (const { spaceId, collaborators, removedUser } of affected) {
        if (removedUser) {
          socket.to(`space:${spaceId}`).emit("collaborator-left", {
            userId: removedUser.id,
            collaborators,
          });
        }
      }
    });
  });
}
