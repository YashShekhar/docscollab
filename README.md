# DocsCollab — Real-Time Collaborative Space Editor

A fast, minimalist real-time collaborative text editor built with **Next.js**, **Socket.IO**, **TipTap (ProseMirror)**, and **Tailwind CSS**.

Users can create temporary or ongoing writing spaces, invite multiple people with a simple link or room code, collaborate simultaneously with live synchronization, and destroy spaces at any time with automatic ejection of all connected participants.

---

## ✨ Features

### 🚀 Space Lifecycle Management
- **Create Space**: Create a new collaborative document space instantly with custom or auto-generated titles.
- **Join Space**: Join any active space via direct URL (`/space/[id]`) or by entering the room ID on the dashboard.
- **Share Space**: 1-click URL and Room ID copying with real-time invite modal.
- **Destroy Space**: Any collaborator or host can click **"Destroy Space"** to permanently wipe the space from disk and memory.
- **Instant Destruction Ejection**: When a space is destroyed, all connected participants across all browsers immediately receive an animated alert informing them who destroyed the space and automatically redirecting them to the home dashboard.

### ✍️ Simple & Powerful Text Editing
- **TipTap Rich Text Engine**: Built on ProseMirror for reliable, conflict-free editing.
- **Formatting Tools**:
  - Headings (Normal, H1, H2, H3)
  - Bold, Italic, Underline, Strikethrough, Highlight
  - Text Alignments (Left, Center, Right, Justify)
  - Bullet Lists, Numbered Lists, Blockquotes, Code Blocks
  - Undo & Redo (with keyboard shortcuts `Ctrl+Z`, `Ctrl+Y`)
  - Clear formatting
- **Live Document Metrics**: Real-time word count, character count, and estimated reading time.
- **Export Options**:
  - Download as Plain Text (`.txt`)
  - Download as Markdown (`.md`)
  - Download as Web Page (`.html`)
  - Print / Save as PDF (`window.print`)

### 👥 Real-Time Collaboration & Presence
- **Ultra-low Latency Sync**: Socket.IO WebSockets synchronize keystrokes instantly across multiple windows and devices.
- **Active Collaborator Avatars**: Real-time presence bar showing active participants with custom avatars and initials.
- **Live Typing Indicator**: Real-time indicator showing *"Alice is typing..."* when another user edits.
- **User Customization**: Click your avatar to change your display name and choose your signature color from the vibrant palette.
- **Persistence**: Spaces are saved to memory and automatically debounced to disk (`data/spaces.json`), surviving restarts until destroyed.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Real-Time Communication**: [Socket.IO](https://socket.io/) (WebSockets + polling fallback)
- **Editor**: [TipTap](https://tiptap.dev/) (`@tiptap/react`, `@tiptap/starter-kit`, Underline, Highlight, TextAlign, Placeholder)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Google Docs paper aesthetic
- **Icons**: [Lucide React](https://lucide.dev/)
- **Server**: Custom Node.js HTTP server (`server.js`) integrating Next.js request handling and Socket.IO real-time rooms.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### 1. Installation
```bash
npm install
```

### 2. Development Mode
Run the unified Next.js + Socket.IO server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 🧪 Testing Real-Time Collaboration

An automated multi-client integration test script is included in `scripts/test-collab.js`.

To run the test:
```bash
node scripts/test-collab.js
```

What the test verifies:
1. Creates a new space via HTTP POST.
2. Spawns 2 independent Socket.IO clients and joins the space.
3. Transmits real-time content changes from Client 1 and verifies Client 2 receives the update.
4. Triggers space destruction from Client 1 and verifies all clients receive the `space-destroyed` alert.
5. Verifies that the space is permanently purged from storage (HTTP 404).

---

## 📂 Project Structure

```
docscollab/
├── data/
│   └── spaces.json                # Persisted space storage
├── scripts/
│   └── test-collab.js             # Automated multi-client integration test
├── src/
│   ├── app/
│   │   ├── api/spaces/            # REST API for listing & creating spaces
│   │   │   └── route.ts
│   │   ├── api/spaces/[id]/       # REST API for single space & destruction
│   │   │   └── route.ts
│   │   ├── space/[id]/            # Space document route
│   │   │   └── page.tsx
│   │   ├── globals.css            # Typography & document paper styling
│   │   ├── layout.tsx             # Root layout with fonts & metadata
│   │   └── page.tsx               # Spaces Dashboard & creation UI
│   ├── components/
│   │   ├── editor/
│   │   │   ├── CollaborativeEditor.tsx  # TipTap collaborative wrapper & stats
│   │   │   └── EditorToolbar.tsx        # Formatting bar & export options
│   │   └── space/
│   │       ├── DestroyConfirmModal.tsx  # Safety modal for space destruction
│   │       ├── ShareModal.tsx           # Link & room ID sharing modal
│   │       ├── SpaceDestroyedAlert.tsx  # Real-time alert overlay on destroy
│   │       ├── SpaceHeader.tsx          # Real-time document title & presence
│   │       └── UserProfileModal.tsx     # Display name & avatar color picker
│   ├── hooks/
│   │   └── useSocket.ts           # Socket.io synchronization & presence hook
│   └── lib/
│       ├── spaceStore.ts          # In-memory + disk space persistence layer
│       └── user.ts                # Client identity & random user generator
├── server.js                      # Custom HTTP server with Next.js + Socket.IO
├── package.json
└── tsconfig.json
```
