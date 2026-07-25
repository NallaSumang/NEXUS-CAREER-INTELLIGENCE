import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// 🛑 MUST BE FIRST 🛑
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// 🛑🛑🛑🛑🛑🛑🛑

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Initialize middlewares, routes
const initializeApp = async () => {
  // 1. MongoDB Connect
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ MongoDB failed:", err.message);
  }

  // 2. Firebase Init
  try {
    await import("./config/firebase.js");
    console.log("✅ Firebase initialized");
  } catch (err) {
    console.error("⚠️ Firebase init failed:", err.message);
  }

  // 3. Routes
  try {
    const { default: authRoutes } = await import("./routes/auth.routes.js");
    const { default: resumeRoutes } = await import("./routes/resume.routes.js");
    const { default: aiRoutes } = await import("./routes/ai.routes.js");
    // Add new application routes
    const { default: applicationRoutes } =
      await import("./routes/application.routes.js");

    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/resumes", resumeRoutes);
    app.use("/api/v1/ai", aiRoutes);
    app.use("/api/v1/applications", applicationRoutes);

    // Serve React frontend statically in production/unified environments
    const clientDist = path.resolve(__dirname, "../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next(); // Let error handler catch API 404s
      }
      res.sendFile(path.resolve(clientDist, "index.html"));
    });

    app.use(errorHandler);
  } catch (err) {
    console.error("❌ Failed to load routes:", err.message);
  }

  // 4. BullMQ Workers (Only if not running on Vercel)
  if (process.env.VERCEL !== "1") {
    try {
      const { default: redis } = await import("./config/redis.js");
      if (redis.status === "wait") {
        await redis.connect();
      }
      await import("./queues/workers/resumeWorker.js");
      await import("./queues/workers/matchWorker.js");
      console.log("✅ BullMQ workers started");
    } catch (err) {
      console.warn(
        "⚠️ Redis unavailable — AI queue workers disabled",
        err.message,
      );
    }
  }
};

// Initialize if running as a standalone Express server
if (process.env.VERCEL !== "1") {
  initializeApp().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ API Server 🚀 http://localhost:${PORT}`);
    });
  });
}

// Export for serverless (Vercel)
export default async (req, res) => {
  // Wait for initialisation
  await initializeApp();
  return app(req, res);
};
