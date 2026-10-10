import { Router, Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { spaceStore } from "../store/spaceStore";
import { CreateSpaceDto } from "@docscollab/types";

export function createSpacesRouter(io: SocketIOServer): Router {
  const router = Router();

  // GET /api/spaces - List all spaces
  router.get("/", (_req: Request, res: Response) => {
    try {
      const spaces = spaceStore.getAllSpaces();
      return res.json({ spaces });
    } catch (error) {
      console.error("[SpacesRouter] Error fetching spaces:", error);
      return res.status(500).json({ error: "Failed to fetch spaces" });
    }
  });

  // POST /api/spaces - Create a space
  router.post("/", (req: Request, res: Response) => {
    try {
      const body = req.body as CreateSpaceDto;
      const space = spaceStore.createSpace(body);
      return res.status(201).json({ space });
    } catch (error) {
      console.error("[SpacesRouter] Error creating space:", error);
      return res.status(500).json({ error: "Failed to create space" });
    }
  });

  // GET /api/spaces/:id - Get a single space
  router.get("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const space = spaceStore.getSpace(id);

      if (!space) {
        return res.status(404).json({ error: "Space not found" });
      }

      return res.json({ space });
    } catch (error) {
      console.error("[SpacesRouter] Error getting space:", error);
      return res.status(500).json({ error: "Failed to retrieve space" });
    }
  });

  // DELETE /api/spaces/:id - Destroy a space
  router.delete("/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const destroyed = spaceStore.destroySpace(id);

      if (!destroyed) {
        return res.status(404).json({ error: "Space not found or already destroyed" });
      }

      // Broadcast space-destroyed to socket room and eject sockets
      const roomName = `space:${id}`;
      io.to(roomName).emit("space-destroyed", {
        spaceId: id,
        destroyedBy: "Collaborator via API",
      });
      io.in(roomName).socketsLeave(roomName);

      return res.json({
        success: true,
        message: `Space ${id} destroyed successfully`,
      });
    } catch (error) {
      console.error("[SpacesRouter] Error destroying space:", error);
      return res.status(500).json({ error: "Failed to destroy space" });
    }
  });

  return router;
}
