import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config";
import { createSpacesRouter } from "./routes/spacesRouter";
import { healthRouter } from "./routes/healthRouter";
import { setupSocketHandlers } from "./socket/socketHandler";

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json());

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin === "*" ? "*" : config.corsOrigin,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Setup Socket handlers
setupSocketHandlers(io);

// Setup API routes
app.use("/health", healthRouter);
app.use("/api/spaces", createSpacesRouter(io));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error("[Backend Error]", err);
  res.status(500).json({ error: "Internal Server Error" });
});

server.listen(config.port, config.host, () => {
  console.log(`[Backend] @docscollab/backend running on http://${config.host}:${config.port}`);
  console.log(`[Backend] Health check: http://${config.host}:${config.port}/health`);
  console.log(`[Backend] Spaces API: http://${config.host}:${config.port}/api/spaces`);
});

export { app, server, io };
