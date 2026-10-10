import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  dataDir: process.env.DATA_DIR || path.resolve(process.cwd(), "../../data"),
  isDev: process.env.NODE_ENV !== "production",
};
