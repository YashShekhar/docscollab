# DocsCollab — Production-Ready Real-Time Collaborative Spaces

A modular, production-ready real-time collaborative text editor built with **Turborepo**, **Next.js 14**, **Express**, **Socket.IO**, **TipTap (ProseMirror)**, and **Tailwind CSS**.

Users can create temporary or ongoing writing spaces, invite teammates with a simple link or room code, collaborate simultaneously with live synchronization, and destroy spaces at any time with automatic ejection of all connected participants.

---

## 🏛️ Monorepo Architecture

This repository is organized as a **Turborepo** monorepo using **npm workspaces**:

```
docscollab/
├── apps/
│   ├── frontend/             # Next.js 14 App Router application (port 3000)
│   └── backend/              # Node.js + Express + Socket.IO server (port 3001)
├── packages/
│   ├── types/                # @docscollab/types: Shared TypeScript models & DTOs
│   ├── typescript-config/    # @docscollab/typescript-config: tsconfig presets
│   └── eslint-config/        # @docscollab/eslint-config: Shared linting config
├── data/
│   └── spaces.json           # Dual-layer disk storage
├── doc/
│   ├── 000001-init.md        # Initial implementation documentation
│   └── 000002-turborepo-architecture.md # Turborepo migration details
├── scripts/
│   └── test-collab.js        # Automated multi-client Socket.IO test
├── turbo.json                # Turborepo task pipeline
├── package.json              # Monorepo root workspaces
├── .prettierrc               # Prettier code style configuration
└── .prettierignore
```

---

## ✨ Features

### 🚀 Space Lifecycle Management

- **Create Space**: Create a new collaborative document space instantly with custom or auto-generated names.
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
- **Live Typing Indicator**: Real-time indicator showing _"Alice is typing..."_ when another user edits.
- **User Customization**: Click your avatar to change your display name and choose your signature color from the vibrant palette.
- **Persistence**: Spaces are saved in-memory and debounced to disk (`data/spaces.json`), surviving restarts until destroyed.

---

## 🛠️ Tech Stack

- **Monorepo**: Turborepo (`turbo@2.4.4`), npm workspaces (`npm@10.9.8`)
- **Frontend (`apps/frontend`)**: Next.js 14 App Router, React 18, TipTap Editor, Tailwind CSS, Lucide React, Socket.IO Client
- **Backend (`apps/backend`)**: Node.js, Express, Socket.IO Server, TypeScript, tsup, tsx
- **Shared (`packages/*`)**: TypeScript 5.7, Prettier, ESLint

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ or v20+)
- npm (v10+)

### 1. Installation

Install all dependencies across the entire monorepo:

```bash
npm install
```

### 2. Development Mode

Run both `@docscollab/backend` (port 3001) and `@docscollab/frontend` (port 3000) concurrently via Turbo:

```bash
npm run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)
- **Backend Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

### 3. Production Build

Compile all packages and apps for production:

```bash
npm run build
```

---

## 📋 Available Commands

| Command                | Action                                                                      |
| :--------------------- | :-------------------------------------------------------------------------- |
| `npm run dev`          | Starts frontend & backend concurrently in development mode                  |
| `npm run build`        | Builds `@docscollab/backend` (tsup) and `@docscollab/frontend` (next build) |
| `npm run check-types`  | Typechecks all packages and apps via TypeScript                             |
| `npm run lint`         | Lints all packages and apps via ESLint                                      |
| `npm run format`       | Formats all code and markdown files with Prettier                           |
| `npm run format:check` | Verifies formatting with Prettier                                           |
| `npm run test:e2e`     | Runs automated multi-client Socket.IO integration test                      |

---

## 🧪 Testing Real-Time Collaboration

An automated multi-client integration test script is included in `scripts/test-collab.js`.

To run the test:

```bash
# Ensure backend is running, then:
npm run test:e2e
```

What the test verifies:

1. Creates a new space via HTTP POST.
2. Spawns 2 independent Socket.IO clients and joins the space.
3. Transmits real-time content changes from Client 1 and verifies Client 2 receives the update.
4. Triggers space destruction from Client 1 and verifies all clients receive the `space-destroyed` alert.
5. Verifies that the space is permanently purged from storage (HTTP 404).
