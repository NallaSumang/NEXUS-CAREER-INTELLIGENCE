import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { Redis } from "ioredis";

let redisAvailable = false;

const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    // Stop reconnecting after first failure — no Redis installed locally
    retryStrategy: () => null,
  },
);

redisConnection.on("error", () => {
  // Silently swallow — Redis is optional for local dev
});

redisConnection.on("connect", () => {
  redisAvailable = true;
  console.log("✅ Redis connected");
});

export { redisAvailable };
export default redisConnection;
