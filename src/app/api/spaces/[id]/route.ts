import { NextResponse } from "next/server";
import { getSpace, destroySpace } from "@/lib/spaceStore";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const space = getSpace(id);

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json({ space });
  } catch (error) {
    console.error("Failed to get space:", error);
    return NextResponse.json({ error: "Failed to get space" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const success = destroySpace(id);

    if (!success) {
      return NextResponse.json({ error: "Space not found or already destroyed" }, { status: 404 });
    }

    // If socket server is globally available, emit space-destroyed event
    type SocketServer = {
      to: (room: string) => { emit: (ev: string, data: unknown) => void };
      in: (room: string) => { socketsLeave: (room: string) => void };
    };
    const globalIo = (global as unknown as { __io?: SocketServer }).__io;
    if (globalIo) {
      globalIo.to(`space:${id}`).emit("space-destroyed", {
        spaceId: id,
        destroyedBy: "Collaborator via API",
      });
      globalIo.in(`space:${id}`).socketsLeave(`space:${id}`);
    }

    return NextResponse.json({ success: true, message: `Space ${id} destroyed successfully` });
  } catch (error) {
    console.error("Failed to destroy space:", error);
    return NextResponse.json({ error: "Failed to destroy space" }, { status: 500 });
  }
}
