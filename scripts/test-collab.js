const { io } = require("socket.io-client");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function run() {
  console.log(`Connecting to Backend at ${BACKEND_URL}...`);

  console.log("1. Testing Space Creation via HTTP POST...");
  const createRes = await fetch(`${BACKEND_URL}/api/spaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Monorepo Collaboration Space",
      creatorName: "Sarah",
    }),
  });

  const { space } = await createRes.json();
  console.log("Created space:", space.id, "Title:", space.title);

  if (!space || !space.id) {
    throw new Error("Failed to create space!");
  }

  console.log("\n2. Connecting 2 collaborative clients via Socket.IO...");
  const socket1 = io(BACKEND_URL, { transports: ["websocket"] });
  const socket2 = io(BACKEND_URL, { transports: ["websocket"] });

  await new Promise((resolve) => socket1.on("connect", resolve));
  await new Promise((resolve) => socket2.on("connect", resolve));
  console.log("Both socket clients connected successfully.");

  // Join space
  socket1.emit("join-space", {
    spaceId: space.id,
    user: { id: "usr_1", name: "Sarah", color: "#2563EB" },
  });

  socket2.emit("join-space", {
    spaceId: space.id,
    user: { id: "usr_2", name: "David", color: "#10B981" },
  });

  // Client 2 verifies presence of Client 1
  await new Promise((resolve) => {
    socket2.on("collaborator-joined", (data) => {
      console.log("Client 2 observed collaborator-joined:", data.user.name);
      resolve(data);
    });
    // In case already present in space-init
    socket2.on("space-init", (data) => {
      console.log("Client 2 received space-init with collaborators:", data.collaborators.length);
      if (data.collaborators.some((c) => c.name === "Sarah")) {
        resolve(data);
      }
    });
  });

  console.log("\n3. Testing Real-Time Content Sync...");
  const updatedHtml = "<p>Real-time collaborative edits from Sarah in Turborepo!</p>";

  const contentPromise = new Promise((resolve) => {
    socket2.on("content-update", (data) => {
      console.log("Client 2 received live content update:", data.content);
      resolve(data);
    });
  });

  socket1.emit("content-change", {
    spaceId: space.id,
    content: updatedHtml,
    plainText: "Real-time collaborative edits from Sarah in Turborepo!",
    senderId: "usr_1",
    version: 1,
  });

  await contentPromise;

  console.log("\n4. Testing Space Destruction & Real-Time Ejection...");
  const destroyPromise1 = new Promise((resolve) => {
    socket1.on("space-destroyed", (data) => {
      console.log("Client 1 received space-destroyed alert! Destroyed by:", data.destroyedBy);
      resolve(data);
    });
  });

  const destroyPromise2 = new Promise((resolve) => {
    socket2.on("space-destroyed", (data) => {
      console.log("Client 2 received space-destroyed alert! Destroyed by:", data.destroyedBy);
      resolve(data);
    });
  });

  // Sarah clicks "Destroy Space"
  socket1.emit("destroy-space", {
    spaceId: space.id,
    userName: "Sarah",
  });

  await Promise.all([destroyPromise1, destroyPromise2]);

  console.log("\n5. Verifying space is purged from API...");
  const verifyRes = await fetch(`${BACKEND_URL}/api/spaces/${space.id}`);
  console.log("Fetch destroyed space HTTP status:", verifyRes.status, "(expected 404)");

  socket1.disconnect();
  socket2.disconnect();

  if (verifyRes.status === 404) {
    console.log(
      "\n✅ ALL REAL-TIME COLLABORATION & DESTRUCTION TESTS PASSED SUCCESSFULLY IN TURBOREPO!"
    );
    process.exit(0);
  } else {
    throw new Error("Space was not purged!");
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
