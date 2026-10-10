import fs from "fs";
import path from "path";
import { Space, SpaceWithStats, Collaborator, CreateSpaceDto } from "@docscollab/types";
import { config } from "../config";

const DEFAULT_DOC_HTML = `
<h1>Welcome to Your Collaborative Space</h1>
<p>This is a real-time collaborative text editor built with <strong>Next.js</strong> and <strong>Socket.IO</strong> in a modular <strong>Turborepo</strong> monorepo architecture.</p>
<h2>✨ Features</h2>
<ul>
  <li><strong>Real-time synchronization:</strong> Keystrokes are synchronized with sub-millisecond latency.</li>
  <li><strong>Active presence:</strong> Real-time collaborator avatars and live typing indicators.</li>
  <li><strong>Rich formatting:</strong> Headings, bold, italic, underline, lists, highlights, code blocks, and alignments.</li>
  <li><strong>Space Lifecycle:</strong> Share the link to invite teammates, or click <em>Destroy Space</em> to permanently purge this room for everyone.</li>
  <li><strong>Export options:</strong> Download your document as Markdown, Plain text, or HTML at any time.</li>
</ul>
<blockquote>Tip: Open this URL in another browser tab or share it with a friend to experience real-time multi-user editing!</blockquote>
`;

class SpaceStore {
  private spaces: Map<string, Space> = new Map();
  private collaborators: Map<string, Map<string, Collaborator>> = new Map(); // spaceId -> userId -> Collaborator
  private dataFilePath: string;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.dataFilePath = path.join(config.dataDir, "spaces.json");
    this.initStorage();
  }

  private initStorage(): void {
    try {
      if (!fs.existsSync(config.dataDir)) {
        fs.mkdirSync(config.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.spaces === "object") {
          for (const [id, space] of Object.entries(parsed.spaces)) {
            this.spaces.set(id, space as Space);
          }
        }
      } else {
        // Seed default welcome space
        const now = new Date().toISOString();
        const demoId = "welcome-space";
        const initialSpace: Space = {
          id: demoId,
          title: "Welcome to Collaborative Docs",
          content: DEFAULT_DOC_HTML,
          plainText:
            "Welcome to Your Collaborative Space. Real-time text editor with multi-user collaboration.",
          createdAt: now,
          updatedAt: now,
          creatorName: "System",
        };
        this.spaces.set(demoId, initialSpace);
        this.persistImmediate();
      }
    } catch (err) {
      console.error("[SpaceStore] Error initializing storage:", err);
    }
  }

  private persistImmediate(): void {
    try {
      if (!fs.existsSync(config.dataDir)) {
        fs.mkdirSync(config.dataDir, { recursive: true });
      }
      const data = {
        spaces: Object.fromEntries(this.spaces),
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[SpaceStore] Failed to write to disk:", err);
    }
  }

  private persistDebounced(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.persistImmediate();
    }, 200);
  }

  public generateSpaceId(): string {
    const adjectives = [
      "amber",
      "bold",
      "calm",
      "clever",
      "cosmic",
      "crystal",
      "dawn",
      "echo",
      "flame",
      "frost",
      "golden",
      "harmony",
      "lunar",
      "mystic",
      "nebula",
      "nova",
      "ocean",
      "orbit",
      "prism",
      "quiet",
      "radiant",
      "silver",
      "solar",
      "swift",
      "timber",
      "vibrant",
      "zenith",
    ];
    const nouns = [
      "atlas",
      "beacon",
      "breeze",
      "canyon",
      "canvas",
      "compass",
      "cove",
      "drift",
      "ember",
      "feather",
      "forest",
      "glade",
      "harbor",
      "haven",
      "island",
      "meadow",
      "oasis",
      "orbit",
      "pathway",
      "pioneer",
      "ridge",
      "river",
      "summit",
      "valley",
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj}-${noun}-${num}`;
  }

  public getAllSpaces(): SpaceWithStats[] {
    return Array.from(this.spaces.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((space) => {
        const spaceCollabs = this.collaborators.get(space.id);
        const count = spaceCollabs ? spaceCollabs.size : 0;
        return {
          ...space,
          activeCollaboratorsCount: count,
        };
      });
  }

  public getSpace(id: string): Space | null {
    return this.spaces.get(id) || null;
  }

  public createSpace(dto?: CreateSpaceDto): Space {
    const id = this.generateSpaceId();
    const now = new Date().toISOString();

    const space: Space = {
      id,
      title: dto?.title?.trim() || "Untitled Document",
      content: dto?.content || DEFAULT_DOC_HTML,
      plainText: "Welcome to your new document.",
      createdAt: now,
      updatedAt: now,
      creatorName: dto?.creatorName || "Anonymous",
    };

    this.spaces.set(id, space);
    this.persistDebounced();
    return space;
  }

  public updateContent(id: string, content: string, plainText?: string): Space | null {
    const space = this.spaces.get(id);
    if (!space) return null;

    space.content = content;
    if (plainText !== undefined) {
      space.plainText = plainText;
    }
    space.updatedAt = new Date().toISOString();
    this.persistDebounced();
    return space;
  }

  public updateTitle(id: string, title: string): Space | null {
    const space = this.spaces.get(id);
    if (!space) return null;

    space.title = title.trim() || "Untitled Document";
    space.updatedAt = new Date().toISOString();
    this.persistDebounced();
    return space;
  }

  public destroySpace(id: string): boolean {
    const exists = this.spaces.has(id);
    if (!exists) return false;

    this.spaces.delete(id);
    this.collaborators.delete(id);
    this.persistImmediate();
    return true;
  }

  // Collaborator presence methods
  public addCollaborator(spaceId: string, collaborator: Collaborator): Collaborator[] {
    if (!this.collaborators.has(spaceId)) {
      this.collaborators.set(spaceId, new Map());
    }
    const map = this.collaborators.get(spaceId)!;
    map.set(collaborator.id, collaborator);
    return Array.from(map.values());
  }

  public removeCollaborator(spaceId: string, collaboratorId: string): Collaborator[] {
    const map = this.collaborators.get(spaceId);
    if (map) {
      map.delete(collaboratorId);
      return Array.from(map.values());
    }
    return [];
  }

  public removeCollaboratorBySocket(
    socketId: string
  ): { spaceId: string; collaborators: Collaborator[]; removedUser?: Collaborator }[] {
    const affected: {
      spaceId: string;
      collaborators: Collaborator[];
      removedUser?: Collaborator;
    }[] = [];

    for (const [spaceId, map] of this.collaborators.entries()) {
      for (const [userId, collab] of map.entries()) {
        if (collab.socketId === socketId) {
          map.delete(userId);
          affected.push({
            spaceId,
            collaborators: Array.from(map.values()),
            removedUser: collab,
          });
        }
      }
    }

    return affected;
  }

  public getCollaborators(spaceId: string): Collaborator[] {
    const map = this.collaborators.get(spaceId);
    return map ? Array.from(map.values()) : [];
  }

  public setTyping(spaceId: string, userId: string, isTyping: boolean): Collaborator[] {
    const map = this.collaborators.get(spaceId);
    if (map && map.has(userId)) {
      map.get(userId)!.isTyping = isTyping;
      return Array.from(map.values());
    }
    return [];
  }
}

export const spaceStore = new SpaceStore();
