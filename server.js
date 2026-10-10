const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "spaces.json");

// Ensure global store exists
if (!global.__spaceStore) {
  let initialSpaces = {};
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.spaces === "object") {
        initialSpaces = parsed.spaces;
      }
    } else {
      const now = new Date().toISOString();
      const demoId = "welcome-space";
      initialSpaces[demoId] = {
        id: demoId,
        title: "Welcome to Collaborative Docs",
        content: `<h1>Welcome to Your Collaborative Space</h1>
<p>This is a real-time collaborative text editor built with <strong>Next.js</strong>. Multiple people can join this space simultaneously and edit content together in real-time.</p>
<h2>✨ Features</h2>
<ul>
  <li><strong>Real-time synchronization:</strong> See updates as collaborators type.</li>
  <li><strong>Active presence:</strong> Check the collaborator avatars in the header to see who is currently in this space.</li>
  <li><strong>Rich formatting:</strong> Headings, bold, italic, underline, lists, highlights, code blocks, and alignments.</li>
  <li><strong>Space Lifecycle:</strong> Share the link to invite teammates, or click <em>Destroy Space</em> to permanently purge this room for everyone.</li>
  <li><strong>Export options:</strong> Download your document as Markdown, Plain text, or HTML at any time.</li>
</ul>
<blockquote>Tip: Open this URL in another browser tab or share it with a friend to experience real-time multi-user editing!</blockquote>`,
        plainText: "Welcome to Your Collaborative Space. Real-time text editor with multi-user collaboration.",
        createdAt: now,
        updatedAt: now,
        creatorName: "System",
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify({ spaces: initialSpaces }, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Error initializing spaces:", e);
  }

  global.__spaceStore = {
    spaces: initialSpaces,
    collaborators: {},
  };
}

let saveDiskTimeout = null;
function saveDisk() {
  if (saveDiskTimeout) clearTimeout(saveDiskTimeout);
  saveDiskTimeout = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({ spaces: global.__spaceStore.spaces }, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Failed to write to disk:", err);
    }
  }, 200);
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Make io accessible globally for API routes if needed
  global.__io = io;

  io.on("connection", (socket) => {
    let currentSpaceId = null;
    let currentUser = null;

    socket.on("join-space", ({ spaceId, user }) => {
      currentSpaceId = spaceId;
      currentUser = {
        ...user,
        id: user?.id || socket.id,
        socketId: socket.id,
        joinedAt: Date.now(),
      };

      socket.join(`space:${spaceId}`);

      const store = global.__spaceStore;
      if (!store.collaborators[spaceId]) {
        store.collaborators[spaceId] = {};
      }
      store.collaborators[spaceId][currentUser.id] = currentUser;

      const space = store.spaces[spaceId] || null;
      const collaborators = Object.values(store.collaborators[spaceId]);

      // Return current document state & collaborator list to caller
      socket.emit("space-init", {
        space,
        collaborators,
      });

      // Notify others in this space
      socket.to(`space:${spaceId}`).emit("collaborator-joined", {
        user: currentUser,
        collaborators,
      });
    });

    socket.on("content-change", ({ spaceId, content, plainText, senderId, version }) => {
      const store = global.__spaceStore;
      if (store.spaces[spaceId]) {
        store.spaces[spaceId].content = content;
        if (plainText !== undefined) {
          store.spaces[spaceId].plainText = plainText;
        }
        store.spaces[spaceId].updatedAt = new Date().toISOString();
        saveDisk();
      }

      // Broadcast update to all other collaborators in the room
      socket.to(`space:${spaceId}`).emit("content-update", {
        content,
        plainText,
        senderId,
        version,
        updatedAt: new Date().toISOString(),
      });
    });

    socket.on("title-change", ({ spaceId, title, senderId }) => {
      const store = global.__spaceStore;
      if (store.spaces[spaceId]) {
        store.spaces[spaceId].title = (title || "").trim() || "Untitled Document";
        store.spaces[spaceId].updatedAt = new Date().toISOString();
        saveDisk();
      }

      socket.to(`space:${spaceId}`).emit("title-update", {
        title,
        senderId,
      });
    });

    socket.on("cursor-move", ({ spaceId, userId, cursor, name, color }) => {
      socket.to(`space:${spaceId}`).emit("cursor-update", {
        userId,
        cursor,
        name,
        color,
      });
    });

    socket.on("typing-indicator", ({ spaceId, userId, isTyping }) => {
      const store = global.__spaceStore;
      if (store.collaborators[spaceId] && store.collaborators[spaceId][userId]) {
        store.collaborators[spaceId][userId].isTyping = isTyping;
      }

      socket.to(`space:${spaceId}`).emit("typing-update", {
        userId,
        isTyping,
      });
    });

    socket.on("destroy-space", ({ spaceId, userId, userName }) => {
      const store = global.__spaceStore;
      const spaceExisted = !!store.spaces[spaceId];

      if (spaceExisted) {
        delete store.spaces[spaceId];
        delete store.collaborators[spaceId];
        saveDisk();

        // Broadcast to EVERYONE in this room (including sender)
        io.to(`space:${spaceId}`).emit("space-destroyed", {
          spaceId,
          destroyedBy: userName || "A collaborator",
        });

        // Eject all sockets from room
        io.in(`space:${spaceId}`).socketsLeave(`space:${spaceId}`);
      }
    });

    socket.on("leave-space", ({ spaceId, userId }) => {
      leaveCurrentSpace(spaceId, userId);
    });

    socket.on("disconnect", () => {
      if (currentSpaceId && currentUser) {
        leaveCurrentSpace(currentSpaceId, currentUser.id);
      }
    });

    function leaveCurrentSpace(spaceId, userId) {
      socket.leave(`space:${spaceId}`);
      const store = global.__spaceStore;
      if (store.collaborators[spaceId]) {
        delete store.collaborators[spaceId][userId];
        const remaining = Object.values(store.collaborators[spaceId]);
        socket.to(`space:${spaceId}`).emit("collaborator-left", {
          userId,
          collaborators: remaining,
        });
      }
    }
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
