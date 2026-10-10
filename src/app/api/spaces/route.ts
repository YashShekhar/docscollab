import { NextResponse } from "next/server";
import { getAllSpaces, createSpace } from "@/lib/spaceStore";

export async function GET() {
  try {
    const spaces = getAllSpaces();
    return NextResponse.json({ spaces });
  } catch (error) {
    console.error("Failed to fetch spaces:", error);
    return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, creatorName } = body;
    const space = createSpace({
      title: title || "Untitled Document",
      creatorName: creatorName || "Collaborator",
    });
    return NextResponse.json({ space }, { status: 201 });
  } catch (error) {
    console.error("Failed to create space:", error);
    return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
  }
}
