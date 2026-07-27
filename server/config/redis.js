import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { Redis } from "ioredis";

let _redisReady = false;

const isProduction = process.env.NODE_ENV === "production";

const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    // In production: retry up to 10 times with exponential backoff (max 10s)
    // In dev: null = give up immediately so the app still starts without Redis
    retryStrategy: isProduction
      ? (times) => {
          if (times > 10) return null; // give up after 10 attempts
          return Math.min(times * 500, 10000);
        }
      : () => null,
  },
);

redisConnection.on("error", (err) => {
  _redisReady = false;
  if (isProduction) {
    console.error("❌ Redis error:", err.message);
  }
  // Silently swallow in dev — Redis is optional for local development
});

redisConnection.on("connect", () => {
  _redisReady = true;
  console.log("✅ Redis connected");
});

redisConnection.on("close", () => {
  _redisReady = false;
});

// Expose live status as a function (not a stale boolean snapshot)
export const isRedisReady = () => _redisReady;
export default redisConnection;
