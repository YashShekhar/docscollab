import fs from "fs";
import path from "path";

export interface Space {
  id: string;
  title: string;
  content: string;
  plainText?: string;
  createdAt: string;
  updatedAt: string;
  creatorName?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  isTyping?: boolean;
}

// In-process memory store for fast access
interface StoreData {
  spaces: Record<string, Space>;
  collaborators: Record<string, Record<string, Collaborator>>; // spaceId -> socketId -> Collaborator
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "spaces.json");

// Default initial content
const DEFAULT_DOC_HTML = `
<h1>Welcome to Your Collaborative Space</h1>
<p>This is a real-time collaborative text editor built with <strong>Next.js</strong>. Multiple people can join this space simultaneously and edit content together in real-time.</p>
<h2>✨ Features</h2>
<ul>
  <li><strong>Real-time synchronization:</strong> See updates as collaborators type.</li>
  <li><strong>Active presence:</strong> Check the collaborator avatars in the header to see who is currently in this space.</li>
  <li><strong>Rich formatting:</strong> Headings, bold, italic, underline, lists, highlights, code blocks, and alignments.</li>
  <li><strong>Space Lifecycle:</strong> Share the link to invite teammates, or click <em>Destroy Space</em> to permanently purge this room for everyone.</li>
  <li><strong>Export options:</strong> Download your document as Markdown, Plain text, or HTML at any time.</li>
</ul>
<blockquote>Tip: Open this URL in another browser tab or share it with a friend to experience real-time multi-user editing!</blockquote>
`;

// Global variable attached to global to survive Next.js module reloads in dev mode
const globalStore = global as unknown as { __spaceStore?: StoreData };

function ensureDataLoaded(): StoreData {
  if (globalStore.__spaceStore) {
    return globalStore.__spaceStore;
  }

  const initialData: StoreData = {
    spaces: {},
    collaborators: {},
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.spaces === "object") {
        initialData.spaces = parsed.spaces;
      }
    } else {
      // Seed initial demo space
      const demoId = "welcome-space";
      const now = new Date().toISOString();
      initialData.spaces[demoId] = {
        id: demoId,
        title: "Welcome to Collaborative Docs",
        content: DEFAULT_DOC_HTML,
        plainText: "Welcome to Your Collaborative Space. Real-time text editor with multi-user collaboration.",
        createdAt: now,
        updatedAt: now,
        creatorName: "System",
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify({ spaces: initialData.spaces }, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error reading spaces from disk:", err);
  }

  globalStore.__spaceStore = initialData;
  return initialData;
}

let saveTimeout: NodeJS.Timeout | null = null;
function persistToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = ensureDataLoaded();
      fs.writeFileSync(DATA_FILE, JSON.stringify({ spaces: data.spaces }, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist spaces to disk:", err);
    }
  }, 300);
}

// Generate friendly slug
export function generateSpaceId(): string {
  const adjectives = [
    "amber", "bold", "calm", "clever", "cosmic", "crystal", "dawn", "echo",
    "flame", "frost", "golden", "harmony", "lunar", "mystic", "nebula", "nova",
    "ocean", "orbit", "prism", "quiet", "radiant", "silver", "solar", "swift",
    "timber", "vibrant", "zenith"
  ];
  const nouns = [
    "atlas", "beacon", "breeze", "canyon", "canvas", "compass", "cove", "drift",
    "ember", "feather", "forest", "glade", "harbor", "haven", "island", "meadow",
    "oasis", "orbit", "pathway", "pioneer", "ridge", "river", "summit", "valley"
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}-${noun}-${num}`;
}

export function getAllSpaces(): (Space & { activeCollaboratorsCount: number })[] {
  const store = ensureDataLoaded();
  return Object.values(store.spaces)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((space) => {
      const activeCount = Object.keys(store.collaborators[space.id] || {}).length;
      return {
        ...space,
        activeCollaboratorsCount: activeCount,
      };
    });
}

export function getSpace(id: string): Space | null {
  const store = ensureDataLoaded();
  return store.spaces[id] || null;
}

export function createSpace(options?: { id?: string; title?: string; creatorName?: string; content?: string }): Space {
  const store = ensureDataLoaded();
  const id = options?.id || generateSpaceId();
  const now = new Date().toISOString();
  
  const space: Space = {
    id,
    title: options?.title?.trim() || "Untitled Document",
    content: options?.content || DEFAULT_DOC_HTML,
    plainText: "Welcome to your new document.",
    createdAt: now,
    updatedAt: now,
    creatorName: options?.creatorName || "Anonymous",
  };

  store.spaces[id] = space;
  if (!store.collaborators[id]) {
    store.collaborators[id] = {};
  }

  persistToDisk();
  return space;
}

export function updateSpaceContent(id: string, content: string, plainText?: string): Space | null {
  const store = ensureDataLoaded();
  const space = store.spaces[id];
  if (!space) return null;

  space.content = content;
  if (plainText !== undefined) {
    space.plainText = plainText;
  }
  space.updatedAt = new Date().toISOString();
  persistToDisk();
  return space;
}

export function updateSpaceTitle(id: string, title: string): Space | null {
  const store = ensureDataLoaded();
  const space = store.spaces[id];
  if (!space) return null;

  space.title = title.trim() || "Untitled Document";
  space.updatedAt = new Date().toISOString();
  persistToDisk();
  return space;
}

export function destroySpace(id: string): boolean {
  const store = ensureDataLoaded();
  if (!store.spaces[id]) return false;

  delete store.spaces[id];
  delete store.collaborators[id];
  persistToDisk();
  return true;
}

// Collaborator tracking
export function addCollaborator(spaceId: string, collaborator: Collaborator): Collaborator[] {
  const store = ensureDataLoaded();
  if (!store.collaborators[spaceId]) {
    store.collaborators[spaceId] = {};
  }
  store.collaborators[spaceId][collaborator.id] = collaborator;
  return Object.values(store.collaborators[spaceId]);
}

export function removeCollaborator(spaceId: string, collaboratorId: string): Collaborator[] {
  const store = ensureDataLoaded();
  if (store.collaborators[spaceId]) {
    delete store.collaborators[spaceId][collaboratorId];
    return Object.values(store.collaborators[spaceId]);
  }
  return [];
}

export function removeCollaboratorFromAll(collaboratorId: string): { spaceId: string; collaborators: Collaborator[] }[] {
  const store = ensureDataLoaded();
  const affected: { spaceId: string; collaborators: Collaborator[] }[] = [];

  for (const spaceId of Object.keys(store.collaborators)) {
    if (store.collaborators[spaceId][collaboratorId]) {
      delete store.collaborators[spaceId][collaboratorId];
      affected.push({
        spaceId,
        collaborators: Object.values(store.collaborators[spaceId]),
      });
    }
  }

  return affected;
}

export function getCollaborators(spaceId: string): Collaborator[] {
  const store = ensureDataLoaded();
  return Object.values(store.collaborators[spaceId] || {});
}

export function setCollaboratorTyping(spaceId: string, collaboratorId: string, isTyping: boolean): Collaborator[] {
  const store = ensureDataLoaded();
  if (store.collaborators[spaceId] && store.collaborators[spaceId][collaboratorId]) {
    store.collaborators[spaceId][collaboratorId].isTyping = isTyping;
    return Object.values(store.collaborators[spaceId]);
  }
  return [];
}
